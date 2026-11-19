import { describe, expect, it } from 'vitest';
import { isSaleOn } from './sale-promotion';
import type { Discount } from './discounts';

const nordic20: Discount = { code: 'NORDIC20', percentage: 20, scope: 'UNFRAMED' };

describe('the sale, as the server sees it', () => {
  it('is on only for the exact offer the page advertises', async () => {
    expect(await isSaleOn(async () => nordic20)).toBe(true);
    for (const change of [{ percentage: 15 }, { scope: 'ALL' as const }, { code: 'OTHER20' }]) {
      expect(await isSaleOn(async () => ({ ...nordic20, ...change }))).toBe(false);
    }
  });

  it('is off when the store has no live code (switched off, expired or unreachable)', async () => {
    expect(await isSaleOn(async () => null)).toBe(false);
  });

  it('asks the store about NORDIC20', async () => {
    let asked = '';
    await isSaleOn(async code => { asked = code; return null; });
    expect(asked).toBe('NORDIC20');
  });
});
