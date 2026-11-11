import { describe, expect, it } from 'vitest';
import { isSalePromotionActive } from './sale-promotion';

const active = { valid: true, code: 'NORDIC20', percentage: 20, scope: 'UNFRAMED' };

describe('public sale eligibility', () => {
  it('shows only the exact live offer that the announcement promises', () => {
    expect(isSalePromotionActive(active)).toBe(true);
    for (const change of [
      { valid: false }, { code: 'OTHER20' }, { percentage: 15 },
      { percentage: '20' }, { scope: 'ALL' }, { scope: null },
    ]) expect(isSalePromotionActive({ ...active, ...change })).toBe(false);
  });

  it('hides the promotion when validation fails or gives an unusable response', () => {
    for (const response of [null, undefined, {}, 'error', true, { error: 'unavailable' }]) {
      expect(isSalePromotionActive(response)).toBe(false);
    }
  });
});

describe('sale price', () => {
  it('takes 20% off and rounds to pence as the server does', async () => {
    const { salePrice, saleDiscount, salePrices } = await import('./sale-promotion');
    expect(salePrice(56)).toBe(44.8);
    expect(saleDiscount(56)).toBe(11.2);
    expect(salePrice(39.99)).toBe(31.99);
    expect(saleDiscount(39.99) + salePrice(39.99)).toBeCloseTo(39.99, 10);
    expect(salePrices({ GBP: 56, NOK: 750 })).toEqual({ GBP: 44.8, NOK: 600 });
  });
});
