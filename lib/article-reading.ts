import type { Article, NotionBlock } from './articles';

/**
 * Reading helpers for the V2 journal and article templates: the "4 min read"
 * and the story dates in the Figma meta lines. Both are derived from data the
 * site already has (the synced blocks and the article's own timestamps), so
 * the meta line never states anything the article does not.
 */

/** Words per minute for the read-time estimate: the common 200 wpm figure. */
export const WORDS_PER_MINUTE = 200;

const RICH_TEXT_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'quote',
];

/** Every word of running text in the blocks (captions and code are not read as prose). */
export function wordCount(blocks: NotionBlock[]): number {
  let words = 0;
  for (const block of blocks) {
    if (!RICH_TEXT_TYPES.includes(block.type)) continue;
    const payload = block[block.type] as { rich_text?: { plain_text?: string }[] } | undefined;
    const text = (payload?.rich_text ?? []).map(s => s.plain_text ?? '').join('');
    words += text.split(/\s+/).filter(Boolean).length;
  }
  return words;
}

/** Whole minutes, at least one, so an empty snapshot never reads "0 min read". */
export function readingMinutes(blocks: NotionBlock[]): number {
  return Math.max(1, Math.round(wordCount(blocks) / WORDS_PER_MINUTE));
}

/**
 * When the piece went live: the publish date where the store has one, else
 * the draft date. The same rule as the RSS feed (app/feed.xml feedDate), so
 * the visible date, the Article JSON-LD and the feed agree (docs/v2-seo.md,
 * "Article datePublished vs RSS published_time").
 */
export function articlePublishedAt(article: Pick<Article, 'published_time' | 'created_time'>): string {
  return article.published_time || article.created_time;
}

/** "8 August 2026" / "8. august 2026", fixed to Oslo so server and client agree. */
export function formatArticleDate(iso: string | undefined, locale: 'en' | 'no' = 'en'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'no' ? 'nb-NO' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Oslo',
  }).format(d);
}
