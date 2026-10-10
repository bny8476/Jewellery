import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, AlertCircle } from 'lucide-react';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R5KV0EIWCxGuuh7Fk6pJ4f6LU93QC2ESUnKUXqdPFtelf2n8mvwlcqM56IEK3i0JeD9hB4onBkIPEXzNfft7jPn00idRshu3M';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      setProcessing(false);
      onError('Payment gateway is still initializing. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setProcessing(false);
      onError('Card details are required.');
      return;
    }

    try {
      // 1. Attempt to request clientSecret from backend API
      let clientSecret: string | null = null;
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount }),
        });

        if (response.ok) {
          const data = await response.json();
          clientSecret = data.clientSecret;
        }
      } catch {
        // Backend API might not be running in local standalone Vite dev mode without Vercel serverless
      }

      if (clientSecret) {
        // 2. Genuine Stripe payment confirmation
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        });

        if (result.error) {
          onError(result.error.message || 'Payment processing failed.');
          return;
        }

        if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          onSuccess(result.paymentIntent);
          return;
        }
      }

      // 3. Fallback for Local Dev Mode (Simulated Sandboxed Execution)
      if (import.meta.env.DEV) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        onSuccess({
          id: `pi_test_${Date.now()}`,
          status: 'succeeded',
          amount,
          mode: 'sandbox_test_payment',
        });
        return;
      }

      onError('Payment intent could not be verified by the server.');
    } catch (err: any) {
      onError(err.message || 'An error occurred during payment processing.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {import.meta.env.DEV && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Test Sandbox Mode Active &bull; Safe simulated payment execution.</span>
        </div>
      )}

      <div className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-elevated)]">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '15px',
                color: '#e5e7eb',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
              invalid: {
                color: '#f43f5e',
              },
            },
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          256-bit Encrypted Checkout
        </span>
        <span className="font-semibold text-[var(--gold-primary)]">
          Total: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}
        </span>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black font-semibold py-3.5 px-4 rounded-xl uppercase tracking-wider text-xs hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--gold-primary)]/20 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
            <span>Processing Payment...</span>
          </>
        ) : (
          `Authorize & Pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}`
        )}
      </button>
    </form>
  );
};

export const PaymentGateway: React.FC<CheckoutFormProps> = (props) => {
  if (!stripePromise) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
        Stripe publishable key is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};
