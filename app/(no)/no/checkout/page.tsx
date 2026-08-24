import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/CheckoutPage';
import { FeedbackIntercept } from '@/components/FeedbackIntercept';
import { no } from '@/lib/i18n/no';

// The Norwegian checkout: the same CheckoutPage component as the English
// route, given the Norwegian labels. The payment flow, amounts, currencies
// and Stripe calls are identical in both trees; only the labels differ.
const t = no.checkout;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  // Kept out of the index, as the English checkout is (Google's guidance for
  // cart/checkout pages). follow: true so links are still crawled. No
  // self-referential canonical, and no hreflang pair: a noindex page should
  // not advertise itself as an alternate.
  robots: { index: false, follow: true },
};

export default function NorwegianCheckout() {
  return (
    <>
      <CheckoutPage strings={t.page} />
      {/* Never a modal here, and never a card on a small screen: see the
          suppression list in lib/feedback.ts and the note on the component. */}
      <FeedbackIntercept placement="checkout" />
    </>
  );
}
