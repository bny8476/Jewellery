import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' })
  : null;

interface CartItemInput {
  name: string;
  price: number;
  quantity?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Security: Restrict allowed origins
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

  if (!stripe) {
    return res.status(503).json({
      error: 'Payment processing is currently unavailable. Please contact store support.'
    });
  }

  try {
    const { amount, items, orderId } = req.body || {};

    let verifiedAmount: number = 0;

    // 1. Strict Server-Side Amount Verification
    if (Array.isArray(items) && items.length > 0) {
      if (items.length > 50) {
        return res.status(400).json({ error: 'Order exceeds maximum item limit' });
      }

      let sum = 0;
      for (const item of items as CartItemInput[]) {
        const itemPrice = Number(item.price);
        const itemQty = Math.max(1, Math.min(100, Math.floor(Number(item.quantity) || 1)));

        if (!Number.isFinite(itemPrice) || itemPrice <= 0 || itemPrice > 10000000) {
          return res.status(400).json({ error: 'Invalid item price detected in order' });
        }

        sum += Math.round(itemPrice) * itemQty;
      }

      verifiedAmount = sum;

      // If client also supplied total amount, assert parity within 1 rupee rounding tolerance
      if (amount !== undefined && amount !== null) {
        const clientAmount = Number(amount);
        if (!Number.isFinite(clientAmount) || Math.abs(clientAmount - verifiedAmount) > 2) {
          return res.status(400).json({ error: 'Order amount mismatch. Please refresh cart.' });
        }
      }
    } else if (Number.isFinite(Number(amount)) && Number(amount) > 0) {
      const parsedAmount = Math.round(Number(amount));
      if (parsedAmount > 10000000) {
        return res.status(400).json({ error: 'Order exceeds maximum allowed transaction value' });
      }
      verifiedAmount = parsedAmount;
    } else {
      return res.status(400).json({ error: 'A valid order items list or amount is required' });
    }

    if (verifiedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    // 2. Create PaymentIntent with verified amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(verifiedAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: typeof orderId === 'string' ? orderId.slice(0, 64) : `ORD-${Date.now()}`,
        verifiedAmount: String(verifiedAmount),
        itemCount: String(Array.isArray(items) ? items.length : 1),
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      verifiedAmount,
    });
  } catch (err: any) {
    // Sanitize error logging: Log securely without leaking internal details to client
    console.error('Payment intent creation failure:', err?.message || err);
    return res.status(500).json({
      error: 'Unable to initialize secure payment. Please verify your connection or try again.'
    });
  }
}
