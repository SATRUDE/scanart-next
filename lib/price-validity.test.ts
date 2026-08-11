import { describe, expect, it } from 'vitest';

import { priceValidUntil } from './price-validity';

describe('priceValidUntil', () => {
  it('returns a plain ISO date, which is what schema.org expects', () => {
    expect(priceValidUntil(new Date('2026-08-11T03:37:00.000Z'))).toBe('2027-08-11');
  });

  it('stays a year ahead of a build late in the calendar year', () => {
    // The case the old `${year}-12-31` expression got wrong: a build on
    // 28 December used to claim three days of validity.
    expect(priceValidUntil(new Date('2026-12-28T00:00:00.000Z'))).toBe('2027-12-28');
  });

  it('is never in the past, whenever the build happens', () => {
    const builds = [
      '2026-01-01T00:00:00.000Z',
      '2026-06-15T12:00:00.000Z',
      '2026-12-31T23:59:59.000Z',
      '2027-02-28T00:00:00.000Z',
    ];
    for (const build of builds) {
      const from = new Date(build);
      expect(new Date(priceValidUntil(from)).getTime()).toBeGreaterThan(from.getTime());
    }
  });

  it('handles a leap day without producing an invalid date', () => {
    const result = priceValidUntil(new Date('2028-02-29T00:00:00.000Z'));
    expect(result).toBe('2029-03-01');
    expect(Number.isFinite(new Date(result).getTime())).toBe(true);
  });

  it('defaults to measuring from now', () => {
    const before = Date.now();
    const result = priceValidUntil();
    expect(new Date(result).getTime()).toBeGreaterThan(before);
  });
});
