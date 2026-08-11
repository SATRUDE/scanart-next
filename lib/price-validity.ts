// How long the Product JSON-LD says a price is guaranteed.
//
// schema.org's `priceValidUntil` is a recommended field on merchant-listing
// offers, and Google treats one that has passed as a stale offer rather than
// simply ignoring it. That matters here because product pages are statically
// generated: whatever this returns is frozen into the prerendered HTML and
// stays there until the next deploy.
//
// The page previously wrote `${new Date().getFullYear()}-12-31`, which meant
// the horizon shrank as each year ran on and would sit in the past for any
// stretch of a new year that had no deploy in it. A fixed distance from the
// build date has no such edge: it is always the same length ahead, whenever
// the build happens.

/** How far ahead of the build the stated price validity reaches. */
const HORIZON_YEARS = 1;

/**
 * The `priceValidUntil` value for a product offer, as an ISO date (YYYY-MM-DD).
 *
 * @param from The moment the horizon is measured from; defaults to now, which
 *   at build time is the build. Passing it explicitly is what makes this
 *   testable.
 */
export function priceValidUntil(from: Date = new Date()): string {
  const until = new Date(from);
  until.setUTCFullYear(until.getUTCFullYear() + HORIZON_YEARS);
  return until.toISOString().slice(0, 10);
}
