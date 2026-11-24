// Euro prices for the main EU markets, on top of the EUR list (T-0573).
//
// The EUR list in config/priceCategories.ts and config/frame.ts is priced for
// the worst case across all 25 euro countries (Hungary's 27% VAT with the
// dearest Gelato quote), which put a 50 x 70 print at EUR 90 everywhere. Mark,
// 24 Nov 2026: "maybe country by country is a bit better for the main
// European countries at least. Germany for example." So these markets get
// their own figures, priced against their OWN VAT, their own live Gelato
// quote (EUR, cheapest shipping, 24 Nov) and the delivery the shop charges
// there. Every other euro country keeps the EUR list.
//
// The rule is unchanged: every single-print order keeps at least GBP 10 (EUR
// 11.70) and 20% of the price ex VAT, and GBP 5 (EUR 5.85) with NORDIC20,
// after Gelato, the artist's 60%, card fees and VAT. Each figure is the GBP
// price at 1.17 euro per pound, rounded up to the next 5, then raised in fives
// until the rule holds in that country, and never above the EUR list. Frames
// keep the ladder (a size never frames cheaper than the one before it).
//
// Which country applies is where the order is DELIVERED (VAT and Gelato's
// cost follow the parcel): the server prices checkout by the delivery
// country, and pages show the visitor's own country until then.
//
// A list or size missing here falls back to the EUR list, so a new print
// list can never be sold for nothing in these markets, only at the EU price.

import type { FrameSize } from './frame';

export interface EuroCountryPrices {
  /** Print price by price list and size, in EUR. */
  prints: Record<string, Record<string, number>>;
  /** What a frame adds, by size, in EUR. */
  frames: Partial<Record<FrameSize, number>>;
}

export const EUR_COUNTRY_PRICES: Record<string, EuroCountryPrices> = {
  // Germany, 19% VAT.
  DE: {
    prints: {
      Entry: { '50x50cm': 60, '50x70cm': 60 },
      Budget: { '50x50cm': 60, '50x70cm': 60 },
      Premium: { A3: 60, A2: 70, A1: 95, '50x50cm': 60, '50x70cm': 70, '40x50cm': 70, '40x60cm': 70, '45x60cm': 70 },
    },
    frames: { A3: 25, A2: 50, '40x50cm': 50, '40x60cm': 50, '45x60cm': 50, '50x50cm': 55, '50x70cm': 65, A1: 85 },
  },
  // Netherlands, 21% VAT.
  NL: {
    prints: {
      Entry: { '50x50cm': 80, '50x70cm': 80 },
      Budget: { '50x50cm': 80, '50x70cm': 80 },
      Premium: { A3: 65, A2: 75, A1: 95, '50x50cm': 80, '50x70cm': 80, '40x50cm': 80, '40x60cm': 80, '45x60cm': 80 },
    },
    frames: { A3: 25, A2: 50, '40x50cm': 50, '40x60cm': 50, '45x60cm': 50, '50x50cm': 55, '50x70cm': 65, A1: 85 },
  },
  // France, 20% VAT.
  FR: {
    prints: {
      Entry: { '50x50cm': 65, '50x70cm': 70 },
      Budget: { '50x50cm': 65, '50x70cm': 70 },
      Premium: { A3: 60, A2: 70, A1: 95, '50x50cm': 65, '50x70cm': 70, '40x50cm': 70, '40x60cm': 70, '45x60cm': 70 },
    },
    frames: { A3: 25, A2: 50, '40x50cm': 50, '40x60cm': 50, '45x60cm': 55, '50x50cm': 55, '50x70cm': 70, A1: 85 },
  },
  // Ireland, 23% VAT.
  IE: {
    prints: {
      Entry: { '50x50cm': 75, '50x70cm': 80 },
      Budget: { '50x50cm': 75, '50x70cm': 80 },
      Premium: { A3: 65, A2: 75, A1: 95, '50x50cm': 75, '50x70cm': 80, '40x50cm': 80, '40x60cm': 80, '45x60cm': 80 },
    },
    frames: { A3: 30, A2: 55, '40x50cm': 55, '40x60cm': 55, '45x60cm': 60, '50x50cm': 60, '50x70cm': 80, A1: 95 },
  },
  // Spain, 21% VAT.
  ES: {
    prints: {
      Entry: { '50x50cm': 80, '50x70cm': 80 },
      Budget: { '50x50cm': 80, '50x70cm': 80 },
      Premium: { A3: 70, A2: 80, A1: 95, '50x50cm': 80, '50x70cm': 80, '40x50cm': 80, '40x60cm': 80, '45x60cm': 80 },
    },
    frames: { A3: 25, A2: 50, '40x50cm': 50, '40x60cm': 50, '45x60cm': 50, '50x50cm': 55, '50x70cm': 65, A1: 85 },
  },
  // Italy, 22% VAT.
  IT: {
    prints: {
      Entry: { '50x50cm': 80, '50x70cm': 85 },
      Budget: { '50x50cm': 80, '50x70cm': 85 },
      Premium: { A3: 65, A2: 80, A1: 105, '50x50cm': 80, '50x70cm': 85, '40x50cm': 85, '40x60cm': 85, '45x60cm': 85 },
    },
    frames: { A3: 30, A2: 50, '40x50cm': 50, '40x60cm': 50, '45x60cm': 60, '50x50cm': 60, '50x70cm': 75, A1: 90 },
  },
  // Belgium, 21% VAT.
  BE: {
    prints: {
      Entry: { '50x50cm': 75, '50x70cm': 75 },
      Budget: { '50x50cm': 75, '50x70cm': 75 },
      Premium: { A3: 65, A2: 70, A1: 95, '50x50cm': 75, '50x70cm': 75, '40x50cm': 75, '40x60cm': 75, '45x60cm': 75 },
    },
    frames: { A3: 30, A2: 55, '40x50cm': 55, '40x60cm': 55, '45x60cm': 60, '50x50cm': 60, '50x70cm': 80, A1: 95 },
  },
  // Austria, 20% VAT.
  AT: {
    prints: {
      Entry: { '50x50cm': 75, '50x70cm': 80 },
      Budget: { '50x50cm': 75, '50x70cm': 80 },
      Premium: { A3: 65, A2: 75, A1: 95, '50x50cm': 75, '50x70cm': 80, '40x50cm': 80, '40x60cm': 80, '45x60cm': 80 },
    },
    frames: { A3: 25, A2: 50, '40x50cm': 50, '40x60cm': 50, '45x60cm': 55, '50x50cm': 60, '50x70cm': 75, A1: 90 },
  },
  // Finland, 25.5% VAT.
  FI: {
    prints: {
      Entry: { '50x50cm': 85, '50x70cm': 90 },
      Budget: { '50x50cm': 85, '50x70cm': 90 },
      Premium: { A3: 75, A2: 85, A1: 95, '50x50cm': 85, '50x70cm': 90, '40x50cm': 90, '40x60cm': 90, '45x60cm': 90 },
    },
    frames: { A3: 25, A2: 55, '40x50cm': 55, '40x60cm': 55, '45x60cm': 60, '50x50cm': 60, '50x70cm': 80, A1: 95 },
  },
};

/** The euro print price for this list and size in this country, if it has its own. */
export function countryEuroPrint(category: string | null | undefined, size: string | undefined, country: string | null | undefined): number | undefined {
  if (!category || !size || !country) return undefined;
  return EUR_COUNTRY_PRICES[country.toUpperCase()]?.prints[category]?.[size];
}

/** What a frame adds in this country, if it has its own figure. */
export function countryEuroFrame(size: string | undefined, country: string | null | undefined): number | undefined {
  if (!size || !country) return undefined;
  return EUR_COUNTRY_PRICES[country.toUpperCase()]?.frames[size as FrameSize];
}
