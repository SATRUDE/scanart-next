import type { Metadata } from 'next';
import { checkoutStringsEn } from '@/components/CheckoutPage';
import { OrderConfirmed } from '@/components/v2/checkout/OrderConfirmed';

export const metadata: Metadata = {
  title: 'Order confirmed',
  description: 'Your Scandinavian Art order is placed.',
  // A transactional page, kept out of the index like checkout: no canonical,
  // no hreflang pair, not in the sitemap.
  robots: { index: false, follow: true },
};

export default function OrderConfirmedPage() {
  return <OrderConfirmed t={checkoutStringsEn} locale="en" />;
}
