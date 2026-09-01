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
//
// That fixed the impossible dates but left a second problem, which is what
// CATALOGUE_REVISED is for. A print's Notion record is only one of the three
// things that decide what its page says: the other two are the published
// prices in config/generated-prices.ts and the page template itself, and
// neither has a date the sitemap can read. Because every product record sits
// below SITE_LAUNCH, every catalogue-derived URL reported the floor and kept
// reporting it however often the pages changed. Measured on the live sitemap
// on 2026-08-16: 43 of 72 URLs all read 2026-04-14, including all 20 product
// pages, while their prices had been republished on 2026-08-12 and their
// titles and intros rewritten on 2026-08-13.
//
// So the catalogue gets its own, higher floor, bumped by hand when the
// catalogue's presentation genuinely changes. This is the convention the
// sitemap already uses for the pages with no source record at all (NO_TRANSLATED
// and the hand-dated static pages in app/sitemap.ts, each carrying a comment
// saying to bump it when the copy changes).
//
// Two rules keep it honest, and both matter more than keeping it current:
//   - Only ever set it to a date something in the catalogue actually changed.
//     A date bumped to "now" on every build is the stamp-everything pattern
//     above, and costs more than a slightly stale one.
//   - It applies to catalogue-derived pages only. Articles carry real edit
//     dates spread across the year and are floored at SITE_LAUNCH alone, so
//     an article untouched since July still says July.

/** The Next.js rebuild went live mid-April 2026; no page here predates it. */
export const SITE_LAUNCH = new Date('2026-04-14T00:00:00.000Z');

/**
 * When the catalogue's presentation last genuinely changed: the newest of the
 * product data, the published prices and the product/listing templates.
 *
 * BUMP THIS in the same change that alters any of them. Currently 2026-08-13,
 * the day the buyer-language pass rewrote the product titles and intros and
 * Dragon moved onto the Premium price list.
 */
export const CATALOGUE_REVISED = new Date('2026-08-13T00:00:00.000Z');

/**
 * When the Norwegian shop went live: the catalogue, the product pages, the
 * category and collection landings and the Inspire wall under /no, shipped in
 * PR #173 on 2026-08-22 and dated from the day the translation was finished.
 *
 * This is the same argument as SITE_LAUNCH, one level down. A Norwegian product
 * page reads its date from the English product's Notion record, and every one
 * of those predates the Norwegian page existing: measured on the live sitemap
 * on 2026-09-01, all 16 /no/product URLs reported 2026-08-13, nine days before
 * the pages were built. lastmod is a crawl-scheduling hint, so a URL Google
 * first discovered on 22 August that claims it was last modified on the 13th is
 * telling Google there has never been anything new to fetch. All 16 sat at
 * "Discovered - currently not indexed" with no crawl ever recorded.
 *
 * BUMP THIS only when the Norwegian shop's own wording genuinely changes, on
 * the same terms as CATALOGUE_REVISED: a date moved to "now" on every build is
 * the stamp-everything pattern Google learns to discount.
 */
export const NORWEGIAN_SHOP_LAUNCH = new Date('2026-08-21T00:00:00.000Z');

/** A usable Date, or null for missing, unparseable or non-finite input. */
function parse(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** A record's own date, or the given floor when it is older or unusable. */
function flooredAt(floor: Date, value: string | Date | null | undefined): Date {
  const date = parse(value);
  if (!date) return floor;
  return date.getTime() < floor.getTime() ? floor : date;
}

/** The most recent of several records' dates, never below the given floor. */
function latestFlooredAt(
  floor: Date,
  values: (string | Date | null | undefined)[]
): Date {
  const times = values
    .map(parse)
    .filter((d): d is Date => d !== null)
    .map(d => d.getTime());
  return new Date(Math.max(floor.getTime(), ...times));
}

/**
 * The lastmod for a single record: its own edit date, floored at SITE_LAUNCH.
 * A missing or unparseable date falls back to the floor.
 */
export function sitemapDate(value: string | Date | null | undefined): Date {
  return flooredAt(SITE_LAUNCH, value);
}

/**
 * The lastmod for a page derived from several records (a category landing, an
 * artist page, the homepage): the most recent of them, floored at SITE_LAUNCH.
 * An empty list, or one with nothing parseable in it, gives the floor.
 */
export function latestSitemapDate(
  values: (string | Date | null | undefined)[]
): Date {
  return latestFlooredAt(SITE_LAUNCH, values);
}

/**
 * The lastmod for a single catalogue record (a product page): its own edit
 * date, floored at CATALOGUE_REVISED rather than at the site launch, because
 * the page also reflects prices and a template the record knows nothing about.
 */
export function catalogueDate(value: string | Date | null | undefined): Date {
  return flooredAt(CATALOGUE_REVISED, value);
}

/**
 * The lastmod for a page derived from several catalogue records (a category or
 * collection landing, an artist page, /products): the most recent of them,
 * floored at CATALOGUE_REVISED.
 */
export function latestCatalogueDate(
  values: (string | Date | null | undefined)[]
): Date {
  return latestFlooredAt(CATALOGUE_REVISED, values);
}

/**
 * The lastmod for a single Norwegian catalogue page (/no/product/<slug>): the
 * English record's own date, but never earlier than the Norwegian shop went
 * live. The English twin keeps catalogueDate; only the /no entry gets this
 * floor, because only the /no page is younger than the record it describes.
 */
export function norwegianCatalogueDate(
  value: string | Date | null | undefined
): Date {
  return flooredAt(norwegianFloor(), value);
}

/**
 * The lastmod for a Norwegian page derived from several catalogue records
 * (/no/products, /no/category/<slug>, /no/collection/<slug>): the most recent
 * of them, never earlier than the Norwegian shop went live.
 */
export function latestNorwegianCatalogueDate(
  values: (string | Date | null | undefined)[]
): Date {
  return latestFlooredAt(norwegianFloor(), values);
}

/**
 * The floor for Norwegian catalogue pages. Whichever of the two floors is
 * later, so this stays correct if CATALOGUE_REVISED is ever bumped past the
 * Norwegian launch: a /no page is never older than its English twin's floor,
 * and never older than the day the Norwegian shop shipped.
 */
function norwegianFloor(): Date {
  return CATALOGUE_REVISED.getTime() > NORWEGIAN_SHOP_LAUNCH.getTime()
    ? CATALOGUE_REVISED
    : NORWEGIAN_SHOP_LAUNCH;
}
