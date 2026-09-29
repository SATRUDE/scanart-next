/** Ishtar's preview gate: an explicit draft marker never widens the sale catalogue. */
export function catalogueReviewEnabled(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === 'preview';
  return process.env.NODE_ENV === 'development' && process.env.CATALOGUE_PREVIEW === '1';
}
