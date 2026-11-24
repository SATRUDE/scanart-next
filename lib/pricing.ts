// Helper functions for handling size-based pricing.
//
// Typed structurally rather than importing Product from CartContext: that
// module is 'use client', and lib/ code is read by API routes, where a
// runtime import of a client module breaks the build (lib/address.ts learnt
// this the hard way on 2026-08-12). These shapes are the subset the helpers
// actually touch, and anything satisfying Product satisfies them.

import { countryEuroPrint, EUR_COUNTRY_PRICES } from '@/config/eur-countries';

export interface CurrencyPrices {
  GBP: number;
  NOK: number;
  USD: number;
  DKK: number;
  SEK: number;
  /** Euro, for buyers in the EU outside Denmark and Sweden (T-0573). */
  EUR: number;
}

export type Currency = keyof CurrencyPrices;

/** The slice of a product these helpers read. Null and undefined are fine. */
export interface PricedProduct {
  prices?: { [size: string]: CurrencyPrices } | null;
  /** The price list, which the per-country euro prices are keyed by. */
  priceCategory?: string | null;
}

/**
 * One size's prices with the euro swapped for this country's own figure,
 * where it has one (config/eur-countries.ts). Every other currency, and every
 * other country, is left exactly as it was.
 */
function withCountryEuro(
  prices: CurrencyPrices,
  product: PricedProduct | null | undefined,
  size: string,
  country: string | undefined
): CurrencyPrices {
  const own = countryEuroPrint(product?.priceCategory, size, country);
  return own === undefined ? prices : { ...prices, EUR: own };
}

const NO_PRICES: CurrencyPrices = { GBP: 0, NOK: 0, USD: 0, DKK: 0, SEK: 0, EUR: 0 };

/**
 * `country` is where the euro price is judged (config/eur-countries.ts): the
 * delivery country at checkout and on the server, the visitor's own country
 * on a page. Leave it out for the EUR list.
 */
export function getProductPrice(
  product: PricedProduct | null | undefined,
  size?: string,
  currency: Currency = 'GBP',
  country?: string
): number {
  return getProductPrices(product, size, country)[currency] || 0;
}

export function getProductPrices(
  product: PricedProduct | null | undefined,
  size?: string,
  country?: string
): CurrencyPrices {
  const prices = product?.prices;
  if (!prices) return NO_PRICES;

  // If size is specified and exists in the product prices, use it
  if (size && prices[size]) {
    return withCountryEuro(prices[size], product, size, country);
  }

  // Fallback to 'default' pricing if no size-specific price exists
  if (prices['default']) {
    return prices['default'];
  }

  // Fallback to first available price key
  const firstKey = Object.keys(prices)[0];
  if (firstKey) {
    return withCountryEuro(prices[firstKey], product, firstKey, country);
  }

  return NO_PRICES;
}

export function getLowestProductPrice(
  product: PricedProduct | null | undefined,
  currency: Currency = 'GBP',
  country?: string
): number {
  return getLowestProductPrices(product, country)[currency];
}

export function getLowestProductPrices(product: PricedProduct | null | undefined, country?: string): CurrencyPrices {
  const prices = product?.prices;
  if (!prices) return { ...NO_PRICES };

  const currencies = Object.keys(NO_PRICES) as Currency[];
  const result = { ...NO_PRICES };
  const local = Object.entries(prices).map(([size, priceObj]) => withCountryEuro(priceObj, product, size, country));

  currencies.forEach(currency => {
    const pricesForCurrency = local.map(priceObj => priceObj[currency] || 0);
    if (pricesForCurrency.length) result[currency] = Math.min(...pricesForCurrency);
  });

  return result;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  NOK: 'kr',
  USD: '$',
  DKK: 'kr',
  SEK: 'kr',
  EUR: '€',
};

/**
 * The one place a price becomes a string. Kroner currencies read "600 kr",
 * the rest "£42" / "$54" / "€60". PrintCard used to carry a private formatter that
 * wrote "kr600", so category, collection, artist and article cards disagreed
 * with the prints grid, the product page and the cart, which all format via
 * the language context. Both now call this.
 */
export function formatDisplayPrice(price: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  // Whole amounts stay whole (£56); anything else shows both decimals, so a
  // sale price reads £44.80, never £44.8.
  const amount = Number.isInteger(price) ? String(price) : price.toFixed(2);
  if (currency === 'NOK' || currency === 'DKK' || currency === 'SEK') {
    return `${amount} ${symbol}`;
  }
  return `${symbol}${amount}`;
}

/** The countries with their own euro prices (config/eur-countries.ts). */
export const EURO_PRICE_COUNTRIES = Object.keys(EUR_COUNTRY_PRICES);

/**
 * A figure worked out on the server for each country with its own euro
 * prices, so a page rendered once can still show a German visitor the German
 * "from" price. `of(country)` is the euro amount for that country.
 */
export function euroByCountry(of: (country: string) => number): Record<string, number> {
  return Object.fromEntries(EURO_PRICE_COUNTRIES.map(country => [country, of(country)]));
}

/** The amount to show: the country's own euro figure where there is one. */
export function amountIn(
  prices: CurrencyPrices,
  currency: Currency,
  country?: string,
  byCountry?: Record<string, number>
): number {
  if (currency === 'EUR' && country && byCountry?.[country] !== undefined) return byCountry[country];
  return prices[currency];
}
