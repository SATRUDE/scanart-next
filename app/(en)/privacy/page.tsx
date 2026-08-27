import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

const PAGE_TITLE = 'Privacy Policy';
const PAGE_DESCRIPTION = 'How Scandinavian Art collects, uses and protects your personal data.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/privacy',
    languages: hreflangPair('/privacy'),
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/privacy' }),
};

// The date this policy takes effect; bump by hand when the wording changes.
const LAST_UPDATED = '12 July 2026';

const sections: LegalSection[] = [
  {
    heading: 'Who we are',
    body: (
      <>
        <p>
          Scandinavian Art is an online gallery selling art prints, operated from {COMPANY.country}
          {COMPANY.orgNr ? ` (org.nr ${COMPANY.orgNr})` : ''}. We are the data controller for the personal
          data described here.
        </p>
        <p>
          You can reach us at {COMPANY.email}.
          {COMPANY.address ? ` Our registered address is ${COMPANY.address}.` : ''}
        </p>
      </>
    ),
  },
  {
    heading: 'Information we collect',
    body: (
      <>
        <p>We only collect what we need to run the shop:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Order details</strong>: your name, email address, delivery address and the items you order.</li>
          <li><strong>Payment</strong>: payments are processed by Stripe. Your card details go directly to Stripe; we never see or store your full card number.</li>
          <li><strong>Site usage</strong>: privacy-friendly, aggregate analytics via Umami, which does not use cookies and does not build a profile of you.</li>
          <li><strong>Messages</strong>: anything you send us by email.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'How and why we use it',
    body: (
      <>
        <p>We use your data on the following legal bases:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>To process, produce and deliver your order and provide customer service: to perform our contract with you.</li>
          <li>To keep accounting and tax records: to meet our legal obligations.</li>
          <li>To understand aggregate site usage and keep the site working: our legitimate interests.</li>
        </ul>
        <p>We do not use your data for marketing without your consent, and we never sell it.</p>
      </>
    ),
  },
  {
    heading: 'Cookies',
    body: (
      <p>
        This site does not use tracking cookies. Our analytics (Umami) is cookieless, so we do not ask you to accept a
        cookie banner. If we ever introduce cookies, we will update this policy first.
      </p>
    ),
  },
  {
    heading: 'Who we share it with',
    body: (
      <>
        <p>We share your data only with the providers we need to fulfil your order, and where the law requires:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Stripe</strong>: to take payment.</li>
          <li><strong>Gelato</strong> and its delivery partners: to print and ship your order.</li>
          <li><strong>Slack</strong>: your order details are sent to our team as an order notification.</li>
        </ul>
        <p>
          Some of these providers operate outside {COMPANY.country} and the EEA. Where your data is transferred abroad,
          it is protected by appropriate safeguards. We never sell your personal data.
        </p>
      </>
    ),
  },
  {
    heading: 'How long we keep it',
    body: (
      <p>
        We hold personal data only as long as we need it. We do not keep our own customer database: your order and
        payment details are held by our payment and print partners (Stripe and Gelato) under their own policies, and
        for as long as we need them to meet accounting and tax obligations. Our website analytics (Umami) is cookieless
        and aggregate, and is retained in line with our analytics settings.
      </p>
    ),
  },
  {
    heading: 'Your rights',
    body: (
      <>
        <p>
          You have the right to access, correct, delete, restrict or object to our use of your data, and to receive a
          copy of it. To exercise any of these, email us at {COMPANY.email}.
        </p>
        <p>
          You can also complain to the Norwegian Data Protection Authority (Datatilsynet). If you are in the UK, you may
          complain to the Information Commissioner&apos;s Office (ICO) instead.
        </p>
      </>
    ),
  },
  {
    heading: 'Contact',
    body: (
      <p>
        Questions about this policy? Email {COMPANY.email}, or see our <Link href="/terms" className="underline hover:text-neutral-900">Terms &amp; Conditions</Link> and <Link href="/delivery" className="underline hover:text-neutral-900">Delivery &amp; Returns</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED} sections={sections} />;
}
