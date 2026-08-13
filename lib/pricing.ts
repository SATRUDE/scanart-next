// Helper functions for handling size-based pricing.
//
// Typed structurally rather than importing Product from CartContext: that
// module is 'use client', and lib/ code is read by API routes, where a
// runtime import of a client module breaks the build (lib/address.ts learnt
// this the hard way on 2026-08-12). These shapes are the subset the helpers
// actually touch, and anything satisfying Product satisfies them.

export interface CurrencyPrices {
  GBP: number;
  NOK: number;
  USD: number;
  DKK: number;
  SEK: number;
}

export type Currency = keyof CurrencyPrices;

/** The slice of a product these helpers read. Null and undefined are fine. */
export interface PricedProduct {
  prices?: { [size: string]: CurrencyPrices } | null;
}

const NO_PRICES: CurrencyPrices = { GBP: 0, NOK: 0, USD: 0, DKK: 0, SEK: 0 };

export function getProductPrice(
  product: PricedProduct | null | undefined,
  size?: string,
  currency: Currency = 'GBP'
): number {
  return getProductPrices(product, size)[currency] || 0;
}

export function getProductPrices(
  product: PricedProduct | null | undefined,
  size?: string
): CurrencyPrices {
  const prices = product?.prices;
  if (!prices) return NO_PRICES;

  // If size is specified and exists in the product prices, use it
  if (size && prices[size]) {
    return prices[size];
  }

  // Fallback to 'default' pricing if no size-specific price exists
  if (prices['default']) {
    return prices['default'];
  }

  // Fallback to first available price key
  const firstKey = Object.keys(prices)[0];
  if (firstKey) {
    return prices[firstKey];
  }

  return NO_PRICES;
}

export function getLowestProductPrice(
  product: PricedProduct | null | undefined,
  currency: Currency = 'GBP'
): number {
  return getLowestProductPrices(product)[currency];
}

export function getLowestProductPrices(product: PricedProduct | null | undefined): CurrencyPrices {
  const prices = product?.prices;
  if (!prices) return { ...NO_PRICES };

  const currencies = Object.keys(NO_PRICES) as Currency[];
  const result = { ...NO_PRICES };

  currencies.forEach(currency => {
    const pricesForCurrency = Object.values(prices).map(priceObj => priceObj[currency] || 0);
    if (pricesForCurrency.length) result[currency] = Math.min(...pricesForCurrency);
  });

  return result;
}
