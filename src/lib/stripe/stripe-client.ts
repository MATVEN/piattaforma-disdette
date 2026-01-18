// src/lib/stripe/stripe-client.ts
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY non impostata. getStripe restituirà null.');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(pk);
    }
  }
  return stripePromise;
};