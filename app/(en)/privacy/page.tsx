import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

const PAGE_TITLE = 'Privacy Policy';
const PAGE_DESCRIPTION =
  'How Scandinavian Art collects, uses and protects your personal data, who we share it with to fulfil your order, how long we keep it and your rights.';

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
const LAST_UPDATED = '29 October 2026';

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
        <ul>
          <li><strong>Order details</strong>: your name, email address, delivery address and the items you order.</li>
          <li><strong>Payment</strong>: payments are processed by Stripe. Your card details go directly to Stripe; we never see or store your full card number.</li>
          <li><strong>Site usage</strong>: which pages are visited and how the site is used, measured without cookies and without building a profile of you (see Analytics below).</li>
          <li><strong>Session recordings</strong>: for some visits, a recording of how the pages were used, with anything typed into a form hidden (see Session recordings below).</li>
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
        <ul>
          <li>To process, produce and deliver your order and provide customer service: to perform our contract with you.</li>
          <li>To keep accounting and tax records: to meet our legal obligations.</li>
          <li>To understand how the site is used, improve the shop and keep the site working, including analytics and session recordings: our legitimate interests.</li>
        </ul>
        <p>We do not use your data for marketing without your consent, and we never sell it.</p>
      </>
    ),
  },
  {
    heading: 'Analytics',
    body: (
      <>
        <p>
          We use <strong>PostHog</strong>, on its EU cloud, to count visits and see which pages and links are used. It
          sets no cookies and stores nothing in your browser. Instead, PostHog&apos;s servers turn details of your device
          into a code mixed with a value that changes every day, so a visit can be counted without recognising you from
          one day to the next. PostHog does not create a profile of you.
        </p>
        <p>
          Until about 9 November 2026 we also run <strong>Umami</strong>, our previous analytics tool, alongside it. It
          also works without cookies and counts visits in aggregate.
        </p>
      </>
    ),
  },
  {
    heading: 'Session recordings',
    body: (
      <>
        <p>
          For about three in ten visits, we record how the pages are used: the pages you view, how you scroll, where you
          move and click, and what appears on screen. We watch these recordings to find what is confusing or broken, so
          we can improve the shop.
        </p>
        <ul>
          <li>Anything you type into a form is hidden in your browser before the recording is sent.</li>
          <li>Card details are never recorded: you enter them in Stripe&apos;s secure payment field, which the recorder cannot see.</li>
          <li>Recordings are not linked to your name or email address, and a recording stops after 5 minutes.</li>
          <li>The recorder sets no cookies and stores nothing in your browser.</li>
          <li>
            If your browser sends Global Privacy Control or Do Not Track, we do not record your visit at all. Most
            browsers let you turn one of these on in their privacy settings.
          </li>
        </ul>
        <p>
          Until about 9 November 2026 recordings are made with Umami and stored in its database, hosted by Neon in the
          United States. After that they are made by our own recorder and stored in Cloudflare R2, in the EU, and we
          also hide all text in forms and on the checkout and order pages.
        </p>
        <p>
          We analyse the recordings ourselves, about every two weeks, and then delete them. We keep only our written
          findings, which contain no personal data. Up to 5 recordings may be kept for up to 30 days so we can review
          them again. Any recording we have not analysed is deleted automatically after 90 days.
        </p>
        <p>
          Our legal basis is our legitimate interest in understanding how the shop is used and improving it. You can
          object at any time by emailing {COMPANY.email}. Because recordings are not linked to your name, we may not be
          able to find a particular visit, so turning on Global Privacy Control or Do Not Track is the surest way to
          make sure you are not recorded.
        </p>
      </>
    ),
  },
  {
    heading: 'Cookies',
    body: (
      <p>
        This site does not use tracking cookies. Our analytics and session recordings set no cookies and store nothing
        in your browser, so we do not ask you to accept a cookie banner. If we ever introduce tracking cookies, we will
        update this policy first.
      </p>
    ),
  },
  {
    heading: 'Who we share it with',
    body: (
      <>
        <p>We share your data only with the providers we need to fulfil your order, and where the law requires:</p>
        <ul>
          <li><strong>Stripe</strong>: to take payment.</li>
          <li><strong>Gelato</strong> and its delivery partners: to print and ship your order.</li>
          <li><strong>Slack</strong>: your order details are sent to our team as an order notification.</li>
          <li><strong>PostHog</strong> (EU cloud): to count visits and measure how the site is used.</li>
          <li><strong>Umami</strong>, hosted for us by Vercel and Neon in the United States: our previous analytics tool and session recordings, until about 9 November 2026.</li>
          <li><strong>Cloudflare</strong>: to store session recordings in its R2 storage, in the EU.</li>
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
        for as long as we need them to meet accounting and tax obligations. Our website analytics is cookieless and
        aggregate, and is retained in line with our analytics settings. Session recordings stored in Cloudflare R2 are
        deleted once we have analysed them, normally within about two weeks, apart from up to 5 that we may keep for up
        to 30 days. Any that are not analysed are deleted automatically after 90 days. Recordings made with Umami stay in its database until we close it, which we plan to do
        in November 2026.
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
        Questions about this policy? Email {COMPANY.email}, or see our <Link href="/terms">Terms &amp; Conditions</Link> and <Link href="/delivery">Delivery &amp; Returns</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED} sections={sections} />;
}
