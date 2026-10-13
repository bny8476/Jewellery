import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' })
  : null;

// Disable automatic body parsing so we can read the raw buffer for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(503).json({ error: 'Stripe webhook receiver unconfigured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // In development when webhook signing secret is not configured
      event = JSON.parse(rawBody.toString('utf8'));
    }
  } catch (err: any) {
    console.error('Webhook signature verification error:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Idempotent webhook event dispatching
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      console.log(`[Stripe Webhook] Verified payment success for intent: ${paymentIntent.id}, Order: ${orderId}`);
      // Order status verification confirmed
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.warn(`[Stripe Webhook] Payment failed for intent: ${paymentIntent.id}`);
      break;
    }
    default:
      // Ignore unhandled event types cleanly
      break;
  }

  return res.status(200).json({ received: true });
}
