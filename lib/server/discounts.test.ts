import { describe, it, expect } from 'vitest';
import { normaliseCode, selectValidDiscount } from './discounts';

// The two ways a code can be dead, switched off and expired, are the whole
// point of moving codes into a store, so both get tests.

const NOW = new Date('2026-08-12T06:00:00.000Z');

const live = { code: 'SUMMER10', percentage: 10, active: true, expiresAt: null };

describe('normaliseCode', () => {
  it('upper-cases and trims, because buyers type neither carefully', () => {
    expect(normaliseCode('  summer10 ')).toBe('SUMMER10');
  });

  it('rejects empty and absurdly long input rather than querying with it', () => {
    expect(normaliseCode('')).toBeNull();
    expect(normaliseCode('   ')).toBeNull();
    expect(normaliseCode('X'.repeat(41))).toBeNull();
  });
});

describe('selectValidDiscount', () => {
  it('accepts a live code', () => {
    expect(selectValidDiscount(live, NOW)).toEqual({ code: 'SUMMER10', percentage: 10 });
  });

  it('refuses a code that is switched off', () => {
    expect(selectValidDiscount({ ...live, active: false }, NOW)).toBeNull();
  });

  it('refuses an expired code', () => {
    expect(selectValidDiscount({ ...live, expiresAt: '2026-08-11T23:59:00.000Z' }, NOW)).toBeNull();
  });

  it('accepts a code that expires later today', () => {
    expect(selectValidDiscount({ ...live, expiresAt: '2026-08-12T23:59:00.000Z' }, NOW)).not.toBeNull();
  });

  it('treats the expiry moment itself as expired', () => {
    expect(selectValidDiscount({ ...live, expiresAt: NOW.toISOString() }, NOW)).toBeNull();
  });

  it('accepts a Date as well as a string, since drivers differ', () => {
    expect(selectValidDiscount({ ...live, expiresAt: new Date('2026-09-01') }, NOW)).not.toBeNull();
  });

  it('refuses a nonsense percentage rather than charging a strange amount', () => {
    expect(selectValidDiscount({ ...live, percentage: 0 }, NOW)).toBeNull();
    expect(selectValidDiscount({ ...live, percentage: 150 }, NOW)).toBeNull();
    expect(selectValidDiscount({ ...live, percentage: Number.NaN }, NOW)).toBeNull();
  });

  it('gives no discount when the code is not in the store at all', () => {
    expect(selectValidDiscount(undefined, NOW)).toBeNull();
    expect(selectValidDiscount(null, NOW)).toBeNull();
  });
});
