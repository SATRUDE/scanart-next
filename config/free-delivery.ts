import type { Currency } from '@/lib/pricing';

// Free delivery: who qualifies, in one place.
//
// Mark, 2026-10-21 (T-0087, Peggy's rule): delivery is free when ALL of these
// hold, and charged as normal otherwise:
//   1. the goods total AFTER any discount code, before delivery, is at or above
//      the threshold in the order's currency (exactly the threshold counts);
//   2. nothing in the basket is framed;
//   3. it ships to the UK, Norway, the United States or an EU country.
// Discount codes stack with it; the threshold is simply judged after them.
//
// Why so narrow: free delivery everywhere, framed included, loses money on an
// order (up to about 166 pounds on six framed prints to Switzerland with 25%
// VAT). This rule never goes under zero at 25% VAT in the margin model
// (marks-magazine studio/projects/scanart/free-delivery-margin/).
//
// Thresholds are a rounded local equivalent at or a little above 100 pounds,
// so no buyer gets the line for less than a British buyer. Re-checked on
// 2026-10-21 against the ECB rates of 2026-10-20 (per 1 GBP: USD 1.3347,
// SEK 13.2373, DKK 8.8954, NOK 12.525): USD 135 = GBP 101, SEK 1,350 = GBP 102,
// DKK 900 = GBP 101, NOK 1,500 = GBP 120. All still at or above 100.
//
// This is the ONLY place the rule lives. The server applies it to what is
// charged (lib/server/order.ts); the basket, the product page and checkout
// read it for what they say, so the screen and the charge cannot drift. Google
// Merchant Center's shipping settings are the one thing that must be changed
// by hand to match (and its feed labels every item "unframed",
// app/product-feed.xml).
export const FREE_DELIVERY_THRESHOLD: Record<Currency, number> = {
  GBP: 100,
  USD: 135,
  SEK: 1350,
  DKK: 900,
  NOK: 1500,
};

/** The 27 EU member states, ISO 3166-1 alpha-2. Their overseas territories
 *  that carry their own code (Réunion, Åland, the Faroes and so on) are not
 *  in it: they post at rest-of-world prices. */
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
] as const;

/** Where free delivery applies: the UK, Norway, the US and the EU (which
 *  includes Sweden and Denmark). Switzerland, Iceland, Liechtenstein and the
 *  rest of the world pay delivery as normal. */
export const FREE_DELIVERY_COUNTRIES: ReadonlySet<string> = new Set(['GB', 'NO', 'US', ...EU_COUNTRIES]);

/** A line is framed when it carries any frame id but the explicit no-frame
 *  option, the same test the unframed-only discount scope uses. An unknown
 *  frame id counts as framed, so a mistake can only ever charge delivery. */
export function isFramed(frame: string | null | undefined): boolean {
  return !!frame && frame !== 'no-frame';
}

export interface FreeDeliveryBasket {
  /** Goods total after any discount code, before delivery. */
  goods: number;
  currency: Currency;
  /** The delivery country, or null while it is not known yet (the basket). */
  country: string | null;
  /** Whether any line in the basket is framed. */
  hasFramed: boolean;
}

/**
 * Why a basket does or does not ship free, most decisive reason first, so the
 * copy can say the one thing that matters: a framed print rules it out
 * whatever else, then the destination, then the amount. A basket whose
 * country is not known yet (null) is judged on the other two.
 */
export type FreeDeliveryVerdict = 'free' | 'framed' | 'destination' | 'under';

const cents = (n: number) => Math.round(n * 100);

export function freeDeliveryVerdict({ goods, currency, country, hasFramed }: FreeDeliveryBasket): FreeDeliveryVerdict {
  if (hasFramed) return 'framed';
  if (country !== null && !FREE_DELIVERY_COUNTRIES.has(country.toUpperCase())) return 'destination';
  // Compared in whole pence/ore so a float such as 99.99999999 from a
  // percentage discount cannot sit on the wrong side.
  if (cents(goods) < cents(FREE_DELIVERY_THRESHOLD[currency])) return 'under';
  return 'free';
}

/** Whether this order ships free. The country is required: only the server
 *  and checkout, which know it, may decide a charge. */
export function qualifiesForFreeDelivery(basket: FreeDeliveryBasket & { country: string }): boolean {
  return freeDeliveryVerdict(basket) === 'free';
}

/** How much more to spend to reach the threshold: 0 once it is reached. */
export function amountToFreeDelivery(goods: number, currency: Currency): number {
  return Math.max(0, (cents(FREE_DELIVERY_THRESHOLD[currency]) - cents(goods)) / 100);
}

/** 0 to 1: how far the basket is towards the threshold, for the progress line. */
export function freeDeliveryProgress(goods: number, currency: Currency): number {
  return Math.min(1, Math.max(0, goods / FREE_DELIVERY_THRESHOLD[currency]));
}

/**
 * A money amount the way the free-delivery copy writes it: "£100", "$135",
 * "1 500 kr". Whole units (the amount away rounds UP, so the line never
 * promises free delivery for less than it takes), and kroner amounts group
 * thousands with a non-breaking space as the Norwegian sketches do.
 */
export function formatFreeDeliveryAmount(amount: number, currency: Currency, wholeUp = true): string {
  const value = wholeUp ? Math.ceil(amount - 1e-9) : amount;
  if (currency === 'NOK' || currency === 'DKK' || currency === 'SEK') {
    return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`;
  }
  return `${currency === 'GBP' ? '£' : '$'}${value}`;
}
