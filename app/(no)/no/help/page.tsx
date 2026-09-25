import type { Metadata } from 'next';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';
import { noV2 } from '@/lib/i18n/no-v2-pages';
import { Button, ContentSection, PageHeader, TextLink } from '@/components/v2/ui';
import { HelpGroups, HelpJumpLinks } from '@/components/v2/help/HelpGroups';

// The Norwegian Help page: app/(en)/help/page.tsx mirrored exactly (same
// Question rows, same grid), with the FAQ content swapped for the Norwegian
// groups in lib/i18n/no.ts and every link kept inside /no.
const t = no.help;
const v = noV2.help;
const EMAIL = 'hello@scandinavianart.co.uk';

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
    <div className="page-x pb-section">
      <PageHeader
        title={t.pageTitle}
        locale="no"
        lead={
          <>
            {v.leadBefore}
            <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-brand">{EMAIL}</a>
            {v.leadAfter}
          </>
        }
      />
      <HelpJumpLinks groups={t.groups} />

      <div className="mt-block desk:mt-24">
        <HelpGroups groups={t.groups} countLabel={n => (n === 1 ? v.countOne : v.countOther.replace('{n}', String(n)))} />
      </div>

      <ContentSection
        id="still-stuck"
        className="mt-section"
        title={v.stillStuck}
        intro={<p>{v.stillStuckBefore}{EMAIL}{v.stillStuckAfter}</p>}
        footer={
          <>
            <Button href={`mailto:${EMAIL}`}>{v.emailUs}</Button>
            <TextLink href="/no/delivery" size="body" arrow={false}>{t.deliveryLabel}</TextLink>
            <TextLink href="/no/terms" size="body" arrow={false}>{t.termsLabel}</TextLink>
          </>
        }
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}
