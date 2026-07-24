import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { waManager } from '../index';
import prisma from '../prisma';

const router = express.Router();

router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Ensure client is initialized
        await waManager.initializeClient(userId);

        res.json({
            ready: waManager.isReady(userId),
            qr: waManager.getQrCode(userId)
        });
    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        await waManager.destroyClient(userId);
        res.json({ success: true, message: 'Logged out of WhatsApp successfully' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// Get all WhatsApp groups
router.get('/groups', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!waManager.isReady(userId)) {
            return res.status(400).json({ error: 'WhatsApp is not connected yet. Please go to Settings and scan the QR code.' });
        }

        const client = waManager.getClient(userId);
        if (!client) {
            return res.status(400).json({ error: 'WhatsApp client session not found' });
        }

        let groupData: any[] = [];
        const pupPage = (client as any).pupPage;

        if (pupPage) {
            try {
                groupData = await pupPage.evaluate(async () => {
                    try {
                        const ChatCollection = window.require('WAWebCollections').Chat;
                        const models = ChatCollection ? ChatCollection.getModelsArray() : [];
                        const results = [];
                        for (const chat of models) {
                            try {
                                const isGroup = chat.isGroup || (chat.id && chat.id.server === 'g.us');
                                if (isGroup) {
                                    const participants = chat.groupMetadata?.participants || chat.participants || [];
                                    results.push({
                                        id: typeof chat.id === 'object' ? chat.id._serialized : chat.id,
                                        name: chat.name || chat.formattedTitle || 'Unnamed Group',
                                        unreadCount: chat.unreadCount || 0,
                                        timestamp: chat.t || 0,
                                        participantsCount: participants.length || 0
                                    });
                                }
                            } catch (e) {}
                        }
                        return results;
                    } catch (e) {
                        return [];
                    }
                });
            } catch (e) {}
        }

        if (groupData.length === 0) {
            try {
                const chats = await client.getChats();
                const groups = (chats || []).filter(chat => chat.isGroup);
                groupData = groups.map(group => {
                    const participants = (group as any).participants || (group as any).groupMetadata?.participants || [];
                    return {
                        id: group.id._serialized,
                        name: group.name || 'Unnamed Group',
                        unreadCount: group.unreadCount || 0,
                        timestamp: group.timestamp,
                        participantsCount: participants.length
                    };
                });
            } catch (e) {}
        }

        res.json(groupData);
    } catch (error: any) {
        console.error('Error fetching groups:', error?.stack || error);
        res.status(500).json({ error: 'Failed to fetch groups. Please wait 2 seconds and click Refresh Groups.' });
    }
});

// Extract contacts from a specific group
router.post('/groups/:id/extract', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!waManager.isReady(userId)) {
            return res.status(400).json({ error: 'WhatsApp client is not ready' });
        }

        const client = waManager.getClient(userId);
        if (!client) {
            return res.status(400).json({ error: 'Client not found' });
        }

        const groupId = req.params.id as string;
        let participantsList: { phoneId: string, name: string }[] = [];
        let groupName = 'Extracted Group';

        // Fallback or Primary: Try native whatsapp-web.js GroupChat fetching first/as robust fallback
        try {
            const chat = await client.getChatById(groupId);
            if (chat && chat.isGroup) {
                groupName = chat.name || groupName;
                const groupChat = chat as any;
                
                // Fetch group participants
                let participants = groupChat.participants || [];
                if ((!participants || participants.length === 0) && groupChat.groupMetadata?.participants) {
                    participants = groupChat.groupMetadata.participants;
                }

                if (participants && participants.length > 0) {
                    for (const p of participants) {
                        const phoneId = typeof p.id === 'object' ? p.id._serialized : p.id;
                        if (!phoneId) continue;
                        let name = phoneId.split('@')[0];
                        try {
                            const contact = await client.getContactById(phoneId);
                            name = contact.name || contact.pushname || contact.shortName || name;
                        } catch (e) {}
                        participantsList.push({ phoneId, name });
                    }
                }
            }
        } catch (e) {
            console.log('Native getChatById failed, trying puppeteer evaluate fallback...', e);
        }

        const pupPage = (client as any).pupPage;

        // Puppeteer evaluation fallback if native method returned empty
        if (participantsList.length === 0 && pupPage) {
            try {
                const rawData = await pupPage.evaluate(async (gid: string) => {
                    try {
                        const win = window as any;
                        const ChatCollection = win.require ? win.require('WAWebCollections').Chat : null;
                        let target = ChatCollection ? ChatCollection.get(gid) : null;
                        if (!target && win.Store?.Chat) {
                            target = win.Store.Chat.get(gid);
                        }
                        if (!target) return null;

                        const parts = target.groupMetadata?.participants || target.participants || [];
                        const list = [];
                        for (const p of parts) {
                            const pid = typeof p.id === 'object' ? (p.id._serialized || p.id.user + '@c.us') : p.id;
                            const pName = p.name || p.contact?.name || p.contact?.pushname || (pid ? pid.split('@')[0] : 'Contact');
                            if (pid) list.push({ phoneId: pid, name: pName });
                        }
                        return { name: target.name || target.formattedTitle || 'Extracted Group', participants: list };
                    } catch (e) {
                        return null;
                    }
                }, groupId);

                if (rawData && rawData.participants && rawData.participants.length > 0) {
                    groupName = rawData.name || groupName;
                    participantsList = rawData.participants;
                }
            } catch (e) {}
        }

        if (participantsList.length === 0) {
            return res.status(400).json({ error: 'Could not fetch group participants. Please ensure WhatsApp is active and connected.' });
        }

        let addedCount = 0;
        let duplicateCount = 0;
        const groupTag = groupName; // Exact original group name

        const existingContacts = await prisma.contact.findMany({
            where: { userId },
            select: { phone: true }
        });
        const existingPhoneSet = new Set(existingContacts.map(c => c.phone));

        for (const item of participantsList) {
            const rawDigits = item.phoneId.split('@')[0];
            const formattedPhone = rawDigits.startsWith('+') ? rawDigits : `+${rawDigits}`;

            if (!existingPhoneSet.has(formattedPhone) && !existingPhoneSet.has(rawDigits)) {
                await prisma.contact.create({
                    data: {
                        userId,
                        name: item.name,
                        phone: formattedPhone,
                        group: groupTag
                    }
                });
                addedCount++;
                existingPhoneSet.add(formattedPhone);
            } else {
                duplicateCount++;
            }
        }

        res.json({ 
            success: true, 
            message: `Extracted ${addedCount} contacts from ${groupName}`,
            extracted: addedCount,
            groupName: groupName,
            stats: {
                total: participantsList.length,
                added: addedCount,
                duplicates: duplicateCount
            }
        });

    } catch (error) {
        console.error('Error extracting group contacts:', error);
        res.status(500).json({ error: 'Failed to extract group contacts' });
    }
});

export default router;
