import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = express.Router();

// Get all contacts for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const contacts = await prisma.contact.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Create a new contact
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, phone, group } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        const contact = await prisma.contact.create({
            data: {
                userId,
                name,
                phone,
                group: group || null
            }
        });

        res.status(201).json(contact);
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

// Bulk create contacts
router.post('/bulk', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { contacts } = req.body;
        
        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'An array of contacts is required' });
        }

        const validContacts = contacts
            .filter(c => c.name && c.phone)
            .map(c => ({
                userId,
                name: c.name,
                phone: c.phone,
                group: c.group || null
            }));

        if (validContacts.length === 0) {
            return res.status(400).json({ error: 'No valid contacts provided' });
        }

        const result = await prisma.contact.createMany({
            data: validContacts
        });

        res.status(201).json({ success: true, count: result.count });
    } catch (error) {
        console.error('Error in bulk creating contacts:', error);
        res.status(500).json({ error: 'Failed to bulk create contacts' });
    }
});

// Update a contact
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const id = req.params.id as string;
        const { name, phone, group } = req.body;

        // Ensure the contact belongs to the user
        const existing = await prisma.contact.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const contact = await prisma.contact.update({
            where: { id },
            data: {
                name: name || existing.name,
                phone: phone || existing.phone,
                group: group !== undefined ? group : existing.group
            }
        });

        res.json(contact);
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// Delete a contact
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const id = req.params.id as string;

        // Ensure the contact belongs to the user
        const contact = await prisma.contact.findUnique({ where: { id } });
        if (!contact || contact.userId !== userId) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        await prisma.contact.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

export default router;
