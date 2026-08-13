import { describe, it, expect } from 'vitest';
import { isUsable } from '@/config/generated-prices';
import { priceCategories, offeredPriceCategories } from '@/config/priceCategories';
import { getFramePrice } from '@/config/frame';
import { getAllProducts } from '@/lib/products';
import { getProductPrice } from '@/lib/pricing';

// This file is written over the network by a button on another site. The
// merge has to be the thing that refuses bad input, because nothing upstream
// of it is under this repo's control.
describe('published prices', () => {
  it('refuses anything incomplete, zero or not a number', () => {
    expect(isUsable(undefined)).toBe(false);
    expect(isUsable({ GBP: 10, USD: 12, NOK: 140, DKK: 90 } as never)).toBe(false);
    expect(isUsable({ GBP: 10, USD: 12, NOK: 140, DKK: 90, SEK: 0 })).toBe(false);
    expect(isUsable({ GBP: 10, USD: 12, NOK: 140, DKK: 90, SEK: -5 })).toBe(false);
    expect(isUsable({ GBP: 10, USD: 12, NOK: 140, DKK: 90, SEK: NaN })).toBe(false);
    expect(isUsable({ GBP: '10' } as never)).toBe(false);
  });

  it('accepts a complete set', () => {
    expect(isUsable({ GBP: 42, USD: 54, NOK: 577, DKK: 367, SEK: 577 })).toBe(true);
  });

  // With nothing published, every price must still be the compiled one. This
  // is what makes an empty or deleted generated file safe.
  it('leaves the compiled prices alone when nothing is published', () => {
    expect(priceCategories.Premium.A3.GBP).toBe(42);
    expect(priceCategories.Premium['50x50cm'].GBP).toBe(42);
    expect(priceCategories.Budget['50x70cm'].GBP).toBe(45);
    expect(getFramePrice('wood', 'A1', 'GBP')).toBe(55);
    expect(getFramePrice('no-frame', 'A1', 'GBP')).toBe(0);
  });

  it('never sells a print for nothing', () => {
    for (const [category, sizes] of Object.entries(priceCategories)) {
      for (const [size, prices] of Object.entries(sizes)) {
        for (const [currency, value] of Object.entries(prices)) {
          expect(value, `${category} ${size} ${currency}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('retiring a price list', () => {
  it('removes a list nothing is using', () => {
    const { offered, removed, refused } = offeredPriceCategories(['Premium'], ['Luxary']);
    expect(Object.keys(offered)).not.toContain('Luxary');
    expect(removed).toEqual(['Luxary']);
    expect(refused).toEqual([]);
  });

  // The case that matters. socialagent cannot see the catalogue, so its own
  // guard against this cannot fire; on 2026-08-12 it retired Standard while
  // dragon was still on it.
  it('refuses to retire a list a published print still sits on', () => {
    const { offered, removed, refused } = offeredPriceCategories(['Premium', 'Standard'], ['Standard']);
    expect(Object.keys(offered)).toContain('Standard');
    expect(offered.Standard['50x70cm'].GBP).toBe(56);
    expect(removed).toEqual([]);
    expect(refused).toEqual(['Standard']);
  });

  it('ignores a retirement naming a list that was never offered', () => {
    const { removed, refused } = offeredPriceCategories(['Premium'], ['Nonexistent']);
    expect(removed).toEqual([]);
    expect(refused).toEqual([]);
  });

  it('leaves the lists alone when nothing is retired', () => {
    const { offered } = offeredPriceCategories(['Premium'], []);
    expect(Object.keys(offered).sort()).toEqual(Object.keys(priceCategories).sort());
  });
});

// The guard above is only worth anything if the thing it protects is checked
// against the real catalogue, so this reads products.json exactly as the site
// does. A print with no price renders at zero AND makes computeOrderAmount
// throw for the whole basket it is in, so this is a checkout test wearing a
// pricing test's clothes.
describe('every published print has a price', () => {
  it('prices every available size of every print, in all five currencies', async () => {
    const products = await getAllProducts();
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      const sizes = Object.keys(product.sizes ?? {});
      expect(sizes.length, `${product.slug} offers no sizes`).toBeGreaterThan(0);
      for (const size of sizes) {
        for (const currency of ['GBP', 'USD', 'NOK', 'DKK', 'SEK'] as const) {
          expect(
            getProductPrice(product, size, currency),
            `${product.slug} ${size} ${currency}`
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});
