import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/CheckoutPage';
import { FeedbackIntercept } from '@/components/FeedbackIntercept';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase - Scandinavian Art Gallery',
  // Keep this transactional page out of the index (Google's guidance for
  // cart/checkout). follow: true so any links are still crawled. No
  // self-referential canonical: a noindex page should not also ask to be
  // indexed as canonical.
  robots: { index: false, follow: true },
};

export default function Checkout() {
  return (
    <>
      <CheckoutPage />
      {/* Never a modal here, and never a card on a small screen: see the
          suppression list in lib/feedback.ts and the note on the component. */}
      <FeedbackIntercept placement="checkout" />
    </>
  );
}
