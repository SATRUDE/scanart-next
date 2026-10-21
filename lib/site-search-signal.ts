/**
 * Whether a submitted site search is worth recording as a `site-search` event.
 *
 * "Nothing matched your query" and "there was nothing to search" are different
 * facts, and the event conflated them. `getAllProducts()` returns an empty
 * array when the catalogue cannot be read, and against an empty catalogue every
 * query matches nothing, so the event reports `results: 0` exactly as a genuine
 * catalogue gap does.
 *
 * That matters because the nightly round treats a zero-results row as a
 * catalogue or content gap and weights proposed work by it. On 2026-08-29 the
 * query `simen` was recorded with zero results while five prints by Simen
 * Wahlqvist were live and `/artist/simen-wahlqvist` was the best-ranking page
 * on the site, which is a false gap pointing at work that does not need doing.
 *
 * So a search against an empty catalogue is not tracked at all. That makes the
 * zero-results signal trustworthy by construction rather than by hoping the
 * catalogue loaded, which is the same principle as the price-list guard in
 * lib/products.ts: an unreadable catalogue counts as unknown, never as empty.
 */
export function shouldTrackSiteSearch(query: string, catalogueSize: number): boolean {
  // An empty query is not a search: the grid clears the filter rather than
  // running one, so there is no demand to record.
  if (!query) return false;
  return catalogueSize > 0;
}

/** Longest query an analytics event carries (T-0151). */
export const ANALYTICS_QUERY_MAX = 100;

/**
 * A search query as analytics records it: trimmed, lowercased, inner spaces
 * collapsed, at most 100 characters. Anything that looks like personal data
 * is replaced rather than sent: an email address becomes "[email]", and a run
 * of six or more digits (a phone or order number) becomes "[number]", because
 * people do type their order number or email into a shop's search box. An
 * empty result is no query, and the caller records nothing.
 */
export function analyticsQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\s@]+@[^\s@]+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{4,}\d/g, m => (m.replace(/\D/g, '').length >= 6 ? '[number]' : m))
    .replace(/\s+/g, ' ')
    .slice(0, ANALYTICS_QUERY_MAX)
    .trim();
}

/**
 * The site path a click inside the search results went to, or null when the
 * click was not on a link to this site (a tab, a button, an outside link).
 * Path only: no query string, no hash, so nothing typed elsewhere rides along.
 */
export function resultClickPath(target: EventTarget | null, origin: string): string | null {
  const el = target as { closest?: (s: string) => { getAttribute: (n: string) => string | null } | null } | null;
  const href = el?.closest?.('a[href]')?.getAttribute('href');
  if (!href) return null;
  try {
    const url = new URL(href, origin);
    return url.origin === origin ? url.pathname : null;
  } catch {
    return null;
  }
}

type Track = (event: string, data?: Record<string, unknown>) => void;

/**
 * Someone pressed Enter (or Search) on a search field. Recorded where the
 * search is submitted, apart from the `site-search` event the results page
 * fires when it lands, so neither count is inflated. Results is the count the
 * searcher could see when they submitted.
 */
export function trackSearchSubmit(track: Track, raw: string, results: number, source: string, catalogueSize: number): void {
  const query = analyticsQuery(raw);
  if (!shouldTrackSiteSearch(query, catalogueSize)) return;
  track('site-search-submit', { query, results, source });
}

/** Someone followed a search result: which query took them where. */
export function trackSearchResultClick(track: Track, raw: string, path: string | null, source: string): void {
  const query = analyticsQuery(raw);
  if (!query || !path) return;
  track('site-search-click', { query, path, source });
}
