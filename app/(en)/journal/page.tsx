import type { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';
import { JournalGrid } from '@/components/JournalGrid';
import { JournalBooksSeries } from '@/components/JournalBooksSeries';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

const PAGE_TITLE = 'Journal';
const PAGE_DESCRIPTION = 'Read about Scandinavian art, Nordic design, and the artists behind our curated collection.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/journal',
    languages: hreflangPair('/journal'),
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/journal' }),
};

export default async function JournalPage() {
  const articles = await getAllArticles();
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))].sort();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Journal',
    description: 'Read about Scandinavian art, Nordic design, and the artists behind our curated collection.',
    url: `${BASE_URL}/journal`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((article, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: article.title,
        url: `${BASE_URL}/article/${article.slug}`,
      })),
    },
  };

  return (
    <>
      <JournalGrid articles={articles} categories={categories} />
      <div className="container mx-auto px-8 pb-16">
        <JournalBooksSeries articles={articles} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
