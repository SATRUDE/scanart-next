import type { PublishedPrices } from './generated-prices';

/** Every currency the shop prices in, euro included. */
export interface ShopPrices {
  GBP: number;
  USD: number;
  NOK: number;
  DKK: number;
  SEK: number;
  EUR: number;
}

/** The currencies every published file has carried since 12 Aug 2026. */
const LEGACY = ['GBP', 'USD', 'NOK', 'DKK', 'SEK'] as const;

const positive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * One size's price with what socialagent published laid over the compiled
 * figure, or undefined when the published row cannot be used.
 *
 * Euro arrived after the publisher was written (T-0573, 24 Nov 2026), so a
 * file published by an older socialagent has no EUR. Rather than dropping the
 * whole row, and with it the pound and krone prices Mark published, the euro
 * figure then comes from the compiled list. A row with no euro anywhere is
 * refused: a missing price would sell an EU order for nothing.
 */
export function overlayPrices(compiled: ShopPrices | undefined, published: PublishedPrices | undefined): ShopPrices | undefined {
  // Checked here rather than with the generated file's own isUsable, which
  // since euro also demands EUR and would throw the whole row away.
  if (!published || !LEGACY.every(currency => positive(published[currency]))) return undefined;
  const fromFile = (published as Partial<ShopPrices>).EUR;
  const EUR = positive(fromFile) ? fromFile : compiled?.EUR;
  if (!positive(EUR)) return undefined;
  return { GBP: published.GBP, USD: published.USD, NOK: published.NOK, DKK: published.DKK, SEK: published.SEK, EUR };
}
