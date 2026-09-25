import { getLowestProductPrices, type CurrencyPrices, type PricedProduct } from '@/lib/pricing';

/**
 * '50x70cm' → '50 × 70 cm'. The same rule as sizeLabel in PrintCard, repeated
 * here because PrintCard is a client module and a server component cannot
 * call a function exported from one.
 */
export function sizeLabel(size: string): string {
  const m = size.match(/^(\d+)x(\d+)cm$/i);
  return m ? `${m[1]} × ${m[2]} cm` : size;
}

const SIZE_ORDER: Record<string, number> = {
  A5: 1, A4: 2, A3: 3, '50x50cm': 4, A2: 5, '50x70cm': 6, A1: 7, A0: 8,
};

/**
 * The artist fact rows on the product page ("Sizes: 50 × 50, 50 × 70 cm",
 * "In the shop: 5 prints, from £35"), counted from the catalogue rather than
 * written, so they stay true as prints are added.
 */
export function artistFactsFor(
  products: (PricedProduct & { sizes?: Record<string, boolean> })[]
): { sizes: string[]; count: number; lowestPrices: CurrencyPrices } | undefined {
  if (products.length === 0) return undefined;
  const sizes = [...new Set(products.flatMap(p => Object.entries(p.sizes ?? {}).filter(([, ok]) => ok).map(([s]) => s)))]
    .sort((a, b) => (SIZE_ORDER[a] ?? 99) - (SIZE_ORDER[b] ?? 99));
  const lows = products.map(p => getLowestProductPrices(p));
  const lowestPrices = (Object.keys(lows[0]) as (keyof CurrencyPrices)[]).reduce(
    (acc, c) => ({ ...acc, [c]: Math.min(...lows.map(l => l[c])) }),
    {} as CurrencyPrices
  );
  // "50 × 50, 50 × 70 cm": the unit once, at the end, as in the design.
  const labels = sizes.map(sizeLabel);
  const joined = labels.every(l => l.endsWith(' cm')) && labels.length > 1
    ? [...labels.slice(0, -1).map(l => l.replace(/ cm$/, '')), labels[labels.length - 1]]
    : labels;
  return { sizes: joined, count: products.length, lowestPrices };
}
