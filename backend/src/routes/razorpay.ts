import type { IncomingMessage, ServerResponse } from 'http';
import createRazorpayOrderHandler from '../../api/create-razorpay-order.ts';
import verifyRazorpayPaymentHandler from '../../api/verify-razorpay-payment.ts';
import razorpayWebhookHandler from '../../api/razorpay-webhook.ts';

export async function handleRazorpayRoutes(req: IncomingMessage, res: ServerResponse, pathname: string) {
  if (pathname === '/api/create-razorpay-order') {
    return createRazorpayOrderHandler(req as any, res as any);
  }
  if (pathname === '/api/verify-razorpay-payment') {
    return verifyRazorpayPaymentHandler(req as any, res as any);
  }
  if (pathname === '/api/razorpay-webhook') {
    return razorpayWebhookHandler(req as any, res as any);
  }
  return false;
}
