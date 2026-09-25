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
  const artists = await getPublishedArtists();
  const meta: Record<string, JournalStoryMeta> = {};
  for (const article of articles) {
    meta[article.slug] = {
      date: formatArticleDate(articlePublishedAt(article), 'no'),
      minutes: readingMinutes(await getArticleBlocks(article.id)),
    };
  }

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
    <div className="page-x pb-section">
      <PageHeader
        title={t.page.heading}
        locale="no"
        lead={
          <>
            <p>{t.meta.description}</p>
            <p>{t.page.intro}</p>
          </>
        }
      />
      <JournalGrid articles={articles} categories={categories} meta={meta} strings={t.page} />
      <div className="mt-24 desk:mt-32">
        <JournalBooksSeries
          articles={articles}
          heading={t.page.booksSeriesHeading}
          startHere={t.page.startHere}
          categoryLabels={t.page.categoryLabels}
          locale="no"
        />
      </div>
      <LandingCrossLinks artists={artists} locale="no" strings={no.crossLinks} className="mt-section" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
