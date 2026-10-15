import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabase } from '../src/db.ts';

const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

// Idempotency store to prevent duplicate payment processing / replay attacks
const processedPayments = new Map<string, { timestamp: number; orderId?: string }>();

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

  if (!key_secret) {
    return res.status(503).json({ error: 'Razorpay secret key not configured on server.' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, orderId } = req.body || {};
    const targetOrderId = order_id || orderId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        verified: false,
        error: 'Missing required signature verification parameters: order_id, payment_id, or signature.'
      });
    }

    // 1. Idempotency Check: Prevent duplicate payment replay attacks
    if (processedPayments.has(razorpay_payment_id)) {
      const existing = processedPayments.get(razorpay_payment_id)!;
      return res.status(200).json({
        verified: true,
        idempotent: true,
        paymentId: razorpay_payment_id,
        orderId: existing.orderId || razorpay_order_id,
        message: 'Payment already processed and verified previously.',
      });
    }

    // 2. Cryptographic HMAC SHA-256 Signature Verification
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(String(razorpay_signature), 'utf8')
    );

    if (!isValid) {
      console.warn(`[Payment Security Alert] Invalid Razorpay signature attempt for payment ${razorpay_payment_id}`);
      return res.status(400).json({
        verified: false,
        error: 'Cryptographic signature verification failed. Payment cannot be trusted.',
      });
    }

    // 3. Reconcile with Database Order & Decrement Stock
    if (targetOrderId) {
      try {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, order_id, items, total_amount')
          .or(`id.eq.${targetOrderId},order_id.eq.${targetOrderId}`)
          .maybeSingle();

        await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'razorpay',
            payment_id: razorpay_payment_id,
            updated_at: new Date().toISOString()
          })
          .or(`id.eq.${targetOrderId},order_id.eq.${targetOrderId}`);

        // Decrement stock for purchased items
        if (orderData && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            const itemId = item.id || item.product_id;
            if (itemId) {
              const qty = Math.max(1, Number(item.quantity) || 1);
              const { data: currentItem } = await supabase
                .from('jewelry_items')
                .select('stock_quantity, status')
                .eq('id', itemId)
                .maybeSingle();

              if (currentItem) {
                const currentStock = Number(currentItem.stock_quantity) || 1;
                const newStock = Math.max(0, currentStock - qty);
                await supabase
                  .from('jewelry_items')
                  .update({
                    stock_quantity: newStock,
                    status: newStock === 0 ? 'out_of_stock' : currentItem.status,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', itemId);
              }
            }
          }
        }

        // Record in cash/bank ledger
        if (orderData?.total_amount) {
          try {
            await supabase.from('cash_transactions').insert([{
              transaction_date: new Date().toISOString().split('T')[0],
              transaction_type: 'cash_in',
              amount: Number(orderData.total_amount),
              category: 'online_sales',
              reference_type: 'razorpay_order',
              reference_id: orderData.id,
              description: `Online Order ${orderData.order_id || targetOrderId} Paid via Razorpay (${razorpay_payment_id})`,
              payment_mode: 'upi',
              created_at: new Date().toISOString()
            }]);
          } catch {
            // ledger insert optional if table varies
          }
        }
      } catch (dbErr) {
        console.error('[Payment Reconciliation Warning] Could not update order record:', dbErr);
      }
    }

    // Record payment as safely processed
    processedPayments.set(razorpay_payment_id, {
      timestamp: Date.now(),
      orderId: targetOrderId || razorpay_order_id
    });

    // Housekeeping on idempotency cache (retain last 5,000 entries)
    if (processedPayments.size > 5000) {
      const now = Date.now();
      processedPayments.forEach((entry, key) => {
        if (now - entry.timestamp > 86400000) processedPayments.delete(key);
      });
    }

    return res.status(200).json({
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      message: 'Razorpay payment successfully verified by RCB server',
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({
      verified: false,
      error: error.message || 'Server error while verifying Razorpay payment',
    });
  }
}
