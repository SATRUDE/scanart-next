import { getLowestProductPrices, type CurrencyPrices, type PricedProduct } from '@/lib/pricing';

/**
 * The lowest price in each currency across a set of prints, for the page
 * header's "from £35". Computed on the server from the catalogue's own prices
 * (lib/pricing.ts), never written into copy, so it cannot drift from the tiles.
 */
export function lowestPrices(products: PricedProduct[]): CurrencyPrices {
  const all = products.map(p => getLowestProductPrices(p));
  const out: CurrencyPrices = { ...(all[0] ?? { GBP: 0, NOK: 0, USD: 0, DKK: 0, SEK: 0 }) };
  for (const prices of all.slice(1)) {
    for (const cur of Object.keys(out) as (keyof CurrencyPrices)[]) {
      if (prices[cur] > 0 && (!(out[cur] > 0) || prices[cur] < out[cur])) out[cur] = prices[cur];
    }
  }
  return out;
}
