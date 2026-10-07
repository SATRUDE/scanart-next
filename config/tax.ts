// VAT / MVA, as the order guard (lib/server/order-margin.ts) counts it.
//
// The shop does not add tax at checkout (CheckoutPage: "No tax for any
// orders"), so every price a buyer pays is treated as tax-INCLUSIVE: if VAT is
// owed on a sale it comes out of the price, and out of the gallery's 40%
// (Mark, 2026-10-07: "card fees and MVA come out of the gallery's share").
//
// Whether it is owed today depends on registrations this code cannot see
// (company.ts has no org number yet; the Stripe account is a UK company).
//
// GUARD_COUNTS_VAT decides whether the checkout guard takes it off before
// judging an order. It is OFF, deliberately, until Mark decides: counted at
// these rates, framed 50 x 50 / 50 x 70 / A1 sales to Norway, Denmark and
// Sweden come out below zero, so switching it on would stop those sales
// today. The margin audit reports both ways.
export const GUARD_COUNTS_VAT = false;

// Standard rates as of 2026-10. A country not listed counts no VAT.

export const STANDARD_VAT_RATES: Record<string, number> = {
  GB: 0.2,
  NO: 0.25,
  SE: 0.25,
  DK: 0.25,
  FI: 0.255,
  IS: 0.24,
  DE: 0.19,
  FR: 0.2,
  NL: 0.21,
  BE: 0.21,
  LU: 0.17,
  IE: 0.23,
  ES: 0.21,
  PT: 0.23,
  IT: 0.22,
  AT: 0.2,
  CH: 0.081,
  PL: 0.23,
  CZ: 0.21,
  SK: 0.23,
  HU: 0.27,
  SI: 0.22,
  HR: 0.25,
  RO: 0.21,
  BG: 0.2,
  GR: 0.24,
  CY: 0.19,
  MT: 0.18,
  EE: 0.24,
  LV: 0.21,
  LT: 0.21,
  AU: 0.1,
  NZ: 0.15,
};

/** The VAT share of a tax-inclusive amount: 20% VAT is 1/6 of the price. */
export function vatInside(amount: number, country: string): number {
  const rate = STANDARD_VAT_RATES[country.toUpperCase()] ?? 0;
  return rate > 0 ? (amount * rate) / (1 + rate) : 0;
}
