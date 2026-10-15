import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabase } from '../src/db.ts';

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

// Webhook Event Idempotency Cache
const processedEvents = new Set<string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-razorpay-signature'] as string;
  if (!signature) {
    return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
  }

  if (!webhookSecret) {
    console.warn('[Razorpay Webhook Warning] Webhook secret not configured on server.');
    return res.status(503).json({ error: 'Webhook secret not configured on server' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

    if (!isValid) {
      console.error('[Razorpay Webhook Error] Invalid webhook signature detected');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const payload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const eventId = payload.id || payload.event_id || `${payload.event}_${payload?.payload?.payment?.entity?.id || Date.now()}`;

    // Idempotency: Ignore duplicate webhook deliveries
    if (processedEvents.has(eventId)) {
      return res.status(200).json({ status: 'ok', message: 'Event already processed (idempotent)' });
    }
    processedEvents.add(eventId);

    // Limit cache size
    if (processedEvents.size > 10000) {
      processedEvents.clear();
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;
    const amount = (paymentEntity?.amount || 0) / 100; // in INR

    console.log(`[Razorpay Webhook] Received event: ${event} for payment ${paymentId || 'N/A'}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      if (razorpayOrderId) {
        // Reconcile order in database and decrement inventory
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, order_id, items')
          .eq('order_id', razorpayOrderId)
          .maybeSingle();

        await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_status: 'paid',
            payment_id: paymentId,
            payment_method: 'razorpay',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', razorpayOrderId);

        // Decrement stock for items
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

        // Record in cash/payment audit transactions
        try {
          await supabase.from('cash_transactions').insert([{
            transaction_date: new Date().toISOString().split('T')[0],
            transaction_type: 'cash_in',
            amount: amount,
            category: 'online_sales',
            reference_type: 'razorpay_order',
            description: `Razorpay payment captured: ${paymentId} for order ${razorpayOrderId}`,
            payment_mode: 'upi',
            created_at: new Date().toISOString()
          }]);
        } catch {
          // cash_transactions insert optional if schema variant differs
        }
      }
    } else if (event === 'payment.failed') {
      if (razorpayOrderId) {
        await supabase
          .from('orders')
          .update({
            status: 'failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', razorpayOrderId);
      }
    } else if (event === 'refund.processed') {
      if (razorpayOrderId) {
        await supabase
          .from('orders')
          .update({
            status: 'refunded',
            payment_status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', razorpayOrderId);
      }
    }

    return res.status(200).json({ status: 'ok', event, processed: true });
  } catch (err: any) {
    console.error('[Razorpay Webhook Handler Error]:', err);
    return res.status(500).json({ error: err.message || 'Webhook internal error' });
  }
}
