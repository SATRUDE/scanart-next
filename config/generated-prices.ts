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
export const PUBLISHED_AT = '2026-08-12T13:56:06.012Z';

/** Artwork prices, by price category and then size. */
export const PUBLISHED_ARTWORK: Record<string, Record<string, PublishedPrices>> = {
  'Premium': {
    'A3': { GBP: 42, USD: 54, NOK: 600, DKK: 400, SEK: 600 },
    'A2': { GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800 },
    'A1': { GBP: 77, USD: 99, NOK: 1000, DKK: 700, SEK: 1100 },
    '50x50cm': { GBP: 42, USD: 54, NOK: 600, DKK: 400, SEK: 600 },
    '50x70cm': { GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800 },
  },
  'Standard': {
    '50x50cm': { GBP: 42, USD: 54, NOK: 600, DKK: 370, SEK: 600 },
    '50x70cm': { GBP: 56, USD: 72, NOK: 770, DKK: 490, SEK: 770 },
  },
  'Budget': {
    '50x50cm': { GBP: 35, USD: 45, NOK: 480, DKK: 307, SEK: 480 },
    '50x70cm': { GBP: 45, USD: 58, NOK: 617, DKK: 395, SEK: 617 },
  },
  'Luxary': {
    'A3': { GBP: 60, USD: 77, NOK: 823, DKK: 526, SEK: 823 },
    'A2': { GBP: 80, USD: 103, NOK: 1100, DKK: 703, SEK: 1100 },
    'A1': { GBP: 110, USD: 141, NOK: 1500, DKK: 960, SEK: 1500 },
    '50x50cm': { GBP: 60, USD: 77, NOK: 823, DKK: 526, SEK: 823 },
    '50x70cm': { GBP: 80, USD: 103, NOK: 1100, DKK: 703, SEK: 1100 },
  },
};

/** What a frame adds, by size. Colours are priced the same as each other. */
export const PUBLISHED_FRAMES: Record<string, PublishedPrices> = {
  'A3': { GBP: 18, USD: 32, NOK: 300, DKK: 210, SEK: 265 },
  'A2': { GBP: 29, USD: 51, NOK: 450, DKK: 315, SEK: 410 },
  '50x50cm': { GBP: 32, USD: 51, NOK: 500, DKK: 350, SEK: 455 },
  '50x70cm': { GBP: 39, USD: 59, NOK: 600, DKK: 445, SEK: 560 },
  'A1': { GBP: 55, USD: 82, NOK: 700, DKK: 575, SEK: 735 },
};

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
