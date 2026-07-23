import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = express.Router();

// Get recent chats (unique contacts with latest message)
router.get('/chats', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Group by contactPhone, get latest message
        // Since SQLite doesn't support complex distinct on in Prisma natively easily,
        // we'll fetch all messages for user ordered by time, and filter manually
        const messages = await prisma.message.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
        });

        const latestMessagesMap = new Map();
        for (const msg of messages) {
            if (!latestMessagesMap.has(msg.contactPhone)) {
                latestMessagesMap.set(msg.contactPhone, msg);
            }
        }

        const chats = Array.from(latestMessagesMap.values());
        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get messages for a specific contact
router.get('/:contactPhone', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const contactPhone = req.params.contactPhone as string;

        const messages = await prisma.message.findMany({
            where: { userId, contactPhone },
            orderBy: { timestamp: 'asc' } // Oldest to newest for chat UI
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

export default router;
