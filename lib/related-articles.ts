import type { Article } from './articles';

/**
 * Which articles the "More Articles" block at the foot of an article should
 * link to.
 *
 * Until 2026-09-08 the block rendered only the article's own `relatedArticles`
 * list from the CMS, or the first three articles in file order when that list
 * was empty. Every new article names three or four older pieces, and nothing
 * made the older pieces link back, so a new article gave out links and received
 * none: measured on 2026-09-08, the four newest English articles had one
 * inbound internal link each (the journal index) while the hand-cross-linked
 * book series sat at six to ten. Google had all four at "Discovered, currently
 * not indexed", which is the profile of a page reachable from one listing.
 *
 * Order, deduplicated and never including the article itself:
 *  1. the curated list, in the order the author gave it;
 *  2. every published article whose own list names THIS article (reciprocity),
 *     newest first, so a new piece is linked back from its neighbours the day
 *     it is published, with no CMS edits;
 *  3. if that leaves fewer than `min`, the newest published articles in the
 *     same category, then the newest of any category, until `min` is reached.
 *
 * The curated list is always shown in full. Reciprocal links stop once the
 * block holds `max` cards (three rows of the grid) so a hub article that many
 * pieces name does not grow a footer longer than its body.
 */
export const RELATED_MIN = 3;
export const RELATED_MAX = 9;

function publishedAt(a: Article): number {
  const t = Date.parse(a.published_time ?? a.created_time ?? '');
  return Number.isNaN(t) ? 0 : t;
}

export function selectRelatedArticles(
  article: Pick<Article, 'slug' | 'category' | 'relatedArticles'>,
  all: Article[],
  min: number = RELATED_MIN,
  max: number = RELATED_MAX,
): Article[] {
  const candidates = all.filter(a => a.published !== false && a.slug !== article.slug);
  const bySlug = new Map(candidates.map(a => [a.slug, a]));
  const newestFirst = (xs: Article[]) => [...xs].sort((a, b) => publishedAt(b) - publishedAt(a));

  const chosen: Article[] = [];
  const seen = new Set<string>();
  const add = (a: Article | undefined) => {
    if (!a || seen.has(a.slug)) return;
    seen.add(a.slug);
    chosen.push(a);
  };

  for (const slug of article.relatedArticles ?? []) add(bySlug.get(slug));

  for (const a of newestFirst(candidates.filter(a => (a.relatedArticles ?? []).includes(article.slug)))) {
    if (chosen.length >= max) break;
    add(a);
  }

  if (chosen.length < min) {
    const rest = newestFirst(candidates.filter(a => !seen.has(a.slug)));
    const sameCategory = rest.filter(a => a.category === article.category);
    const others = rest.filter(a => a.category !== article.category);
    for (const a of [...sameCategory, ...others]) {
      if (chosen.length >= min) break;
      add(a);
    }
  }

  return chosen;
}
