import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian Delivery & Returns page: app/delivery/page.tsx mirrored
// exactly (same LegalPage template), with the copy swapped
// for lib/i18n/no.ts. Terms and Privacy have no Norwegian versions in phase
// one, so those links go to the English routes.
const t = no.delivery;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/delivery',
    languages: hreflangPair('/delivery'),
  },
  ...socialCard({ title: t.meta.title, description: t.meta.description, path: '/no/delivery', ogLocale: 'nb_NO' }),
};

// Fill an {email}/{country} placeholder string around a React fragment-free
// plain replacement (the values are plain text).
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

const sections: LegalSection[] = [
  {
    heading: t.sections.made.heading,
    body: <p>{t.sections.made.body}</p>,
  },
  {
    heading: t.sections.production.heading,
    body: (
      <p>
        {t.sections.production.bodyBefore}
        <em>{t.sections.production.bodyEm}</em>
        {t.sections.production.bodyAfter}
      </p>
    ),
  },
  {
    heading: t.sections.times.heading,
    body: (
      <p>{t.sections.times.body}</p>
    ),
  },
  {
    heading: t.sections.worldwide.heading,
    body: <p>{fill(t.sections.worldwide.body, { country: COMPANY.country })}</p>,
  },
  {
    heading: t.sections.cancellations.heading,
    body: <p>{fill(t.sections.cancellations.body, { email: COMPANY.email })}</p>,
  },
  {
    heading: t.sections.faulty.heading,
    body: <p>{fill(t.sections.faulty.body, { email: COMPANY.email })}</p>,
  },
  {
    heading: t.sections.refunds.heading,
    body: <p>{t.sections.refunds.body}</p>,
  },
  {
    heading: t.sections.contact.heading,
    body: (
      <p>
        {fill(t.sections.contact.bodyBefore, { email: COMPANY.email })}
        <Link href="/no/terms" className="underline hover:text-neutral-900">{t.sections.contact.termsLabel}</Link>
        {t.sections.contact.bodyBetween}
        <Link href="/no/privacy" className="underline hover:text-neutral-900">{t.sections.contact.privacyLabel}</Link>
        {t.sections.contact.bodyAfter}
      </p>
    ),
  },
];

export default function NorwegianDeliveryPage() {
  return (
    <LegalPage
      title={t.pageTitle}
      lastUpdated={t.lastUpdated}
      sections={sections}
      strings={{ home: t.breadcrumbHome, homeHref: '/no', lastUpdatedLabel: t.lastUpdatedLabel }}
    />
  );
}
