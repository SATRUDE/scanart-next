import { describe, it, expect } from 'vitest';
import {
  FREE_DELIVERY_THRESHOLD,
  amountToFreeDelivery,
  formatFreeDeliveryAmount,
  freeDeliveryProgress,
  qualifiesForFreeDelivery,
} from './free-delivery';
import type { Currency } from '@/lib/pricing';

const CURRENCIES: Currency[] = ['GBP', 'NOK', 'USD', 'DKK', 'SEK'];

describe('free delivery thresholds', () => {
  it('are the agreed numbers, one per currency the shop sells in', () => {
    expect(FREE_DELIVERY_THRESHOLD).toEqual({ GBP: 100, USD: 135, SEK: 1350, DKK: 900, NOK: 1500 });
  });

  it('never ask a foreign buyer for less than 100 pounds, at the 2026-10-02 rates', () => {
    const perGbp = { GBP: 1, USD: 1.3201, SEK: 13.2772, DKK: 8.7891, NOK: 12.738 };
    for (const c of CURRENCIES) {
      expect(FREE_DELIVERY_THRESHOLD[c] / perGbp[c], c).toBeGreaterThanOrEqual(100);
    }
  });

  for (const currency of CURRENCIES) {
    const t = FREE_DELIVERY_THRESHOLD[currency];
    describe(currency, () => {
      it('qualifies exactly at the threshold ("or more")', () => {
        expect(qualifiesForFreeDelivery(t, currency)).toBe(true);
        expect(amountToFreeDelivery(t, currency)).toBe(0);
      });
      it('qualifies above it', () => {
        expect(qualifiesForFreeDelivery(t + 0.01, currency)).toBe(true);
        expect(qualifiesForFreeDelivery(t * 3, currency)).toBe(true);
      });
      it('does not qualify one penny under', () => {
        expect(qualifiesForFreeDelivery(t - 0.01, currency)).toBe(false);
        expect(amountToFreeDelivery(t - 0.01, currency)).toBe(0.01);
      });
      it('does not qualify an empty basket', () => {
        expect(qualifiesForFreeDelivery(0, currency)).toBe(false);
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
    expect(qualifiesForFreeDelivery(99.99999999999, 'GBP')).toBe(true);
    expect(qualifiesForFreeDelivery(99.994, 'GBP')).toBe(false);
    expect(qualifiesForFreeDelivery(99.99, 'GBP')).toBe(false);
  });
});

describe('formatFreeDeliveryAmount', () => {
  it('writes the amount away rounded UP to whole units', () => {
    expect(formatFreeDeliveryAmount(33, 'GBP')).toBe('£33');
    expect(formatFreeDeliveryAmount(32.01, 'GBP')).toBe('£33');
    expect(formatFreeDeliveryAmount(0.01, 'USD')).toBe('$1');
  });
  it('groups kroner thousands with a non-breaking space, as the sketches do', () => {
    expect(formatFreeDeliveryAmount(1020, 'NOK')).toBe('1 020 kr');
    expect(formatFreeDeliveryAmount(1500, 'NOK')).toBe('1 500 kr');
    expect(formatFreeDeliveryAmount(900, 'DKK')).toBe('900 kr');
    expect(formatFreeDeliveryAmount(1350, 'SEK')).toBe('1 350 kr');
  });
});
