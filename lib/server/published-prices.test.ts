import { describe, it, expect } from 'vitest';
import { isUsable } from '@/config/generated-prices';
import { priceCategories } from '@/config/priceCategories';
import { getFramePrice } from '@/config/frame';

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
  // Nothing is retired today, so this pins the behaviour rather than the
  // data: every list the shop compiles is still offered.
  it('offers all four compiled lists while nothing is retired', () => {
    expect(Object.keys(priceCategories).sort()).toEqual(
      ['Budget', 'Luxary', 'Premium', 'Standard'],
    );
  });
});
