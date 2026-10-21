import { describe, it, expect } from 'vitest';
import {
  EU_COUNTRIES,
  FREE_DELIVERY_COUNTRIES,
  FREE_DELIVERY_THRESHOLD,
  amountToFreeDelivery,
  formatFreeDeliveryAmount,
  freeDeliveryProgress,
  freeDeliveryVerdict,
  isFramed,
  qualifiesForFreeDelivery,
} from './free-delivery';
import { isDeliverable } from '@/lib/address';
import type { Currency } from '@/lib/pricing';

const CURRENCIES: Currency[] = ['GBP', 'NOK', 'USD', 'DKK', 'SEK'];
const basket = (goods: number, currency: Currency = 'GBP', country = 'GB', hasFramed = false) =>
  ({ goods, currency, country, hasFramed });

describe('free delivery thresholds', () => {
  it('are the agreed numbers, one per currency the shop sells in', () => {
    expect(FREE_DELIVERY_THRESHOLD).toEqual({ GBP: 100, USD: 135, SEK: 1350, DKK: 900, NOK: 1500 });
  });

  it('never ask a foreign buyer for less than 100 pounds, at the rates they were set and re-checked on', () => {
    const rates = {
      '2026-10-02': { GBP: 1, USD: 1.3201, SEK: 13.2772, DKK: 8.7891, NOK: 12.738 },
      '2026-10-20': { GBP: 1, USD: 1.3347, SEK: 13.2373, DKK: 8.8954, NOK: 12.525 },
    };
    for (const [day, perGbp] of Object.entries(rates)) {
      for (const c of CURRENCIES) {
        expect(FREE_DELIVERY_THRESHOLD[c] / perGbp[c], `${c} ${day}`).toBeGreaterThanOrEqual(100);
      }
    }
  });

  for (const currency of CURRENCIES) {
    const t = FREE_DELIVERY_THRESHOLD[currency];
    describe(currency, () => {
      it('qualifies exactly at the threshold ("or more")', () => {
        expect(qualifiesForFreeDelivery(basket(t, currency))).toBe(true);
        expect(amountToFreeDelivery(t, currency)).toBe(0);
      });
      it('qualifies above it', () => {
        expect(qualifiesForFreeDelivery(basket(t + 0.01, currency))).toBe(true);
        expect(qualifiesForFreeDelivery(basket(t * 3, currency))).toBe(true);
      });
      it('does not qualify one penny under', () => {
        expect(qualifiesForFreeDelivery(basket(t - 0.01, currency))).toBe(false);
        expect(amountToFreeDelivery(t - 0.01, currency)).toBe(0.01);
      });
      it('does not qualify an empty basket', () => {
        expect(qualifiesForFreeDelivery(basket(0, currency))).toBe(false);
      });
      it('reports progress from 0 to 1', () => {
        expect(freeDeliveryProgress(0, currency)).toBe(0);
        expect(freeDeliveryProgress(t / 2, currency)).toBe(0.5);
        expect(freeDeliveryProgress(t, currency)).toBe(1);
        expect(freeDeliveryProgress(t * 2, currency)).toBe(1);
      });
    });
  }

  it('treats floating point noise on the right side of the line', () => {
    // 0.1 + 0.2 style sums: 99.99999999999 is 100.00 to the penny.
    expect(qualifiesForFreeDelivery(basket(99.99999999999))).toBe(true);
    expect(qualifiesForFreeDelivery(basket(99.994))).toBe(false);
    expect(qualifiesForFreeDelivery(basket(99.99))).toBe(false);
  });
});

describe('who qualifies (Mark, 2026-10-21)', () => {
  it('covers the UK, Norway, the US and all 27 EU states, Sweden and Denmark included', () => {
    expect(EU_COUNTRIES).toHaveLength(27);
    expect(new Set(EU_COUNTRIES).size).toBe(27);
    for (const c of ['GB', 'NO', 'US', 'SE', 'DK', 'DE', 'FR', 'ES', 'IE', 'FI', 'PL', 'MT', 'CY']) {
      expect(qualifiesForFreeDelivery(basket(100, 'GBP', c)), c).toBe(true);
    }
    expect(FREE_DELIVERY_COUNTRIES.size).toBe(30);
  });

  it('every free-delivery country is one we actually deliver to', () => {
    for (const c of FREE_DELIVERY_COUNTRIES) expect(isDeliverable(c), c).toBe(true);
  });

  it('pays delivery everywhere else, the dear European non-EU destinations included', () => {
    for (const c of ['CH', 'IS', 'LI', 'AU', 'JP', 'CA', 'NZ', 'FO', 'GL', 'AX', 'RE', 'GI', 'JE', 'GG', 'IM', 'PR']) {
      expect(freeDeliveryVerdict(basket(1000, 'GBP', c)), c).toBe('destination');
    }
  });

  it('reads the country in any case', () => {
    expect(qualifiesForFreeDelivery(basket(100, 'GBP', 'gb'))).toBe(true);
  });

  it('never ships a framed print free, whatever the amount or destination', () => {
    for (const c of ['GB', 'NO', 'US', 'SE']) {
      expect(freeDeliveryVerdict(basket(10_000, 'GBP', c, true)), c).toBe('framed');
    }
  });

  it('gives the most decisive reason first: framed, then destination, then amount', () => {
    expect(freeDeliveryVerdict(basket(10, 'GBP', 'CH', true))).toBe('framed');
    expect(freeDeliveryVerdict(basket(10, 'GBP', 'CH'))).toBe('destination');
    expect(freeDeliveryVerdict(basket(10, 'GBP', 'GB'))).toBe('under');
    expect(freeDeliveryVerdict(basket(100, 'GBP', 'GB'))).toBe('free');
  });

  it('judges a basket with no destination yet on the amount and frames alone', () => {
    expect(freeDeliveryVerdict({ goods: 100, currency: 'GBP', country: null, hasFramed: false })).toBe('free');
    expect(freeDeliveryVerdict({ goods: 99, currency: 'GBP', country: null, hasFramed: false })).toBe('under');
    expect(freeDeliveryVerdict({ goods: 500, currency: 'GBP', country: null, hasFramed: true })).toBe('framed');
  });

  it('treats only the explicit no-frame option and no frame at all as unframed', () => {
    expect(isFramed(undefined)).toBe(false);
    expect(isFramed(null)).toBe(false);
    expect(isFramed('')).toBe(false);
    expect(isFramed('no-frame')).toBe(false);
    for (const f of ['wood', 'black', 'white', 'oak-someday']) expect(isFramed(f), f).toBe(true);
  });
});

describe('formatFreeDeliveryAmount', () => {
  it('writes the amount away rounded UP to whole units', () => {
    expect(formatFreeDeliveryAmount(33, 'GBP')).toBe('£33');
    expect(formatFreeDeliveryAmount(32.01, 'GBP')).toBe('£33');
    expect(formatFreeDeliveryAmount(0.01, 'USD')).toBe('$1');
  });
  it('groups kroner thousands with a space, as the sketches do', () => {
    expect(formatFreeDeliveryAmount(1020, 'NOK')).toBe('1 020 kr');
    expect(formatFreeDeliveryAmount(1500, 'NOK')).toBe('1 500 kr');
    expect(formatFreeDeliveryAmount(900, 'DKK')).toBe('900 kr');
    expect(formatFreeDeliveryAmount(1350, 'SEK')).toBe('1 350 kr');
  });
});
