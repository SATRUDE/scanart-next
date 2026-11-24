import { describe, it, expect } from 'vitest';
import { EUR_COUNTRY_PRICES } from '@/config/eur-countries';
import { priceCategories } from '@/config/priceCategories';
import { FRAME_SIZES, getFramePrice } from '@/config/frame';
import { getProductPrice, getLowestProductPrices } from '@/lib/pricing';
import { paysInEuro } from '@/lib/euro';

// Per-country euro prices (T-0573, Mark 24 Nov 2026: "country by country is
// a bit better for the main European countries"). Each market is checked
// against its OWN VAT, its own live Gelato quote in EUR (print + cheapest
// delivery, 24 Nov 2026) and the delivery the shop charges there:
// [rolled cost, framed cost, rolled delivery charged, framed delivery charged].
// Same rule as lib/eur-margin.test.ts. If Gelato moves, re-quote and update
// these with the prices.
const COSTS: Record<string, { vat: number; sizes: Record<string, [number, number, number, number]> }> = {
  DE: { vat: 0.19, sizes: { A3: [15.38, 30.05, 8, 8], A2: [17.98, 45.3, 9, 12], '40x50cm': [17.38, 44.78, 10, 13], '40x60cm': [17.68, 44.7, 10, 13], '45x60cm': [18.28, 47.05, 10, 13], '50x50cm': [18.08, 48.21, 9, 12], '50x70cm': [18.48, 55.96, 9, 13], A1: [22.38, 67.89, 10, 13] } },
  NL: { vat: 0.21, sizes: { A3: [20.84, 34.75, 6, 9], A2: [23.36, 58.34, 6, 20], '40x50cm': [23.36, 56.67, 7, 24], '40x60cm': [23.36, 57.43, 7, 24], '45x60cm': [23.36, 63.36, 7, 24], '50x50cm': [24.37, 62.03, 7, 20], '50x70cm': [25.37, 75.41, 7, 24], A1: [27.03, 86.99, 6, 24] } },
  FR: { vat: 0.2, sizes: { A3: [18.59, 33.3, 9, 8], A2: [21.86, 57.96, 11, 20], '40x50cm': [21.4, 55.11, 11, 23], '40x60cm': [21.75, 58.3, 11, 23], '45x60cm': [21.75, 61.62, 11, 23], '50x50cm': [22.21, 60.32, 11, 20], '50x70cm': [22.89, 72.68, 11, 23], A1: [25.54, 83.96, 11, 23] } },
  IE: { vat: 0.23, sizes: { A3: [19.16, 37.76, 5, 9], A2: [21.68, 62.77, 5, 20], '40x50cm': [22.5, 63.04, 7, 27], '40x60cm': [21.68, 61.76, 7, 27], '45x60cm': [21.68, 70.47, 7, 27], '50x50cm': [23.51, 68.99, 7, 23], '50x70cm': [24.51, 83.79, 7, 27], A1: [25.9, 94.19, 6, 24] } },
  ES: { vat: 0.21, sizes: { A3: [22.46, 28.04, 8, 8], A2: [24.7, 47.52, 8, 18], '40x50cm': [23.7, 46.21, 10, 21], '40x60cm': [24.36, 46.8, 10, 21], '45x60cm': [25.4, 51.49, 10, 21], '50x50cm': [25.05, 50.43, 8, 18], '50x70cm': [25.76, 61.29, 8, 21], A1: [28.39, 70.43, 10, 21] } },
  IT: { vat: 0.22, sizes: { A3: [21.21, 37.59, 8, 8], A2: [25.52, 61.57, 8, 18], '40x50cm': [24.42, 59.69, 10, 21], '40x60cm': [25.52, 60.54, 10, 21], '45x60cm': [25.52, 67.31, 10, 21], '50x50cm': [25.52, 65.78, 8, 18], '50x70cm': [26.61, 80.03, 8, 21], A1: [32.29, 93.26, 10, 21] } },
  BE: { vat: 0.21, sizes: { A3: [19.56, 37.76, 6, 9], A2: [21.85, 62.77, 6, 20], '40x50cm': [21.94, 60.92, 7, 24], '40x60cm': [21.85, 61.76, 7, 24], '45x60cm': [21.85, 68.35, 7, 24], '50x50cm': [22.86, 66.87, 7, 20], '50x70cm': [23.77, 81.32, 7, 24], A1: [25.24, 94.19, 6, 24] } },
  AT: { vat: 0.2, sizes: { A3: [20.84, 37.76, 6, 9], A2: [23.36, 62.77, 6, 20], '40x50cm': [23.36, 60.92, 7, 24], '40x60cm': [23.36, 61.76, 7, 24], '45x60cm': [23.36, 68.35, 7, 24], '50x50cm': [24.37, 66.87, 7, 20], '50x70cm': [25.37, 81.32, 7, 24], A1: [27.03, 94.19, 6, 24] } },
  FI: { vat: 0.255, sizes: { A3: [21.72, 37.76, 6, 9], A2: [24.24, 62.77, 6, 20], '40x50cm': [24.37, 60.92, 7, 24], '40x60cm': [24.24, 61.76, 7, 24], '45x60cm': [24.24, 68.35, 7, 24], '50x50cm': [25.38, 66.87, 7, 20], '50x70cm': [26.38, 81.32, 7, 24], A1: [27.98, 94.19, 6, 24] } },
};

const EUR_PER_GBP = 1 / 0.85483;
const MIN_FULL = 10 * EUR_PER_GBP;
const MIN_OFF = 5 * EUR_PER_GBP;

function keep(country: string, size: string, print: number, frame: number, off: boolean) {
  const { vat, sizes } = COSTS[country];
  const [rolled, framed, rolledDelivery, framedDelivery] = sizes[size];
  const isFramed = frame > 0;
  const printPaid = off && !isFramed ? Math.round(print * 0.8 * 100) / 100 : print;
  const paid = printPaid + frame + (isFramed ? framedDelivery : rolledDelivery);
  const exVat = paid / (1 + vat);
  const artist = 0.6 * Math.max(0, (printPaid + rolledDelivery) / (1 + vat) - rolled);
  const fee = paid * 0.045 + 0.15 * EUR_PER_GBP;
  const k = exVat - (isFramed ? framed : rolled) - artist - fee;
  return { keep: k, share: k / exVat };
}

describe('per-country euro prices', () => {
  it('covers the main markets, all of them priced in euro', () => {
    expect(Object.keys(EUR_COUNTRY_PRICES).sort()).toEqual(['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'IE', 'IT', 'NL']);
    for (const country of Object.keys(EUR_COUNTRY_PRICES)) expect(paysInEuro(country)).toBe(true);
  });

  for (const [country, own] of Object.entries(EUR_COUNTRY_PRICES)) {
    describe(country, () => {
      for (const [list, sizes] of Object.entries(own.prints)) {
        for (const [size, price] of Object.entries(sizes)) {
          it(`${list} ${size}: round, never above the EUR list, keeps the rule rolled, with NORDIC20 and framed`, () => {
            expect(price % 5).toBe(0);
            expect(price).toBeLessThanOrEqual(priceCategories[list][size].EUR);
            const full = keep(country, size, price, 0, false);
            expect(full.keep).toBeGreaterThanOrEqual(MIN_FULL);
            expect(full.share).toBeGreaterThanOrEqual(0.2);
            expect(keep(country, size, price, 0, true).keep).toBeGreaterThanOrEqual(MIN_OFF);
            const framed = keep(country, size, price, getFramePrice('wood', size, 'EUR', country), false);
            expect(framed.keep).toBeGreaterThanOrEqual(MIN_FULL);
            expect(framed.share).toBeGreaterThanOrEqual(0.2);
          });
        }
      }
      it('frames every size in round euros, on the ladder', () => {
        let previous = 0;
        for (const size of FRAME_SIZES) {
          const price = getFramePrice('wood', size, 'EUR', country);
          expect(price % 5).toBe(0);
          expect(price).toBeGreaterThanOrEqual(previous);
          previous = price;
        }
      });
      it('has a price for every list and size the shop sells in euro', () => {
        for (const list of ['Entry', 'Budget', 'Premium']) {
          for (const size of Object.keys(priceCategories[list])) expect(own.prints[list]?.[size], `${list} ${size}`).toBeDefined();
        }
      });
    });
  }
});

describe('which euro price applies', () => {
  const print = { priceCategory: 'Premium', prices: { '50x70cm': priceCategories.Premium['50x70cm'], A3: priceCategories.Premium.A3 } };

  it('a main market gets its own price, euro only', () => {
    expect(getProductPrice(print, '50x70cm', 'EUR', 'DE')).toBe(EUR_COUNTRY_PRICES.DE.prints.Premium['50x70cm']);
    expect(getProductPrice(print, '50x70cm', 'GBP', 'DE')).toBe(priceCategories.Premium['50x70cm'].GBP);
    expect(getFramePrice('wood', '50x70cm', 'EUR', 'DE')).toBe(EUR_COUNTRY_PRICES.DE.frames['50x70cm']);
    expect(getFramePrice('no-frame', '50x70cm', 'EUR', 'DE')).toBe(0);
  });

  it('every other country, or none, gets the EUR list', () => {
    for (const country of ['HU', 'PL', 'GB', undefined]) {
      expect(getProductPrice(print, '50x70cm', 'EUR', country)).toBe(priceCategories.Premium['50x70cm'].EUR);
    }
    expect(getFramePrice('wood', '50x70cm', 'EUR', 'HU')).toBe(getFramePrice('wood', '50x70cm', 'EUR'));
  });

  it('a print with no price list (an old basket) falls back to the EUR list', () => {
    const old = { prices: print.prices };
    expect(getProductPrice(old, '50x70cm', 'EUR', 'DE')).toBe(priceCategories.Premium['50x70cm'].EUR);
  });

  it('the "from" price follows the country', () => {
    const de = EUR_COUNTRY_PRICES.DE.prints.Premium;
    expect(getLowestProductPrices(print, 'DE').EUR).toBe(Math.min(de['50x70cm'], de.A3));
    expect(getLowestProductPrices(print).EUR).toBe(Math.min(priceCategories.Premium['50x70cm'].EUR, priceCategories.Premium.A3.EUR));
  });
});
