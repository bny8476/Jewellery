import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '../src/db.ts';
import { authenticateRequest } from '../src/routes/apiV1.ts';



// In-memory rate & duplicate order tracker
const recentOrders = new Map<string, number>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.APP_URL,
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean);

  const isAllowed = !origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('jewellery') || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
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

  // 1. Require Authentication
  const auth = await authenticateRequest(req as any);
  if (!auth.user) {
    return res.status(401).json({ error: 'Authentication required to initiate payment' });
  }

  if (!key_id || !key_secret) {
    return res.status(503).json({
      error: 'Razorpay payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on server.'
    });
  }

  try {
    const { order_id, orderId, notes } = req.body || {};
    const targetOrderId = order_id || orderId;

    if (!targetOrderId) {
      return res.status(400).json({ error: 'Valid order ID is required' });
    }

    // 2. Load the order using parameterized .eq('id', orderId).eq('user_id', user.id)
    // Use ONLY the database total - delete any fallback to client's amount
    const { data: dbOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, status, payment_status, currency')
      .eq('id', targetOrderId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (orderErr) {
      console.error('[Create Order] Database error loading order:', orderErr);
      return res.status(500).json({ error: 'Failed to retrieve order record' });
    }

    if (!dbOrder) {
      return res.status(404).json({ error: 'Order not found for authenticated user' });
    }

    if (dbOrder.status === 'completed' || dbOrder.payment_status === 'paid') {
      return res.status(400).json({
        error: 'Order has already been paid and settled. Duplicate payment prevented.',
        orderId: dbOrder.id
      });
    }

    const authoritativeAmount = Number(dbOrder.total_amount);
    if (!Number.isFinite(authoritativeAmount) || authoritativeAmount <= 0) {
      return res.status(400).json({ error: 'Order total must be a positive amount' });
    }

    if (authoritativeAmount < 1) {
      return res.status(400).json({ error: 'Minimum transaction amount is ₹1.00' });
    }

    if (authoritativeAmount > 5000000) {
      return res.status(400).json({ error: 'Transaction exceeds maximum allowable limit of ₹50,00,000' });
    }

    // Mandatory Section 206AA & PMLA Compliance: Orders exceeding ₹2,00,000 require a valid PAN
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const panNumber = (req.body?.pan_number || notes?.pan_number || (dbOrder as any)?.pan_number || '').toString().trim().toUpperCase();

    if (authoritativeAmount > 200000) {
      if (!panNumber || !PAN_REGEX.test(panNumber)) {
        return res.status(400).json({
          error: 'Under Section 206AA & Prevention of Money Laundering Act (PMLA) regulations, a valid 10-character Permanent Account Number (PAN) is mandatory for transactions exceeding ₹2,00,000.',
          code: 'PAN_REQUIRED_OVER_2L'
        });
      }
    }

    // Convert INR to paise
    const amountInPaise = Math.round(authoritativeAmount * 100);

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const safeReceipt = `rcb_${dbOrder.id}`.slice(0, 40);

    // Debounce duplicate order creation attempts within 3 seconds
    const lastAttempt = recentOrders.get(safeReceipt);
    if (lastAttempt && Date.now() - lastAttempt < 3000) {
      return res.status(429).json({ error: 'Duplicate order creation in flight. Please wait a moment.' });
    }
    recentOrders.set(safeReceipt, Date.now());

    if (recentOrders.size > 1000) {
      const now = Date.now();
      recentOrders.forEach((time, key) => {
        if (now - time > 60000) recentOrders.delete(key);
      });
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: safeReceipt,
      notes: {
        store: 'YAZHINI Fine Jewels & Pawn Shop',
        order_id: dbOrder.id,
        user_id: auth.user.id,
        ...(panNumber ? { pan_number: panNumber } : {}),
        ...(notes && typeof notes === 'object' ? notes : {})
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 3. Save the returned razorpay_order_id on the order row
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        razorpay_order_id: razorpayOrder.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbOrder.id)
      .eq('user_id', auth.user.id);

    if (updateErr) {
      console.error('[Create Order] Failed to update order with razorpay_order_id:', updateErr);
      return res.status(500).json({ error: 'Failed to record gateway order reference' });
    }

    return res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      keyId: key_id,
    });
  } catch (error: any) {
    console.error('[Razorpay Order Error]:', error?.message || error);
    return res.status(500).json({
      error: error.message || 'Failed to create Razorpay payment order',
    });
  }
}
