// The one predicate that decides which Article rows scripts/sync-articles.mjs
// actually syncs. Pulled out to its own module (rather than left as an inline
// `.filter((r) => r.status === 'PUBLISHED')`) purely so it has a test: the
// script itself talks straight to Neon at import time and can't be run in a
// test without a live database connection, but this one line of logic can be.
export function isPublished(row) {
  return row.status === 'PUBLISHED';
}
