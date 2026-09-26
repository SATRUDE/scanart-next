import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { creditSections } from '@/components/v2/credits/creditSections';
import { creditsEn } from '@/lib/credits';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

// Attribution for the Wikimedia Commons footage and photographs the site
// ships (lib/credits.ts). A page people reach from the footer, not one for
// search: noindex, follow, and deliberately absent from the sitemap, which
// docs/v2-seo.md keeps exactly as it was. It still declares its EN/NO pair,
// like the other legal pages.
const PAGE_TITLE = creditsEn.meta.title;
const PAGE_DESCRIPTION = creditsEn.meta.description;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/credits',
    languages: hreflangPair('/credits'),
  },
  robots: { index: false, follow: true },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/credits' }),
};

const sections = creditSections({
  groups: creditsEn.groups,
  notes: creditsEn.notes,
  by: creditsEn.by,
  basedOn: creditsEn.basedOn,
  where: credit => credit.where,
});

export default function CreditsPage() {
  return <LegalPage title={PAGE_TITLE} lastUpdated={creditsEn.lastUpdated} intro={creditsEn.intro} sections={sections} />;
}
