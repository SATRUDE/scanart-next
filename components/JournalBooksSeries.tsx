import type { Article } from '@/lib/articles';
import { StoryRow } from '@/components/v2/journal/StoryRow';
import type { ArticleLanguageNote } from '@/lib/article-language';
import { articlePublishedAt, formatArticleDate } from '@/lib/article-reading';

/** The pillar article, listed first and flagged as the place to start. */
const PILLAR_SLUG = 'nordic-art-and-design-books';

/**
 * The six-part Nordic books series, pillar first. Order here is the render
 * order; slugs missing from the synced articles data are silently omitted so
 * the block never links a dead article.
 */
const SERIES_SLUGS = [
  PILLAR_SLUG,
  'nordic-artist-monographs',
  'nordic-design-and-architecture-books',
  'nordic-craft-books-glass-ceramics-textiles',
  'nordic-photography-books',
  'contemporary-nordic-art-books',
];

interface JournalBooksSeriesProps {
  /** The published articles the journal page already loaded via getAllArticles(). */
  articles: Article[];
  /** Localised heading; defaults to the English string. */
  heading?: string;
  /** Localised pillar note; defaults to "(start here)". */
  startHere?: string;
  /** Article category -> visible label (the /no page passes its own). */
  categoryLabels?: Record<string, string>;
  /** Language the dates are written in. */
  locale?: 'en' | 'no';
  /** On /no: each row says the article is in English (lib/article-language.ts). */
  languageNote?: ArticleLanguageNote;
}

/**
 * Books-series hub block for the /journal page. The books family is the
 * site's biggest search-impression earner but the articles only linked to one
 * another in-body; this gives them a stable hub with descriptive anchors
 * (each link is the article's full title). Server-rendered, so the links are
 * in the HTML whatever the journal filter is set to. V2: the reading-list
 * layout of "More to read" (heading on 4 columns, Story rows on 8), no new
 * design language. Renders nothing if none of the series articles are in the
 * data.
 */
export function JournalBooksSeries({ articles, heading, startHere = '(start here)', categoryLabels, locale = 'en', languageNote }: JournalBooksSeriesProps) {
  const bySlug = new Map(articles.map(a => [a.slug, a]));
  const series = SERIES_SLUGS.flatMap(slug => bySlug.get(slug) ?? []);

  if (series.length === 0) return null;

  return (
    <section aria-labelledby="journal-books-series" className="page-grid gap-y-0">
      <div className="col-span-full border-t border-ink pt-4 tab:pt-6 desk:col-span-4">
        <h2 id="journal-books-series" className="type-h2">{heading ?? 'The Nordic books series'}</h2>
      </div>
      <ul className="col-span-full desk:col-span-8">
        {series.map(article => (
          <StoryRow
            key={article.slug}
            href={`/article/${article.slug}`}
            title={article.title}
            note={article.slug === PILLAR_SLUG ? startHere : undefined}
            category={article.category ? categoryLabels?.[article.category] ?? article.category : undefined}
            date={formatArticleDate(articlePublishedAt(article), locale)}
            languageNote={languageNote}
            event="journal-books-series-click"
            eventData={{ to: `/article/${article.slug}` }}
          />
        ))}
      </ul>
    </section>
  );
}
