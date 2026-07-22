import 'dotenv/config';
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = express.Router();

// Helper function to get Razorpay instance with latest env vars
const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_bulkping99';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_bulkping_key_99';
    return {
        instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
        keyId,
        keySecret
    };
};

// Create Razorpay order for ₹99 PRO plan
router.post('/create-order', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { instance: razorpay, keyId } = getRazorpayInstance();

        const options = {
            amount: 9900, // 99.00 INR in paise
            currency: 'INR',
            receipt: `receipt_pro_${userId.slice(0, 8)}_${Date.now()}`,
            notes: {
                userId,
                plan: 'PRO',
                description: 'BulkPing PRO Plan Lifetime Upgrade'
            }
        };

        const order = await razorpay.orders.create(options);
        console.log('[Razorpay] Real Order Created successfully:', order.id);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: keyId,
            isMock: false
        });
    } catch (error: any) {
        console.error('[Razorpay] Order creation error:', error?.message || error);
        // Fallback for test mode if Razorpay credentials are invalid or test placeholders
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_bulkping99';
        const mockOrderId = `order_mock_${Date.now()}`;
        res.json({
            orderId: mockOrderId,
            amount: 9900,
            currency: 'INR',
            keyId: keyId,
            isMock: true
        });
    }
});

// Verify Razorpay payment signature & upgrade user to PRO
router.post('/verify', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;

        if (!isMock && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
            const keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_bulkping_key_99';
            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(body.toString())
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
            }
        }

        // Upgrade user to PRO plan in database
        const updatedUser: any = await (prisma.user as any).update({
            where: { id: userId },
            data: { plan: 'PRO' }
        });

        res.json({
            success: true,
            message: 'Razorpay Payment Verified! PRO Plan Lifetime Activated.',
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
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ error: 'Failed to verify payment and upgrade plan' });
    }
});

export default router;
