import { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SpEf15KaCAj2po';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'eZyRCiqqgfbu1lNVbB60CAFH';

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowedOrigin = process.env.APP_URL || origin || '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
