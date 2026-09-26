import type { Metadata } from 'next';
import { OrderConfirmed } from '@/components/v2/checkout/OrderConfirmed';
import { no } from '@/lib/i18n/no';

export const metadata: Metadata = {
  title: 'Bestillingen er mottatt',
  description: 'Bestillingen din hos Scandinavian Art er mottatt.',
  // Kept out of the index like the Norwegian checkout.
  robots: { index: false, follow: true },
};

export default function NorwegianOrderConfirmedPage() {
  return <OrderConfirmed t={no.checkout.page} locale="no" />;
}
