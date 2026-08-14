import { TrackedLink } from '@/components/TrackedLink';
import type { Article } from '@/lib/articles';

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
}

/**
 * Books-series hub block for the /journal page. The books family is the
 * site's biggest search-impression earner but the articles only linked to one
 * another in-body; this gives them a stable hub with descriptive anchors
 * (each link is the article's full title). Server-rendered, in the journal
 * page's existing style: same heading treatment and text-link idiom as
 * LandingCrossLinks, no new design language. Renders nothing if none of the
 * series articles are in the data.
 */
export function JournalBooksSeries({ articles }: JournalBooksSeriesProps) {
  const bySlug = new Map(articles.map(a => [a.slug, a]));
  const series = SERIES_SLUGS.flatMap(slug => bySlug.get(slug) ?? []);

  if (series.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-2xl text-neutral-900">The Nordic books series</h2>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {series.map(article => (
          <li key={article.slug}>
            <TrackedLink
              event="journal-books-series-click"
              eventData={{ to: `/article/${article.slug}` }}
              href={`/article/${article.slug}`}
              className="hover:text-foreground"
            >
              {article.title}
            </TrackedLink>
            {article.slug === PILLAR_SLUG && <span> (start here)</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
