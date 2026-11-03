import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '../src/db.ts';
import { authenticateRequest } from '../src/routes/apiV1.ts';



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

  // 1. Authenticate user
  const auth = await authenticateRequest(req as any);
  if (!auth.user) {
    return res.status(401).json({ verified: false, error: 'Authentication required' });
  }

  if (!key_secret) {
    return res.status(503).json({ verified: false, error: 'Razorpay secret key not configured on server.' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, orderId } = req.body || {};
    const targetOrderId = order_id || orderId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !targetOrderId) {
      return res.status(400).json({
        verified: false,
        error: 'Missing required parameters: order_id, razorpay_order_id, razorpay_payment_id, or razorpay_signature.'
      });
    }

    // 2. Load user's own order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, status, payment_status, razorpay_order_id')
      .eq('id', targetOrderId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (orderErr) {
      console.error('[Verify Payment] Error loading order:', orderErr);
      return res.status(500).json({ verified: false, error: 'Database error reading order' });
    }

    if (!order) {
      return res.status(404).json({ verified: false, error: 'Order not found for authenticated user' });
    }

    // Check that order.razorpay_order_id equals the razorpay_order_id in the request
    if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({
        verified: false,
        error: 'Order mismatch: razorpay_order_id does not match the recorded order reference'
      });
    }

    // 3. Verify the signature: Compare lengths first so a short signature returns 400, not a thrown error
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(payload)
      .digest('hex');

    const givenSignature = String(razorpay_signature).trim();
    if (expectedSignature.length !== givenSignature.length) {
      return res.status(400).json({
        verified: false,
        error: 'Invalid signature format or length.'
      });
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(givenSignature, 'utf8')
    );

    if (!isValid) {
      console.warn(`[Payment Security Alert] Invalid Razorpay signature attempt for payment ${razorpay_payment_id}`);
      return res.status(400).json({
        verified: false,
        error: 'Cryptographic signature verification failed. Payment cannot be trusted.'
      });
    }

    // 4. Fetch the payment from Razorpay and confirm status captured, amount equal to Math.round(order.total * 100), currency INR, and a matching order ID
    const razorpay = new Razorpay({ key_id, key_secret });
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    const expectedAmountPaise = Math.round(Number(order.total_amount) * 100);

    // Strict Settlement: Orders can only be fulfilled when payment is captured
    let paymentStatus = payment.status;
    if (paymentStatus === 'authorized') {
      try {
        console.log(`[Payment Settlement] Payment ${razorpay_payment_id} is in 'authorized' status. Executing gateway capture...`);
        const captured = await razorpay.payments.capture(razorpay_payment_id, expectedAmountPaise, 'INR');
        paymentStatus = captured.status;
      } catch (capErr: any) {
        console.error('[Payment Settlement Error] Automatic gateway capture failed:', capErr.message);
        return res.status(400).json({
          verified: false,
          error: 'Payment was authorized but gateway capture failed. Order remains pending capture.'
        });
      }
    }

    const isCaptured = paymentStatus === 'captured';
    const isAmountMatch = payment.amount === expectedAmountPaise;
    const isCurrencyMatch = (payment.currency || '').toUpperCase() === 'INR';
    const isOrderMatch = payment.order_id === razorpay_order_id;

    if (!isCaptured || !isAmountMatch || !isCurrencyMatch || !isOrderMatch) {
      console.error('[Payment Verification Failure]', {
        status: paymentStatus,
        amount: payment.amount,
        expectedAmount: expectedAmountPaise,
        currency: payment.currency,
        orderId: payment.order_id,
        expectedOrderId: razorpay_order_id
      });
      return res.status(400).json({
        verified: false,
        error: 'Gateway payment verification mismatch on status, amount, currency, or order ID.'
      });
    }

    // 5. Call database function that marks order paid, deducts stock and writes ledger entry idempotently
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('fulfill_order_payment', {
      p_order_id: order.id,
      p_razorpay_order_id: razorpay_order_id,
      p_payment_id: razorpay_payment_id,
      p_payment_method: 'razorpay'
    });

    if (rpcError) {
      console.warn('[Verify Payment Warning] RPC fulfill_order_payment error:', rpcError.message);
      // Even if RPC encounters error because webhook already executed, check if order is now paid
      const { data: checkOrder } = await supabaseAdmin
        .from('orders')
        .select('payment_status, status')
        .eq('id', order.id)
        .maybeSingle();

      if (checkOrder?.payment_status === 'paid') {
        return res.status(200).json({
          verified: true,
          orderId: order.id,
          paymentId: razorpay_payment_id,
          message: 'Payment verified and settled.'
        });
      }
      return res.status(500).json({ verified: false, error: 'Database order settlement failed' });
    }

    return res.status(200).json({
      verified: true,
      orderId: order.id,
      paymentId: razorpay_payment_id,
      details: rpcResult,
      message: 'Payment verified and settled successfully.'
    });
  } catch (err: any) {
    console.error('[Payment Verification Error]:', err?.message || err);
    return res.status(500).json({
      verified: false,
      error: err.message || 'Payment verification encountered an unexpected error.'
    });
  }
}
