import type { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';
import { JournalGrid } from '@/components/JournalGrid';
import { JournalBooksSeries } from '@/components/JournalBooksSeries';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian journal index. The articles themselves stay in English for
// now, so the cards deliberately link out of the /no tree to /article/<slug>
// rather than to twins that do not exist, and the intro line says so up front
// instead of letting a reader click through and be surprised.
const t = no.journal;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/journal',
    languages: hreflangPair('/journal'),
  },
  ...socialCard({
    title: t.meta.title,
    description: t.meta.description,
    path: '/no/journal',
    ogLocale: 'nb_NO',
  }),
};

export default async function NorwegianJournalPage() {
  const articles = await getAllArticles();
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))].sort();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.meta.title,
    description: t.meta.description,
    url: `${BASE_URL}/no/journal`,
    inLanguage: 'nb-NO',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((article, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: article.title,
        // The English article, because that is where the link goes.
        url: `${BASE_URL}/article/${article.slug}`,
      })),
    },
  };

  return (
    <>
      <JournalGrid articles={articles} categories={categories} strings={t.page} />
      <div className="container mx-auto px-8 pb-16">
        <JournalBooksSeries articles={articles} heading={t.page.booksSeriesHeading} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
