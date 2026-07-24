import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import contactsRoutes from './routes/contacts';
import campaignsRoutes from './routes/campaigns';
import whatsappRoutes from './routes/whatsapp';
import inboxRoutes from './routes/inbox';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: '*', // In production, replace with your frontend URL
        methods: ['GET', 'POST']
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me_in_prod';

// Socket middleware for authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token'));
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        socket.data.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    console.log(`[Socket] User ${userId} connected`);
    socket.join(userId);

    // Initialize WhatsApp client and send current status
    waManager.initializeClient(userId);
    socket.emit('status', {
        ready: waManager.isReady(userId),
        qr: waManager.getQrCode(userId)
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] User ${userId} disconnected`);
    });
});

const port = process.env.PORT || 3001;

// Setup static serving for uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Setup multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

import paymentRoutes from './routes/payment';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/payment', paymentRoutes);

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the relative URL to access the file
    res.json({ url: `/uploads/${req.file.filename}` });
});

// WhatsApp Manager for Multi-tenancy
class WhatsAppManager {
    private clients: Map<string, Client> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private readyStates: Map<string, boolean> = new Map();

    private initializing: Map<string, boolean> = new Map();

    public getClient(userId: string): Client | undefined {
        return this.clients.get(userId);
    }

    public isReady(userId: string): boolean {
        return this.readyStates.get(userId) || false;
    }

    public getQrCode(userId: string): string {
        return this.qrCodes.get(userId) || '';
    }

    public async initializeClient(userId: string): Promise<void> {
        if (this.clients.has(userId) || this.initializing.get(userId)) return;

        this.initializing.set(userId, true);

        const client = new Client({
            authStrategy: new LocalAuth({ dataPath: `./.wwebjs_auth/${userId}` }),
            puppeteer: {
                headless: true,
                executablePath: '/usr/bin/chromium-browser',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        client.on('qr', (qr) => {
            console.log(`[WhatsApp] QR RECEIVED for user ${userId}`);
            this.qrCodes.set(userId, qr);
            io.to(userId).emit('qr', qr);
        });

        client.on('authenticated', () => {
            console.log(`[WhatsApp] Authenticated successfully for user ${userId}`);
        });

        client.on('auth_failure', (msg) => {
            console.error(`[WhatsApp] Auth failure for user ${userId}:`, msg);
            this.readyStates.set(userId, false);
            this.qrCodes.delete(userId);
            this.initializing.set(userId, false);
            io.to(userId).emit('status', { ready: false, qr: '' });
        });

        client.on('ready', () => {
            console.log(`[WhatsApp] Client is ready for user ${userId}`);
            this.readyStates.set(userId, true);
            this.qrCodes.delete(userId); // Clear QR code when ready
            this.initializing.set(userId, false);
            io.to(userId).emit('ready', true);
            io.to(userId).emit('status', { ready: true, qr: '' });
        });

        client.on('disconnected', (reason: any) => {
            console.log(`[WhatsApp] Client for user ${userId} disconnected:`, reason);
            this.readyStates.set(userId, false);
            this.clients.delete(userId);
            this.qrCodes.delete(userId);
            this.initializing.set(userId, false);
            io.to(userId).emit('disconnected', reason);
            io.to(userId).emit('status', { ready: false, qr: '' });
        });

        // Handle Incoming Messages
        client.on('message', async (msg) => {
            try {
                if (msg.from === 'status@broadcast') return;

                const contactPhone = msg.from;
                const content = msg.body;

                // 1. Save to Shared Inbox
                await prisma.message.create({
                    data: {
                        userId,
                        contactPhone,
                        direction: 'INBOUND',
                        content
                    }
                });

                // 2. Opt-out handling
                const lowerContent = content.toLowerCase().trim();
                if (lowerContent === 'stop' || lowerContent === 'unsubscribe') {
                    await prisma.blocklist.upsert({
                        where: { userId_phone: { userId, phone: contactPhone } },
                        update: { reason: 'User opt-out via message' },
                        create: { userId, phone: contactPhone, reason: 'User opt-out via message' }
                    });

                    await client.sendMessage(contactPhone, 'You have been successfully unsubscribed and will not receive further messages.');
                    return;
                }

                // 3. Basic Auto-responder (can be expanded later)
                if (lowerContent === 'price' || lowerContent === 'pricing') {
                    const reply = 'Here is our pricing information: \n\n1. Basic: $9/mo\n2. Pro: $29/mo\n\nReply with STOP to unsubscribe.';
                    await client.sendMessage(contactPhone, reply);

                    // Save outbound message to inbox
                    await prisma.message.create({
                        data: { userId, contactPhone, direction: 'OUTBOUND', content: reply }
                    });
                }

            } catch (error) {
                console.error('Error handling incoming message:', error);
            }
        });

        this.clients.set(userId, client);
        await client.initialize();
    }

    public async destroyClient(userId: string): Promise<void> {
        const client = this.clients.get(userId);
        if (client) {
            try {
                await client.logout().catch(() => { });
                await client.destroy().catch(() => { });
            } catch (error) {
                console.error(`Error destroying client for user ${userId}:`, error);
            }
            this.clients.delete(userId);
            this.readyStates.set(userId, false);
            this.qrCodes.delete(userId);
        }
        this.initializing.set(userId, false);

        try {
            const authPath = path.resolve(`./.wwebjs_auth/${userId}`);
            const sessionPath = path.resolve(`./.wwebjs_auth/session-${userId}`);
            if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
            if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch (e) {
            console.error('Error removing session directory:', e);
        }
    }

    public async destroyAll(): Promise<void> {
        for (const [userId, client] of this.clients.entries()) {
            await this.destroyClient(userId);
        }
    }
}

export const waManager = new WhatsAppManager();

import { runCampaign } from './services/campaignRunner';
import prisma from './prisma';

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    // Check for scheduled campaigns every minute
    setInterval(async () => {
        try {
            const now = new Date();
            const scheduledCampaigns = await prisma.campaign.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: { lte: now }
                }
            });

            for (const campaign of scheduledCampaigns) {
                console.log(`Starting scheduled campaign ${campaign.id}`);
                runCampaign(campaign.id, campaign.userId).catch(console.error);
            }
        } catch (error) {
            console.error('Error in scheduled campaign checker:', error);
        }
    }, 60000);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    await waManager.destroyAll();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For Nodemon restarts
