import { describe, it, expect } from 'vitest';
import { priceCategories } from '@/config/priceCategories';
import { FRAME_SIZES, getFramePrice } from '@/config/frame';
import { EURO_COUNTRIES, marketFor, paysInEuro } from '@/lib/euro';

// Mark's margin rule (24 Nov 2026, T-0573) for the euro list. Every
// single-print order keeps at least GBP 10 (EUR 11.70) and 20% of the price ex
// VAT at full price, and GBP 5 (EUR 5.85) with NORDIC20 (20% off unframed
// prints), after Gelato's cost ex VAT, the artist's 60% of what the unframed
// sale leaves after printing and delivery (worked out ex VAT), card fees
// (4.5% + GBP 0.15) and VAT.
//
// The costs are the binding case among the 25 euro countries from live Gelato
// quotes in EUR on 24 Nov 2026: the dearest print plus delivery quote for each
// size and frame, the cheapest delivery the shop charges in any of them, and
// the highest VAT (Hungary, 27%). If Gelato's prices move, re-quote and update
// these with the prices, not the other way round.
const VAT = 0.27;
const EUR_PER_GBP = 1 / 0.85483;
const MIN_FULL = 10 * EUR_PER_GBP;
const MIN_OFF = 5 * EUR_PER_GBP;
const fee = (paid: number) => paid * 0.045 + 0.15 * EUR_PER_GBP;

const COSTS: Record<string, { rolled: number; framed: number; rolledDelivery: number; framedDelivery: number }> = {
  A3: { rolled: 22.46, framed: 37.76, rolledDelivery: 5, framedDelivery: 8 },
  A2: { rolled: 25.52, framed: 62.77, rolledDelivery: 5, framedDelivery: 12 },
  '40x50cm': { rolled: 24.42, framed: 63.04, rolledDelivery: 7, framedDelivery: 13 },
  '40x60cm': { rolled: 25.52, framed: 61.76, rolledDelivery: 7, framedDelivery: 13 },
  '45x60cm': { rolled: 25.52, framed: 70.47, rolledDelivery: 7, framedDelivery: 13 },
  '50x50cm': { rolled: 25.52, framed: 68.99, rolledDelivery: 7, framedDelivery: 12 },
  '50x70cm': { rolled: 26.61, framed: 83.79, rolledDelivery: 7, framedDelivery: 13 },
  A1: { rolled: 32.29, framed: 94.19, rolledDelivery: 6, framedDelivery: 13 },
};

function keep(size: string, print: number, frame: number, off: boolean) {
  const c = COSTS[size];
  const framed = frame > 0;
  const printPaid = off && !framed ? Math.round(print * 0.8 * 100) / 100 : print;
  const paid = printPaid + frame + (framed ? c.framedDelivery : c.rolledDelivery);
  const exVat = paid / (1 + VAT);
  const artist = 0.6 * Math.max(0, (printPaid + c.rolledDelivery) / (1 + VAT) - c.rolled);
  const k = exVat - (framed ? c.framed : c.rolled) - artist - fee(paid);
  return { keep: k, share: k / exVat };
}

const SOLD = ['Entry', 'Budget', 'Premium'];

describe('the euro price list', () => {
  it('is for every EU member but Denmark and Sweden', () => {
    expect(EURO_COUNTRIES).toHaveLength(25);
    expect(paysInEuro('DE')).toBe(true);
    expect(paysInEuro('fi')).toBe(true);
    expect(paysInEuro('HU')).toBe(true);
    for (const own of ['DK', 'SE', 'GB', 'NO', 'US', 'CH', '']) expect(paysInEuro(own)).toBe(false);
  });

  it('starts each visitor on the right list', () => {
    expect(marketFor('DE')).toBe('EU');
    expect(marketFor('NL')).toBe('EU');
    for (const own of ['GB', 'NO', 'US', 'DK', 'SE']) expect(marketFor(own)).toBe(own);
    expect(marketFor('CH')).toBe('GB');
    expect(marketFor('JP')).toBe('GB');
  });

  for (const list of SOLD) {
    for (const [size, prices] of Object.entries(priceCategories[list])) {
      describe(`${list} ${size}`, () => {
        it('is a round number of euros', () => {
          expect(prices.EUR % 5).toBe(0);
        });
        it('keeps the rule unframed, at full price and with 20% off', () => {
          const full = keep(size, prices.EUR, 0, false);
          expect(full.keep).toBeGreaterThanOrEqual(MIN_FULL);
          expect(full.share).toBeGreaterThanOrEqual(0.2);
          expect(keep(size, prices.EUR, 0, true).keep).toBeGreaterThanOrEqual(MIN_OFF);
        });
        it('keeps the rule framed', () => {
          const framed = keep(size, prices.EUR, getFramePrice('wood', size, 'EUR'), false);
          expect(framed.keep).toBeGreaterThanOrEqual(MIN_FULL);
          expect(framed.share).toBeGreaterThanOrEqual(0.2);
        });
      });
    }
  }

  it('frames every size in round euros, never cheaper than the size before', () => {
    let previous = 0;
    for (const size of FRAME_SIZES) {
      const price = getFramePrice('wood', size, 'EUR');
      expect(price % 5).toBe(0);
      expect(price).toBeGreaterThanOrEqual(previous);
      previous = price;
    }
  });
});
