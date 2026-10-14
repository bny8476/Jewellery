import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.APP_URL,
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean);

  const isAllowed = allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'));
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : (process.env.CLIENT_ORIGIN || 'http://localhost:5173'));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!key_id || !key_secret) {
    return res.status(503).json({ error: 'Razorpay payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
  }

  const razorpay = new Razorpay({
    key_id,
    key_secret,
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'INR', receipt, notes } = req.body || {};

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Convert INR to paise (Razorpay takes smallest currency subunit)
    const amountInPaise = Math.round(numAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: receipt || `rcb_${Date.now()}`,
      notes: notes || {
        store: 'RCB Jewelry & Pawn Shop',
        platform: 'Web E-Commerce',
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId: key_id,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create Razorpay order',
    });
  }
}
