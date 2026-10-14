import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const key_secret = process.env.RAZORPAY_KEY_SECRET || 'eZyRCiqqgfbu1lNVbB60CAFH';

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay signature verification parameters' });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.status(200).json({
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        message: 'Razorpay payment successfully verified by RCB server',
      });
    } else {
      return res.status(400).json({
        verified: false,
        error: 'Razorpay payment signature mismatch. Verification failed.',
      });
    }
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({
      error: error.message || 'Server error while verifying Razorpay payment',
    });
  }
}
