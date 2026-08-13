import { PUBLISHED_ARTWORK, PUBLISHED_RETIRED, isUsable } from './generated-prices';

export interface PriceCategory {
  [size: string]: {
    GBP: number;
    USD: number;
    NOK: number;
    DKK: number;
    SEK: number;
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
      SEK: 600
    },
    '50x70cm': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770
    }
  },

  // Premium pricing for larger sizes (A3, A2, A1 format)
  'Premium': {
    'A3': {
      GBP: 42,
      USD: 54,
      NOK: 577,
      DKK: 367,
      SEK: 577
    },
    'A2': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770
    },
    'A1': {
      GBP: 77,
      USD: 99,
      NOK: 1058,
      DKK: 673,
      SEK: 1058
    },
    '50x50cm': {
      GBP: 42,
      USD: 54,
      NOK: 577,
      DKK: 367,
      SEK: 577
    },
    '50x70cm': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770
    }
  },

  // Budget pricing for smaller/standard products
  'Budget': {
    '50x50cm': {
      GBP: 35,
      USD: 45,
      NOK: 480,
      DKK: 307,
      SEK: 480
    },
    '50x70cm': {
      GBP: 45,
      USD: 58,
      NOK: 617,
      DKK: 395,
      SEK: 617
    }
  },

  // High-end pricing for premium products (including the typo "Luxary")
  'Luxary': {
    'A3': {
      GBP: 60,
      USD: 77,
      NOK: 823,
      DKK: 526,
      SEK: 823
    },
    'A2': {
      GBP: 80,
      USD: 103,
      NOK: 1100,
      DKK: 703,
      SEK: 1100
    },
    'A1': {
      GBP: 110,
      USD: 141,
      NOK: 1500,
      DKK: 960,
      SEK: 1500
    },
    '50x50cm': {
      GBP: 60,
      USD: 77,
      NOK: 823,
      DKK: 526,
      SEK: 823
    },
    '50x70cm': {
      GBP: 80,
      USD: 103,
      NOK: 1100,
      DKK: 703,
      SEK: 1100
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
      if (isUsable(prices)) merged[category][size] = { ...prices };
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
