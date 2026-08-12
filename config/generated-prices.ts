// GENERATED FILE. Do not edit by hand.
//
// Written by the Publish button on socialagent's Costs page, which commits it
// here and lets Vercel deploy it. The prices live in socialagent's database;
// this file is how they reach the shop.
//
// Publishing by commit rather than reading the database at request time was
// Mark's choice (2026-08-12), and it buys three things: every price change is
// a commit that can be read and reverted, the shop keeps one code path, and a
// cached page can never show one price while the checkout charges another.
//
// Anything absent here falls back to the hand-written prices in
// config/priceCategories.ts and config/frame.ts, so an empty file is safe and
// deleting a row puts a size back on its old price.

export interface PublishedPrices {
  GBP: number;
  USD: number;
  NOK: number;
  DKK: number;
  SEK: number;
}

/** When socialagent last published. Empty means never. */
export const PUBLISHED_AT = '';

/** Artwork prices, by price category and then size. */
export const PUBLISHED_ARTWORK: Record<string, Record<string, PublishedPrices>> = {};

/** What a frame adds, by size. Colours are priced the same as each other. */
export const PUBLISHED_FRAMES: Record<string, PublishedPrices> = {};

/**
 * A published price is only allowed to replace a compiled one if it is
 * complete and sane. A missing currency or a zero would silently sell a print
 * for nothing, and this file is written by a machine over the network.
 */
export function isUsable(prices: PublishedPrices | undefined): prices is PublishedPrices {
  if (!prices) return false;
  return (['GBP', 'USD', 'NOK', 'DKK', 'SEK'] as const).every(currency => {
    const value = prices[currency];
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  });
}
