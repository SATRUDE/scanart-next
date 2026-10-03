import type { Currency } from '@/lib/pricing';

// Free delivery, one threshold per currency, in one place.
//
// Mark, 2026-10-03: delivery is free to EVERY destination on an order of
// 100 pounds OR MORE (exactly 100 qualifies). The other currencies are a
// rounded local equivalent at or slightly above 100 pounds, so a buyer paying
// in kroner or dollars is never asked for less than a British buyer.
//
// Rates on 2026-10-02 (ECB, per 1 GBP): USD 1.3201, SEK 13.2772, DKK 8.7891,
// NOK 12.738. NOK 1,500 was agreed with Mark before the others and is above
// the day's rate (about 118 pounds); the shop's own NOK prices run at roughly
// 14 kroner to the pound, which is where it comes from.
//
// This is the ONLY place the numbers live. The server applies it to what is
// charged (lib/server/order.ts), and the basket, the product page and
// checkout read it for what is shown, so the screen and the charge cannot
// drift. Changing a number here changes both; the Google Merchant Center
// shipping settings and nothing else must be changed by hand to match.
export const FREE_DELIVERY_THRESHOLD: Record<Currency, number> = {
  GBP: 100,
  USD: 135,
  SEK: 1350,
  DKK: 900,
  NOK: 1500,
};

const cents = (n: number) => Math.round(n * 100);

/**
 * Whether this basket ships free. `subtotal` is the goods total after any
 * discount code and before delivery. "Or more": exactly the threshold
 * qualifies. Compared in whole pence/ore so a float such as 99.99999999 from
 * a percentage discount cannot sit on the wrong side.
 */
export function qualifiesForFreeDelivery(subtotal: number, currency: Currency): boolean {
  return cents(subtotal) >= cents(FREE_DELIVERY_THRESHOLD[currency]);
}

/** How much more to spend to ship free: 0 once the basket qualifies. */
export function amountToFreeDelivery(subtotal: number, currency: Currency): number {
  return Math.max(0, (cents(FREE_DELIVERY_THRESHOLD[currency]) - cents(subtotal)) / 100);
}

/** 0 to 1: how far the basket is towards the threshold, for the progress line. */
export function freeDeliveryProgress(subtotal: number, currency: Currency): number {
  return Math.min(1, Math.max(0, subtotal / FREE_DELIVERY_THRESHOLD[currency]));
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
    return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`;
  }
  return `${currency === 'GBP' ? '£' : '$'}${value}`;
}
