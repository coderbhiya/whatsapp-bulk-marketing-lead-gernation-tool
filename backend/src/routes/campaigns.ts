import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import { waManager } from '../index';
import { MessageMedia } from 'whatsapp-web.js';
import path from 'path';
import { runCampaign } from '../services/campaignRunner';

const router = express.Router();

// Get all campaigns for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const campaigns = await prisma.campaign.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        
        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// Create a new campaign
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, message, targetGroup, mediaUrl, scheduledAt, batchSize, batchDelayMinutes } = req.body;
        
        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }

        const campaign = await prisma.campaign.create({
            data: {
                userId,
                name,
                message,
                mediaUrl: mediaUrl || null,
                targetGroup: targetGroup || null,
                status: scheduledAt ? 'SCHEDULED' : 'PENDING',
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                batchSize: batchSize || null,
                batchDelayMinutes: batchDelayMinutes || null
            }
        });

        res.status(201).json(campaign);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

// Run a campaign
router.post('/:id/run', authenticateToken, async (req: AuthRequest, res) => {
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

        const id = req.params.id as string;

        // Check user plan and limits
        const user: any = await prisma.user.findUnique({ where: { id: userId } });
        if (user && user.plan === 'FREE' && (user.sentMessagesCount || 0) >= 5) {
            return res.status(403).json({ 
                error: 'Free plan limit reached (5 messages sent). Upgrade to PRO Plan for ₹99 to send unlimited bulk messages!' 
            });
        }

        // Ensure the campaign belongs to the user
        const campaign = await prisma.campaign.findUnique({ where: { id } });
        if (!campaign || campaign.userId !== userId) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (campaign.status === 'RUNNING') {
            return res.status(400).json({ error: 'Campaign is already running' });
        }

        // Respond immediately to the frontend
        res.json({ message: 'Campaign started successfully' });

        // Run the background task
        runCampaign(id, userId).catch(console.error);

    } catch (error) {
        console.error('Error starting campaign:', error);
        res.status(500).json({ error: 'Failed to start campaign' });
    }
});

// Pause a campaign
router.post('/:id/pause', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const id = req.params.id as string;
        const campaign = await prisma.campaign.findUnique({ where: { id } });
        
        if (!campaign || campaign.userId !== userId) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (campaign.status !== 'RUNNING' && campaign.status !== 'SCHEDULED') {
            return res.status(400).json({ error: 'Only running or scheduled campaigns can be paused' });
        }

        await prisma.campaign.update({
            where: { id },
            data: { status: 'PAUSED' }
        });

        res.json({ message: 'Campaign paused successfully' });
    } catch (error) {
        console.error('Error pausing campaign:', error);
        res.status(500).json({ error: 'Failed to pause campaign' });
    }
});

// Resume a campaign
router.post('/:id/resume', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const id = req.params.id as string;
        const campaign = await prisma.campaign.findUnique({ where: { id } });
        
        if (!campaign || campaign.userId !== userId) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (campaign.status !== 'PAUSED') {
            return res.status(400).json({ error: 'Only paused campaigns can be resumed' });
        }

        res.json({ message: 'Campaign resumed successfully' });

        // Run the background task
        runCampaign(id, userId).catch(console.error);
    } catch (error) {
        console.error('Error resuming campaign:', error);
        res.status(500).json({ error: 'Failed to resume campaign' });
    }
});

// Update a campaign
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const id = req.params.id as string;
        const { name, message, targetGroup, mediaUrl } = req.body;

        // Ensure the campaign belongs to the user
        const existing = await prisma.campaign.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (existing.status !== 'PENDING') {
            return res.status(400).json({ error: 'Cannot edit a campaign that has already started running.' });
        }

        const campaign = await prisma.campaign.update({
            where: { id },
            data: {
                name: name || existing.name,
                message: message || existing.message,
                mediaUrl: mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
                targetGroup: targetGroup !== undefined ? targetGroup : existing.targetGroup
            }
        });

        res.json(campaign);
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
});

// Delete a campaign
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const id = req.params.id as string;

        // Ensure the campaign belongs to the user
        const campaign = await prisma.campaign.findUnique({ where: { id } });
        if (!campaign || campaign.userId !== userId) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        await prisma.campaign.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
});

export default router;
