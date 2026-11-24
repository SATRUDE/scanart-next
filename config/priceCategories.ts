import { PUBLISHED_ARTWORK, PUBLISHED_RETIRED } from './generated-prices';
import { overlayPrices } from './published-overlay';

// EUR (T-0573, 24 Nov 2026) is the price list for EU buyers outside Denmark
// and Sweden (lib/euro.ts). Each figure is the lowest round number, in fives,
// that keeps Mark's margin rule in every one of those 25 countries at its own
// VAT, and also in a worst case made of the highest VAT among them (Hungary,
// 27%), the dearest live Gelato quote and the cheapest delivery the shop
// charges there. Finland, with 25.5% VAT and Gelato's dearest EU quotes, is
// the market that binds. Every unframed print keeps at least EUR 11.70 (GBP
// 10) and 20% of the price ex VAT at full price, and EUR 5.85 (GBP 5) with
// NORDIC20. Retired lists (Standard, Luxary) are never offered but carry a
// figure at least as high as Premium's for the same size.
export interface PriceCategory {
  [size: string]: {
    GBP: number;
    USD: number;
    NOK: number;
    DKK: number;
    SEK: number;
    EUR: number;
  };
}

const compiledCategories: { [category: string]: PriceCategory } = {
  // Standard pricing for most products (42 GBP for 50x50cm, 56 GBP for 50x70cm)
  'Standard': {
    '50x50cm': {
      GBP: 42,
      USD: 54,
      NOK: 600,
      DKK: 370,
      SEK: 600,
      EUR: 90
    },
    '50x70cm': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770,
      EUR: 90
    }
  },

  // Premium pricing for larger sizes (A3, A2, A1 format)
  'Premium': {
    // A3 and 50 x 50 raised to GBP 50 under Mark's margin rule (24 Nov 2026,
    // T-0573), once the artists on these sizes agreed (Artist Agreement
    // clause 4).
    'A3': {
      GBP: 50,
      USD: 65,
      NOK: 750,
      DKK: 450,
      SEK: 700,
      EUR: 80
    },
    'A2': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770,
      EUR: 90
    },
    'A1': {
      GBP: 77,
      USD: 99,
      NOK: 1058,
      DKK: 673,
      SEK: 1058,
      EUR: 115
    },
    '50x50cm': {
      GBP: 50,
      USD: 65,
      NOK: 750,
      DKK: 475,
      SEK: 700,
      EUR: 90
    },
    '50x70cm': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770,
      EUR: 90
    }
  },

  // Budget pricing for smaller/standard products
  // Both sizes raised to GBP 50 under Mark's margin rule (24 Nov 2026,
  // T-0573), once the artists on this list agreed (Artist Agreement clause 4).
  'Budget': {
    '50x50cm': {
      GBP: 50,
      USD: 65,
      NOK: 750,
      DKK: 475,
      SEK: 700,
      EUR: 90
    },
    '50x70cm': {
      GBP: 50,
      USD: 65,
      NOK: 800,
      DKK: 475,
      SEK: 700,
      EUR: 90
    }
  },

  // Entry pricing, added 2026-09-08 for Hedvig Wallin, whose own shop sells the
  // same posters from 249 SEK. Mark raised it to a round 500 kroner in both
  // krone currencies on 2026-09-09; the rest follow the shop's own ratios from
  // the Premium list (NOK 14.29 : GBP 1, USD 1.286 : GBP 1), and DKK 325 sits
  // between what 500 NOK and 500 SEK are worth in kroner. The 50x50 row is
  // three quarters of the 50x70, the same step Premium uses, and no print sits
  // on it yet. Not a list on socialagent's Costs page, so this is the price
  // until one is published there under the same name.
  'Entry': {
    '50x50cm': {
      GBP: 28,
      USD: 36,
      NOK: 400,
      DKK: 260,
      SEK: 400,
      EUR: 90
    },
    // EUR 90 for both sizes is not a slip: Gelato charges almost the same
    // for a 50 x 50 as a 50 x 70 in the EU, so the margin rule puts both on
    // the same euro price (no print sits on the 50 x 50 yet).
    // Raised to GBP 50 under Mark's margin rule (24 Nov 2026, T-0573), once
    // the artists on this list agreed (Artist Agreement clause 4). At 35 an
    // unframed print kept under GBP 6 after Gelato, the artist, card fees
    // and VAT. NOK and DKK sit above the plain ratio because Norwegian and
    // Danish costs are higher: those are the lowest round numbers that keep
    // GBP 10 and 20% in that market.
    '50x70cm': {
      GBP: 50,
      USD: 65,
      NOK: 800,
      DKK: 475,
      SEK: 700,
      EUR: 90
    }
  },

  // High-end pricing for premium products (including the typo "Luxary")
  'Luxary': {
    'A3': {
      GBP: 60,
      USD: 77,
      NOK: 823,
      DKK: 526,
      SEK: 823,
      EUR: 80
    },
    'A2': {
      GBP: 80,
      USD: 103,
      NOK: 1100,
      DKK: 703,
      SEK: 1100,
      EUR: 95
    },
    'A1': {
      GBP: 110,
      USD: 141,
      NOK: 1500,
      DKK: 960,
      SEK: 1500,
      EUR: 130
    },
    '50x50cm': {
      GBP: 60,
      USD: 77,
      NOK: 823,
      DKK: 526,
      SEK: 823,
      EUR: 90
    },
    '50x70cm': {
      GBP: 80,
      USD: 103,
      NOK: 1100,
      DKK: 703,
      SEK: 1100,
      EUR: 95
    }
  }
};

/**
 * The compiled prices with anything published from socialagent laid over the
 * top, size by size.
 *
 * Merged rather than replaced, and only where the published figures are
 * complete: a category or size socialagent has never touched keeps the price
 * written here, and a malformed row is ignored rather than obeyed. This file
 * stays the floor under a network-written one.
 */
export const priceCategories: { [category: string]: PriceCategory } = (() => {
  const merged: { [category: string]: PriceCategory } = {};
  for (const [category, sizes] of Object.entries(compiledCategories)) {
    merged[category] = { ...sizes };
  }
  for (const [category, sizes] of Object.entries(PUBLISHED_ARTWORK ?? {})) {
    if (!merged[category]) merged[category] = {};
    for (const [size, prices] of Object.entries(sizes)) {
      const overlaid = overlayPrices(merged[category][size], prices);
      if (overlaid) merged[category][size] = overlaid;
    }
  }
  // Markus's and Patrik's natural-ratio formats use the current effective Premium 50 × 70
  // retail price in every market, as approved, until their own rows are
  // published. Copy after overlays so a published 50 × 70 change is respected.
  for (const size of ['40x50cm', '40x60cm', '45x60cm'] as const) {
    // The same test as the overlay above, so a row published before euro
    // existed (no EUR) still counts as published here.
    if (!overlayPrices(compiledCategories.Premium[size], PUBLISHED_ARTWORK?.Premium?.[size])) {
      merged.Premium[size] = { ...merged.Premium['50x70cm'] };
    }
  }
  return merged;
})();

/** What a retirement pass did, so the caller can say so out loud. */
export interface OfferedCategories {
  offered: { [category: string]: PriceCategory };
  /** Retired and removed, because nothing was using them. */
  removed: string[];
  /** Retired but kept, because a published print still sits on them. */
  refused: string[];
}

/**
 * The lists the shop offers, with socialagent's retirements applied.
 *
 * A retirement is honoured only for a list that no published print sits on,
 * and that guard is the whole point rather than caution for its own sake. A
 * print whose list has gone has no prices at all: it renders at zero, goes
 * into the basket at zero, and `computeOrderAmount` then throws `No price for
 * product` for the WHOLE order, not just that line, so one stranded print
 * stops every basket it appears in. Meanwhile a list nothing sits on is
 * invisible whether it is removed or not, because `priceCategories` is read
 * in exactly one place, keyed by a product's own `priceCategory`. Removing
 * an unused list therefore changes nothing and removing a used one breaks
 * checkout, which leaves refusing as the only outcome worth having.
 *
 * socialagent has its own guard against retiring a list a print is on, but it
 * cannot see the catalogue: the prints still live in Notion and the baked
 * products.json, not in its database. On 2026-08-12 it retired `Standard`
 * while `dragon` was still on it, which is why the check belongs here.
 */
export function offeredPriceCategories(
  inUse: Iterable<string>,
  retired: readonly string[] = PUBLISHED_RETIRED ?? [],
  categories: { [category: string]: PriceCategory } = priceCategories
): OfferedCategories {
  const used = new Set(inUse);
  const offered = { ...categories };
  const removed: string[] = [];
  const refused: string[] = [];
  for (const category of retired) {
    if (used.has(category)) {
      refused.push(category);
    } else if (category in offered) {
      delete offered[category];
      removed.push(category);
    }
  }
  return { offered, removed, refused };
}

// Helper function to get prices for a specific category and size
export const getPriceForCategory = (category: string, size: string) => {
  const categoryPrices = priceCategories[category];
  if (!categoryPrices) {
    console.warn(`Price category '${category}' not found`);
    return null;
  }
  
  const sizePrices = categoryPrices[size];
  if (!sizePrices) {
    console.warn(`Size '${size}' not found in category '${category}'`);
    return null;
  }
  
  return sizePrices;
};

// Helper function to get all available sizes for a category
export const getSizesForCategory = (category: string): string[] => {
  const categoryPrices = priceCategories[category];
  if (!categoryPrices) {
    return [];
  }
  return Object.keys(categoryPrices);
};

// Helper function to get all available price categories
export const getAvailablePriceCategories = (): string[] => {
  return Object.keys(priceCategories);
};
