import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';

const PAGE_TITLE = 'Terms & Conditions';
const PAGE_DESCRIPTION = 'The terms on which Scandinavian Art sells art prints and you use this site.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/terms' },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/terms' }),
};

// The date these terms take effect; bump by hand when the wording changes.
const LAST_UPDATED = '12 July 2026';

const sections: LegalSection[] = [
  {
    heading: 'About us and these terms',
    body: (
      <p>
        Scandinavian Art is an online art-print gallery operated from {COMPANY.country}
        {COMPANY.orgNr ? ` (org.nr ${COMPANY.orgNr})` : ''}, contactable at {COMPANY.email}. These terms govern your use
        of this site and any purchase you make. By placing an order you accept them.
      </p>
    ),
  },
  {
    heading: 'Our products',
    body: (
      <p>
        Our prints are made to order (printed on demand) by our production partner. Because each item is produced
        individually, slight variations in colour and finish are normal, and on-screen images are indicative rather than
        exact.
      </p>
    ),
  },
  {
    heading: 'Orders and prices',
    body: (
      <>
        <p>
          A contract is formed when we confirm your order. Prices are shown in your selected currency and are inclusive
          of any applicable taxes; delivery is charged separately and shown before you pay.
        </p>
        <p>
          If we spot a genuine error (for example an obvious mispricing) or cannot fulfil an order, we may decline or
          cancel it and refund you in full.
        </p>
      </>
    ),
  },
  {
    heading: 'Payment',
    body: (
      <p>
        Payments are handled securely by Stripe. Your card details are provided directly to Stripe and are not stored by
        us.
      </p>
    ),
  },
  {
    heading: 'Delivery',
    body: (
      <p>
        We ship worldwide. Production and delivery timescales, and shipping costs, are set out on our{' '}
        <Link href="/delivery" className="underline hover:text-neutral-900">Delivery &amp; Returns</Link> page. For orders
        outside {COMPANY.country}, import duties or taxes may apply on arrival and are the buyer&apos;s responsibility.
      </p>
    ),
  },
  {
    heading: 'Cancellations and returns',
    body: (
      <p>
        You have the right to cancel your order within 14 days. Because items are made to order, you do not need to return
        them, we will issue a refund. Faulty, damaged, incorrect or lost items are covered separately. Full details are on
        our <Link href="/delivery" className="underline hover:text-neutral-900">Delivery &amp; Returns</Link> page.
      </p>
    ),
  },
  {
    heading: 'Your statutory rights',
    body: (
      <p>
        Nothing in these terms affects the mandatory statutory rights you have as a consumer in your country of residence.
        Those rights always apply in addition to what is set out here.
      </p>
    ),
  },
  {
    heading: 'Intellectual property',
    body: (
      <p>
        The artworks remain the intellectual property of their artists, and the content of this site belongs to us or our
        artists. Buying a print gives you the print for personal use; it does not transfer any copyright, and the artwork
        may not be reproduced, resold commercially or used without permission.
      </p>
    ),
  },
  {
    heading: 'Our liability',
    body: (
      <p>
        We take care to describe and produce our prints accurately, but to the extent permitted by law we are not liable
        for indirect or unforeseeable loss. Nothing in these terms limits any liability that cannot be limited by law,
        including for faulty goods.
      </p>
    ),
  },
  {
    heading: 'Governing law',
    body: (
      <p>
        These terms are governed by the law of {COMPANY.country}. This does not deprive you of the mandatory consumer
        protections of your country of residence.
      </p>
    ),
  },
  {
    heading: 'Contact',
    body: <p>Questions about these terms? Email {COMPANY.email}.</p>,
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" lastUpdated={LAST_UPDATED} sections={sections} />;
}
