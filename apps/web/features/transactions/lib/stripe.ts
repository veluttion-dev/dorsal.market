import { type Stripe, loadStripe } from '@stripe/stripe-js';

let promise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!promise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    promise = key ? loadStripe(key) : Promise.resolve(null);
  }

  return promise;
}
