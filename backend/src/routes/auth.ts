import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me_in_prod';

import { authenticateToken, AuthRequest } from '../middleware/auth';

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user: any = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                plan: 'FREE',
                sentMessagesCount: 0
            } as any
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                plan: user.plan || 'FREE',
                sentMessagesCount: user.sentMessagesCount || 0
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user: any = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            message: 'Login successful', 
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                plan: user.plan || 'FREE',
                sentMessagesCount: user.sentMessagesCount || 0
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to log in.' });
    }
});

// Get profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user: any = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            plan: user.plan || 'FREE',
            sentMessagesCount: user.sentMessagesCount || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Upgrade plan to PRO (₹99)
router.post('/upgrade', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const updatedUser: any = await (prisma.user as any).update({
            where: { id: userId },
            data: { plan: 'PRO' }
        });

        res.json({
            message: 'Successfully upgraded to Pro Plan! Unlimited bulk messaging unlocked.',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                phone: updatedUser.phone,
                plan: updatedUser.plan || 'PRO',
                sentMessagesCount: updatedUser.sentMessagesCount || 0
            }
        });
    } catch (error) {
        console.error('Upgrade error:', error);
        res.status(500).json({ error: 'Failed to upgrade plan' });
    }
});

export default router;
