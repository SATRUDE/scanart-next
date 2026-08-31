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
