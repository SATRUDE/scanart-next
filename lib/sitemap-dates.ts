// Dates for sitemap <lastmod> entries.
//
// Most of the catalogue is dated from its source record: products carry a
// Notion `last_edited_time`, articles carry theirs from the article store.
// Those dates are the honest signal and are used as-is wherever they are
// plausible, which is what makes lastmod worth sending at all: Google leans on
// it only where it is consistently accurate, and a sitemap that stamps
// everything with the build time is the pattern it learns to discount.
//
// The catch is that a source date can predate the page it describes. Every
// print in the catalogue was created in the Notion database in August 2025 and
// most have not been edited there since, while this site is a Next.js rebuild
// that went live in April 2026 and whose product pages have been rewritten in
// the repo several times since (descriptions, image alt text). Passing those
// dates straight through had the sitemap telling Google that 43 of its 71 URLs
// had been untouched for eight months before the site existed.
//
// So a page is never older than the site: SITE_LAUNCH is a floor applied to
// every date, not just a fallback for records that have none. Genuine 2026
// edit dates pass through untouched; only the impossible ones move.

/** The Next.js rebuild went live mid-April 2026; no page here predates it. */
export const SITE_LAUNCH = new Date('2026-04-14T00:00:00.000Z');

/** A usable Date, or null for missing, unparseable or non-finite input. */
function parse(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/**
 * The lastmod for a single record: its own edit date, floored at SITE_LAUNCH.
 * A missing or unparseable date falls back to the floor.
 */
export function sitemapDate(value: string | Date | null | undefined): Date {
  const date = parse(value);
  if (!date) return SITE_LAUNCH;
  return date.getTime() < SITE_LAUNCH.getTime() ? SITE_LAUNCH : date;
}

/**
 * The lastmod for a page derived from several records (a category landing, an
 * artist page, the homepage): the most recent of them, floored at SITE_LAUNCH.
 * An empty list, or one with nothing parseable in it, gives the floor.
 */
export function latestSitemapDate(
  values: (string | Date | null | undefined)[]
): Date {
  const times = values
    .map(parse)
    .filter((d): d is Date => d !== null)
    .map(d => d.getTime());
  return new Date(Math.max(SITE_LAUNCH.getTime(), ...times));
}
