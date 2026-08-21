import { getAllArticles } from '@/lib/articles';
import { BASE_URL, SITE_NAME } from '@/lib/site';

// Static like the sitemap: built once at build time and revalidated on deploy,
// so the feed reflects whatever the prebuild Notion sync baked into
// public/notion-data. No request-time data is read.
export const dynamic = 'force-static';

const FEED_TITLE = `${SITE_NAME} Journal`;
const FEED_DESCRIPTION =
  'New writing from Scandinavian Art Gallery: Nordic art and design, styling guides, artist features and what is on in Oslo.';

// Minimal XML text escaping for character data (titles, descriptions, etc.).
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// RFC-822 / RFC-1123 date string as RSS pubDate expects (e.g.
// "Wed, 08 Jul 2026 08:01:00 GMT"); falls back to now for a missing date.
function rssDate(value: string | undefined): string {
  const d = value ? new Date(value) : new Date();
  return (isNaN(d.getTime()) ? new Date() : d).toUTCString();
}

/**
 * The date a feed reader should sort and show an item by: when it was
 * published, falling back to when the draft was created.
 *
 * Why the fallback rather than just publishedAt: the committed articles
 * snapshot is the no-database fallback for a build without
 * ARTICLES_DATABASE_URL, and it predates the field, so published_time can be
 * absent or null. Falling back preserves today's behaviour exactly in that
 * case rather than emitting an empty pubDate.
 */
export function feedDate(article: {
  published_time?: string | null;
  created_time?: string;
  last_edited_time?: string;
}): string | undefined {
  return article.published_time || article.created_time || article.last_edited_time;
}

export async function GET(): Promise<Response> {
  const articles = await getAllArticles();

  // Newest first by PUBLICATION date, not by when the draft was created. Those
  // were the same thing until scheduled publishing landed on 2026-08-14; since
  // then an article can sit in the drawer for a week, and sorting or stamping by
  // created_time puts it into the feed already backdated and therefore already
  // buried below whatever appeared in between.
  const sorted = [...articles].sort((a, b) => {
    const at = new Date(feedDate(a) ?? 0).getTime();
    const bt = new Date(feedDate(b) ?? 0).getTime();
    return bt - at;
  });

  const lastBuildDate = rssDate(
    sorted[0]?.last_edited_time || sorted[0]?.created_time
  );

  const items = sorted
    .map(article => {
      const url = `${BASE_URL}/article/${article.slug}`;
      const category = article.category
        ? `\n      <category>${escapeXml(article.category)}</category>`
        : '';
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rssDate(feedDate(article))}</pubDate>
      <description>${escapeXml(article.excerpt || '')}</description>${category}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${BASE_URL}/journal</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-GB</language>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
