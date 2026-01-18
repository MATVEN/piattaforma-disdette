// src/lib/stripe/stripe-server.ts
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error(
    'STRIPE_SECRET_KEY non impostata. Controlla .env.local e riavvia il server.'
  );
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});