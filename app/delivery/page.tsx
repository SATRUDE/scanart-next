import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

const PAGE_TITLE = 'Delivery & Returns';
const PAGE_DESCRIPTION = 'How Scandinavian Art prints are made, shipped worldwide, and our returns and refunds policy.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/delivery', languages: hreflangPair('/delivery') },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/delivery' }),
};

// The date this policy takes effect; bump by hand when the wording changes.
const LAST_UPDATED = '18 August 2026';

const sections: LegalSection[] = [
  {
    heading: 'How your order is made',
    body: (
      <p>
        Every print is made to order through our print-on-demand partner, Gelato, and produced at a facility close to
        your delivery address wherever possible. This keeps quality high and shipping distances short.
      </p>
    ),
  },
  {
    heading: 'Production time',
    body: (
      <p>
        Orders are typically produced and dispatched within 1 to 4 business days. Delivery time starts after dispatch
        and varies by destination. You will see an estimate for your address at checkout.
      </p>
    ),
  },
  {
    heading: 'Delivery times and costs',
    body: (
      <p>
        Delivery cost depends on the destination and the size, frame and quantity in your basket. We calculate it from
        the current fulfilment cost and show the exact amount before you pay at checkout.
      </p>
    ),
  },
  {
    heading: 'Worldwide shipping and import duties',
    body: (
      <p>
        We ship worldwide. Prints are made to order, and depending on the size and framing your order may be produced
        in a different country from the one it is delivered to. Where an order crosses a customs border, import duties,
        customs charges or local taxes may apply on arrival and are the buyer&apos;s responsibility.
      </p>
    ),
  },
  {
    heading: 'Cancellations and change-of-mind returns',
    body: (
      <p>
        You may cancel your order within 14 days of receiving it. Because each print is made to order, you do not need to
        send it back, just email us at {COMPANY.email} within that time and we will refund you.
      </p>
    ),
  },
  {
    heading: 'Faulty, damaged, incorrect or lost items',
    body: (
      <p>
        If your order arrives faulty, damaged or incorrect, or does not arrive at all, email {COMPANY.email} within 30
        days of delivery (or of the estimated delivery date for a lost parcel). We will arrange a free replacement or a
        refund.
      </p>
    ),
  },
  {
    heading: 'How refunds are made',
    body: (
      <p>
        Refunds are made to your original payment method via Stripe, normally within 14 days of your cancellation or of
        our agreeing a refund.
      </p>
    ),
  },
  {
    heading: 'Contact',
    body: (
      <p>
        Any questions? Email {COMPANY.email}, or see our{' '}
        <Link href="/terms" className="underline hover:text-neutral-900">Terms &amp; Conditions</Link> and{' '}
        <Link href="/privacy" className="underline hover:text-neutral-900">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function DeliveryPage() {
  return <LegalPage title="Delivery & Returns" lastUpdated={LAST_UPDATED} sections={sections} />;
}
