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
