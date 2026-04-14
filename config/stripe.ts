import { loadStripe } from '@stripe/stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn('Stripe publishable key not found. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
}

const stripePromise = publishableKey
  ? loadStripe(publishableKey).catch(error => {
      console.error('Failed to load Stripe:', error);
      return null;
    })
  : Promise.resolve(null);

export default stripePromise;
