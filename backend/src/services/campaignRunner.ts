import { waManager } from '../index';
import prisma from '../prisma';
import { MessageMedia } from 'whatsapp-web.js';
import path from 'path';

export async function runCampaign(campaignId: string, userId: string) {
    const client = waManager.getClient(userId);
    if (!client || !waManager.isReady(userId)) {
        console.error(`Cannot run campaign ${campaignId}: Client not ready`);
        return;
    }

    let campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) return;

    // Update status to RUNNING if not already
    if (campaign.status !== 'RUNNING') {
        campaign = await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'RUNNING' }
        });
    }

    // Handle targetGroup filter (supports comma-separated multiple groups e.g. "Group A, Group B")
    let contactsQuery: any = { userId };
    if (campaign.targetGroup) {
        const groups = campaign.targetGroup.split(',').map(g => g.trim()).filter(Boolean);
        if (groups.length === 1) {
            contactsQuery.group = groups[0];
        } else if (groups.length > 1) {
            contactsQuery.group = { in: groups };
        }
    }
    const allContacts = await prisma.contact.findMany({ where: contactsQuery, orderBy: { id: 'asc' } });
    
    // Resume from where it left off
    const targetContacts = allContacts.slice(campaign.lastProcessedIndex);

    let failedCount = campaign.failedCount;
    let successfulCount = campaign.successfulCount;
    let currentBatchSent = 0;
    let lastProcessedIndex = campaign.lastProcessedIndex;

    let media: MessageMedia | null = null;
    if (campaign.mediaUrl) {
        try {
            const filename = campaign.mediaUrl.replace('/uploads/', '');
            const absolutePath = path.join(__dirname, '..', '..', 'uploads', filename);
            media = MessageMedia.fromFilePath(absolutePath);
        } catch (e) {
            console.error('Failed to load media file:', e);
        }
    }

    try {
        for (let i = 0; i < targetContacts.length; i++) {
            const contact = targetContacts[i];

            // Check if campaign was paused or deleted
            const currentCampaignState = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { status: true } });
            if (!currentCampaignState || currentCampaignState.status === 'PAUSED') {
                console.log(`Campaign ${campaignId} paused at index ${lastProcessedIndex}`);
                return;
            }

            // Check Free plan message limit
            const userState = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, sentMessagesCount: true } });
            if (userState && (userState as any).plan === 'FREE' && (userState as any).sentMessagesCount >= 5) {
                console.log(`User ${userId} reached Free Plan limit of 5 messages. Pausing campaign.`);
                await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { status: 'PAUSED', successfulCount, failedCount, lastProcessedIndex }
                });
                return;
            }

            // Check Blocklist before sending
            const isBlocked = await prisma.blocklist.findUnique({
                where: {
                    userId_phone: {
                        userId,
                        phone: contact.phone
                    }
                }
            });

            if (!isBlocked) {
                try {
                    let cleanPhone = contact.phone.replace('@c.us', '').replace(/\D/g, '');
                    const chatId = `${cleanPhone}@c.us`;
                    
                    const personalizedMessage = campaign.message.replace(/{{name}}/gi, contact.name);

                    const delay = Math.floor(Math.random() * (15000 - 8000 + 1) + 8000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    if (media) {
                        await client.sendMessage(chatId, media, { caption: personalizedMessage });
                    } else {
                        await client.sendMessage(chatId, personalizedMessage);
                    }
                    
                    successfulCount++;
                    await prisma.user.update({
                        where: { id: userId },
                        data: { sentMessagesCount: { increment: 1 } }
                    });
                    console.log(`Campaign ${campaignId}: Sent to ${contact.phone}`);
                } catch (err) {
                    console.error(`Failed to send to ${contact.phone}:`, err);
                    failedCount++;
                }
            } else {
                console.log(`Skipped blocked contact: ${contact.phone}`);
            }

            lastProcessedIndex++;
            currentBatchSent++;

            // Update progress in DB every message
            await prisma.campaign.update({
                where: { id: campaignId },
                data: { successfulCount, failedCount, lastProcessedIndex }
            });

            // Handle Batching
            if (campaign.batchSize && campaign.batchDelayMinutes && currentBatchSent >= campaign.batchSize) {
                if (i < targetContacts.length - 1) { // If not the last contact
                    console.log(`Batch size reached for campaign ${campaignId}. Waiting for ${campaign.batchDelayMinutes} minutes.`);
                    currentBatchSent = 0;
                    
                    // Wait for the delay
                    await new Promise(resolve => setTimeout(resolve, campaign.batchDelayMinutes! * 60 * 1000));
                }
            }
        }
        
        const finalStatus = (failedCount === allContacts.length && allContacts.length > 0) ? 'FAILED' : 'COMPLETED';
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: finalStatus, successfulCount, failedCount, lastProcessedIndex }
        });
    } catch (error) {
        console.error(`Error running campaign ${campaignId}:`, error);
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'FAILED', successfulCount, failedCount, lastProcessedIndex }
        });
    }
}
