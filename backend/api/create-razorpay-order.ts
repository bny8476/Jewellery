import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import { supabase } from '../src/db.ts';

const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

// In-memory rate & duplicate order tracker
const recentOrders = new Map<string, number>();

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

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!key_id || !key_secret) {
    return res.status(503).json({
      error: 'Razorpay payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on server.'
    });
  }

  try {
    const { amount, currency = 'INR', receipt, notes, order_id, orderId } = req.body || {};
    const targetOrderId = order_id || orderId;

    // Strict Currency Validation
    const sanitizedCurrency = String(currency).toUpperCase().trim();
    if (sanitizedCurrency !== 'INR') {
      return res.status(400).json({ error: 'Unsupported currency. Only INR is supported.' });
    }

    let authoritativeAmount: number = Number(amount);

    // If an associated database order is specified, enforce server-side price authoritative validation
    if (targetOrderId) {
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .select('id, order_id, total_amount, status, payment_status')
        .or(`id.eq.${targetOrderId},order_id.eq.${targetOrderId}`)
        .maybeSingle();

      if (!orderErr && dbOrder) {
        if (dbOrder.status === 'completed' || dbOrder.payment_status === 'paid') {
          return res.status(400).json({
            error: 'Order has already been paid and settled. Duplicate payment prevented.',
            orderId: dbOrder.order_id
          });
        }
        // Force authoritative amount from database
        authoritativeAmount = Number(dbOrder.total_amount);
      }
    }

    // Amount Range & Precision Constraints
    if (!Number.isFinite(authoritativeAmount) || authoritativeAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive payment amount is required' });
    }

    if (authoritativeAmount < 1) {
      return res.status(400).json({ error: 'Minimum transaction amount is ₹1.00' });
    }

    if (authoritativeAmount > 5000000) {
      return res.status(400).json({ error: 'Transaction exceeds maximum allowable limit of ₹50,00,000' });
    }

    // Convert INR to paise (Razorpay takes integer in smallest currency subunit)
    const amountInPaise = Math.round(authoritativeAmount * 100);

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const safeReceipt = receipt ? String(receipt).slice(0, 40) : `rcb_${Date.now()}`;

    // Prevent immediate duplicate order creation within 3 seconds for the exact same receipt
    const lastAttempt = recentOrders.get(safeReceipt);
    if (lastAttempt && Date.now() - lastAttempt < 3000) {
      return res.status(429).json({ error: 'Duplicate order creation in flight. Please wait a moment.' });
    }
    recentOrders.set(safeReceipt, Date.now());

    // Clean up old entries
    if (recentOrders.size > 1000) {
      const now = Date.now();
      recentOrders.forEach((time, key) => {
        if (now - time > 60000) recentOrders.delete(key);
      });
    }

    const options = {
      amount: amountInPaise,
      currency: sanitizedCurrency,
      receipt: safeReceipt,
      notes: {
        store: "YAZHINI Fine Jewels & Pawn Shop",
        platform: "Secure Payment Gateway",
        client_order_id: targetOrderId || 'direct_checkout',
        ...(notes && typeof notes === 'object' ? notes : {})
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
    console.error('[Razorpay Order Error]:', error?.message || error);
    return res.status(500).json({
      error: error.message || 'Failed to create Razorpay payment order',
    });
  }
}
