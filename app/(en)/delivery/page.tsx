import type { Metadata } from 'next';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { helpGroups } from '@/data/help';
import { shopScenes } from '@/lib/shop-scenes';
import { DeliveryBody } from '@/components/v2/delivery/DeliveryBody';

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

/** A Help answer, verbatim, so the two pages can never disagree. */
const answer = (q: string) => helpGroups.flatMap(g => g.items).find(i => i.q === q)?.a ?? '';

const scene = shopScenes['swallow-dive'];

export default function DeliveryPage() {
  return (
    <DeliveryBody
      copy={{
        locale: 'en',
        title: PAGE_TITLE,
        breadcrumb: [{ label: 'Home', href: '/' }, { label: PAGE_TITLE }],
        lead: 'How your print is made, how it reaches you anywhere in the world, and what happens if you change your mind.',
        lastUpdatedLabel: 'Last updated',
        lastUpdated: LAST_UPDATED,
        made: {
          heading: 'How your order is made',
          body: (
            <p>
              Every print is made to order through our print-on-demand partner, Gelato, and produced at a facility close
              to your delivery address wherever possible. This keeps quality high and shipping distances short.
            </p>
          ),
        },
        production: {
          heading: 'Production time',
          list: [
            'Made to order when you buy it',
            'Typically produced and dispatched within 1 to 4 business days',
            'Delivery time starts after dispatch and varies by destination; you will see an estimate for your address at checkout',
          ],
        },
        figure: { src: scene.image, alt: scene.alt, width: scene.width, height: scene.height, caption: 'Swallow Dive by Helene Brox' },
        times: {
          heading: 'Delivery times and costs',
          body: (
            <p>
              Delivery cost depends on the destination and the size, frame and quantity in your basket. We calculate it
              from the current fulfilment cost and show the exact amount before you pay at checkout.
            </p>
          ),
        },
        worldwide: {
          heading: 'Worldwide shipping and import duties',
          body: (
            <p>
              We ship worldwide. For orders delivered outside {COMPANY.country}, import duties, customs charges or local
              taxes may apply on arrival and are the buyer&apos;s responsibility.
            </p>
          ),
        },
        returns: {
          heading: 'Returns and refunds',
          items: [
            {
              title: 'Cancellations and change-of-mind returns',
              body: `You may cancel your order within 14 days of receiving it. Because each print is made to order, you do not need to send it back, just email us at ${COMPANY.email} within that time and we will refund you.`,
            },
            {
              title: 'Faulty, damaged, incorrect or lost items',
              body: `If your order arrives faulty, damaged or incorrect, or does not arrive at all, email ${COMPANY.email} within 30 days of delivery (or of the estimated delivery date for a lost parcel). We will arrange a free replacement or a refund.`,
            },
            {
              title: 'How refunds are made',
              body: 'Refunds are made to your original payment method via Stripe, normally within 14 days of your cancellation or of our agreeing a refund.',
            },
          ],
          emailLabel: 'Email us',
          termsLabel: 'Terms and conditions',
          termsHref: '/terms',
        },
        questions: {
          heading: 'Common questions',
          items: [
            { q: 'How long does delivery take?', a: answer('How long will my order take?') },
            { q: 'Will I pay import duties?', a: answer('Will I pay customs or import duties?') },
            { q: 'Can I cancel my order?', a: answer('Can I change or cancel my order?') },
            { q: 'What if my print arrives damaged?', a: answer('My order arrived damaged, faulty or incorrect.') },
          ],
        },
        contact: {
          heading: 'Contact',
          intro: 'Any questions? Email us, or read the terms that apply to every order.',
          rows: [
            { href: `mailto:${COMPANY.email}`, label: COMPANY.email },
            { href: '/terms', label: 'Terms & Conditions' },
            { href: '/privacy', label: 'Privacy Policy' },
          ],
          beforeHeading: 'Before you write',
          beforeList: ['Your order number, from the confirmation email', 'A photo, if something arrived damaged'],
        },
        email: COMPANY.email,
      }}
    />
  );
}
