import type { Metadata } from 'next';
import { socialCard } from '@/lib/site';
import { basketStrings, hreflangPair } from '@/lib/i18n';
import { deliveryGuideLine, withAnswer } from '@/lib/delivery-guide';
import { getDeliveryGuide } from '@/lib/server/delivery-guide';
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

export default async function NorwegianHelpPage() {
  // "Hva koster frakten?" with the store's from-prices in kroner (the prices
  // checkout charges), resolved here so the page stays static.
  const guide = await getDeliveryGuide();
  const { regions, and } = basketStrings.no;
  const d = t.deliveryCost;
  const groups = withAnswer(
    t.groups,
    d.q,
    `${d.lead} ${d.guide.replace('{guide}', deliveryGuideLine(guide, 'NOK', regions, and, 'no'))} ${d.close}`,
  );

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'no',
    mainEntity: groups.flatMap(group =>
      group.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    ),
  };

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
      <HelpJumpLinks groups={groups} />

      <div className="mt-band desk:mt-24">
        <HelpGroups groups={groups} countLabel={n => (n === 1 ? v.countOne : v.countOther.replace('{n}', String(n)))} />
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
