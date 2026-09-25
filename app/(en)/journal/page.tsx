import type { Metadata } from 'next';
import { getAllArticles, getArticleBlocks } from '@/lib/articles';
import { JournalGrid, type JournalStoryMeta } from '@/components/JournalGrid';
import { JournalBooksSeries } from '@/components/JournalBooksSeries';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { PageHeader } from '@/components/v2/ui';
import { getPublishedArtists } from '@/lib/published-artists';
import { articlePublishedAt, formatArticleDate, readingMinutes } from '@/lib/article-reading';
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
  const artists = await getPublishedArtists();
  // The featured story's "8 August 2026 — 4 min read" and the row dates.
  const meta: Record<string, JournalStoryMeta> = {};
  for (const article of articles) {
    meta[article.slug] = {
      date: formatArticleDate(articlePublishedAt(article)),
      minutes: readingMinutes(await getArticleBlocks(article.id)),
    };
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Journal',
    description: PAGE_DESCRIPTION,
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
    <div className="page-x pb-section">
      <PageHeader title={PAGE_TITLE} lead={<p>{PAGE_DESCRIPTION}</p>} />
      <JournalGrid articles={articles} categories={categories} meta={meta} />
      <div className="mt-24 desk:mt-32">
        <JournalBooksSeries articles={articles} />
      </div>
      {/* Explore the shop: the journal's way into the categories, collections
          and artists, the same closing block as the landings. */}
      <LandingCrossLinks artists={artists} className="mt-section" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
