import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { creditSections } from '@/components/v2/credits/creditSections';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian twin of app/(en)/credits/page.tsx: the same list from
// lib/credits.ts, with the chrome in Norwegian. Titles, authors and licence
// names stay exactly as the sources give them. noindex, follow, not in the
// sitemap; the EN/NO pair is declared as on the other legal pages.
const t = no.credits;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/credits',
    languages: hreflangPair('/credits'),
  },
  robots: { index: false, follow: true },
  ...socialCard({ title: t.meta.title, description: t.meta.description, path: '/no/credits', ogLocale: 'nb_NO' }),
};

const sections = creditSections({
  groups: t.groups,
  notes: t.notes,
  by: t.by,
  basedOn: t.basedOn,
  where: credit => t.where[credit.id],
});

export default function NorwegianCreditsPage() {
  return (
    <LegalPage
      title={t.meta.title}
      lastUpdated={t.lastUpdated}
      intro={t.intro}
      sections={sections}
      strings={{ home: no.shared.home, homeHref: '/no', lastUpdatedLabel: t.lastUpdatedLabel }}
    />
  );
}
