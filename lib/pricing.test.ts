import { describe, it, expect } from 'vitest';
import { formatDisplayPrice } from './pricing';

// One formatter for every surface: kroner suffix with a space, symbol
// prefix otherwise. PrintCard's private "kr600" formatter is gone.
describe('formatDisplayPrice', () => {
  it('writes kroner currencies as number then symbol', () => {
    expect(formatDisplayPrice(600, 'NOK')).toBe('600 kr');
    expect(formatDisplayPrice(367, 'DKK')).toBe('367 kr');
    expect(formatDisplayPrice(577, 'SEK')).toBe('577 kr');
  });
  it('writes sterling and dollars symbol-first', () => {
    expect(formatDisplayPrice(42, 'GBP')).toBe('£42');
    expect(formatDisplayPrice(54, 'USD')).toBe('$54');
  });
});
