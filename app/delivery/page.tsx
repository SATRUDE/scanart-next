import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { getAllShippingRates } from '@/config/shipping';

export const metadata: Metadata = {
  title: 'Delivery & Returns',
  description: 'How Scandinavian Art prints are made, shipped worldwide, and our returns and refunds policy.',
  alternates: { canonical: '/delivery' },
};

// TODO_LEGAL: set this to the date the policy takes effect when it's signed off.
const LAST_UPDATED = '12 July 2026';

const rates = getAllShippingRates();

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
        Orders are typically produced and dispatched within 1 to 4 business days. The delivery estimates below are the
        time <em>after</em> dispatch, so your total wait is production time plus delivery time. You will see an estimate
        for your address at checkout.
      </p>
    ),
  },
  {
    heading: 'Delivery times and costs',
    body: (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-medium text-neutral-900">Destination</th>
                <th className="py-2 pr-4 font-medium text-neutral-900">Cost</th>
                <th className="py-2 font-medium text-neutral-900">Estimated delivery</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => (
                <tr key={rate.countryCode} className="border-b border-border">
                  <td className="py-2 pr-4">{rate.countryName}</td>
                  <td className="py-2 pr-4">£{rate.costs.GBP.toFixed(2)}</td>
                  <td className="py-2">{rate.estimatedDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Costs are shown here in GBP; at checkout they appear in your selected currency.</p>
      </>
    ),
  },
  {
    heading: 'Worldwide shipping and import duties',
    body: (
      <p>
        We ship worldwide. For orders delivered outside {COMPANY.country}, import duties, customs charges or local taxes
        may apply on arrival and are the buyer&apos;s responsibility.
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
        Refunds are made to your original payment method via Stripe
        {/* TODO_LEGAL: confirm the refund timeframe you want to commit to, e.g. within 14 days */}.
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
  return <LegalPage title="Delivery & Returns" lastUpdated={LAST_UPDATED} sections={sections} draftNotice />;
}
