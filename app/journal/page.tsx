import type { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';
import { JournalGrid } from '@/components/JournalGrid';
import { BASE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Read about Scandinavian art, Nordic design, and the artists behind our curated collection.',
  alternates: {
    canonical: '/journal',
  },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
