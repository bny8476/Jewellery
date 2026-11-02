import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabaseAdmin } from '../src/db.ts';

// Dedicated RAZORPAY_WEBHOOK_SECRET with NO fallback to the API secret
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

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
    console.error('[Razorpay Webhook Error] Dedicated RAZORPAY_WEBHOOK_SECRET not configured on server.');
    return res.status(503).json({ error: 'Webhook secret not configured on server' });
  }

  // 1. Verify the signature against the raw request body
  const rawBody: string = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const givenSignature = String(signature).trim();
  if (expectedSignature.length !== givenSignature.length) {
    return res.status(400).json({ error: 'Invalid webhook signature length' });
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(givenSignature, 'utf8')
  );

  if (!isValid) {
    console.error('[Razorpay Webhook Error] Invalid webhook signature detected');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  try {
    const payload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    console.log(`[Razorpay Webhook] Received verified event: ${event} for payment ${paymentId || 'N/A'}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      if (!paymentId) {
        return res.status(400).json({ error: 'Missing payment ID in webhook entity' });
      }

      // Find the associated order using parameterized .eq() call
      let targetOrderId: string | null = null;

      if (razorpayOrderId) {
        const { data: orderData, error: orderErr } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();

        if (!orderErr && orderData) {
          targetOrderId = orderData.id;
        }
      }

      if (!targetOrderId && paymentEntity?.notes?.order_id) {
        const noteOrderId = String(paymentEntity.notes.order_id);
        const { data: orderData, error: orderErr } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('id', noteOrderId)
          .maybeSingle();

        if (!orderErr && orderData) {
          targetOrderId = orderData.id;
        }
      }

      if (!targetOrderId) {
        console.error('[Razorpay Webhook Error] Could not match payment to database order:', { razorpayOrderId, paymentId });
        return res.status(404).json({ error: 'Associated order not found' });
      }

      // Execute single atomic transaction: fulfill_order_payment
      // Idempotently marks order paid, decrements stock with overselling protection, and logs ledger
      const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('fulfill_order_payment', {
        p_order_id: targetOrderId,
        p_razorpay_order_id: razorpayOrderId || '',
        p_payment_id: paymentId,
        p_payment_method: 'razorpay'
      });

      if (rpcErr) {
        console.error('[Razorpay Webhook Failure] Order settlement failed:', rpcErr);
        // Return 500 error so Razorpay retries webhook delivery!
        return res.status(500).json({ error: 'Failed to settle order transaction' });
      }

      // Return 200 ONLY after processing succeeds!
      return res.status(200).json({
        status: 'success',
        message: 'Order fulfilled and payment processed idempotently',
        result: rpcResult
      });
    }

    if (event === 'payment.failed') {
      if (razorpayOrderId) {
        const { error: updateErr } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'failed',
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_order_id', razorpayOrderId);

        if (updateErr) {
          console.error('[Razorpay Webhook Warning] Could not update failed order status:', updateErr);
        }
      }
      return res.status(200).json({ status: 'ok', event });
    }

    if (event === 'refund.processed') {
      if (razorpayOrderId) {
        const { error: updateErr } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'refunded',
            payment_status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_order_id', razorpayOrderId);

        if (updateErr) {
          console.error('[Razorpay Webhook Warning] Could not update refund order status:', updateErr);
        }
      }
      return res.status(200).json({ status: 'ok', event });
    }

    return res.status(200).json({ status: 'ignored', event });
  } catch (error: any) {
    console.error('[Razorpay Webhook Internal Error]:', error?.message || error);
    // Return 500 on unexpected errors so Razorpay retries
    return res.status(500).json({ error: error.message || 'Webhook internal processing error' });
  }
}
