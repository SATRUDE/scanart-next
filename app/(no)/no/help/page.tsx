import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpSections } from '@/components/HelpSections';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian Help page: app/help/page.tsx mirrored exactly (same
// HelpSections accordion, same grid), with the FAQ content swapped for the
// Norwegian groups in lib/i18n/no.ts. Terms and Privacy have no Norwegian
// versions in phase one, so those links go to the English routes.
const t = no.help;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/help',
    languages: hreflangPair('/help'),
  },
  ...socialCard({ title: t.meta.title, description: t.meta.description, path: '/no/help', ogLocale: 'nb_NO' }),
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'no',
  mainEntity: t.groups.flatMap(group =>
    group.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

export default function NorwegianHelpPage() {
  return (
    <div className="py-8">
      <div className="container mx-auto px-8 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-normal text-neutral-900">{t.pageTitle}</h1>
          <p className="text-lg text-neutral-600 leading-relaxed mt-2">
            {t.intro}
          </p>
        </div>
      </div>

      <HelpSections groups={t.groups} />

      <div className="container mx-auto px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t pt-10">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-normal text-neutral-900">{t.stillNeedHelp}</h2>
          </div>
          <div className="lg:col-span-2 space-y-3">
            <p className="text-muted-foreground">
              {t.emailUsBefore}
              <a href="mailto:hello@scandinavianart.co.uk" className="text-neutral-900 hover:text-neutral-600 transition-colors">hello@scandinavianart.co.uk</a>
              {t.emailUsAfter}
            </p>
            <p className="text-sm text-neutral-900">
              {t.seeAlso}{' '}
              <Link href="/no/delivery" className="hover:text-neutral-600 transition-colors">{t.deliveryLabel}</Link>{' · '}
              <Link href="/no/terms" className="hover:text-neutral-600 transition-colors">{t.termsLabel}</Link>{' · '}
              <Link href="/no/privacy" className="hover:text-neutral-600 transition-colors">{t.privacyLabel}</Link>
            </p>
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}
