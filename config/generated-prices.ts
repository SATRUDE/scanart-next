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
export const PUBLISHED_AT = '2026-08-12T14:24:17.389Z';

/** Artwork prices, by price category and then size. */
export const PUBLISHED_ARTWORK: Record<string, Record<string, PublishedPrices>> = {
  'Premium': {
    'A3': { GBP: 50, USD: 65, NOK: 750, DKK: 450, SEK: 700 },
    'A2': { GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800 },
    'A1': { GBP: 77, USD: 99, NOK: 1000, DKK: 700, SEK: 1100 },
    '50x50cm': { GBP: 50, USD: 65, NOK: 750, DKK: 475, SEK: 700 },
    '50x70cm': { GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800 },
  },
  'Budget': {
    '50x50cm': { GBP: 50, USD: 65, NOK: 750, DKK: 475, SEK: 700 },
    '50x70cm': { GBP: 50, USD: 65, NOK: 800, DKK: 475, SEK: 700 },
  },
};

/** Price lists retired here, which the shop stops offering. */
export const PUBLISHED_RETIRED: string[] = ['Luxary', 'Standard'];

/** What a frame adds, by size. Colours are priced the same as each other. */
export const PUBLISHED_FRAMES: Record<string, PublishedPrices> = {
  'A3': { GBP: 20, USD: 35, NOK: 350, DKK: 275, SEK: 350 },
  'A2': { GBP: 40, USD: 70, NOK: 600, DKK: 425, SEK: 550 },
  '40x50cm': { GBP: 40, USD: 70, NOK: 650, DKK: 450, SEK: 550 },
  '40x60cm': { GBP: 40, USD: 70, NOK: 650, DKK: 450, SEK: 550 },
  '45x60cm': { GBP: 40, USD: 70, NOK: 650, DKK: 450, SEK: 550 },
  '50x50cm': { GBP: 45, USD: 70, NOK: 750, DKK: 500, SEK: 650 },
  '50x70cm': { GBP: 55, USD: 85, NOK: 900, DKK: 625, SEK: 800 },
  'A1': { GBP: 70, USD: 105, NOK: 1050, DKK: 750, SEK: 950 },
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
