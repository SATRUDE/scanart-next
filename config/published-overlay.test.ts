import { describe, it, expect } from 'vitest';
import { overlayPrices } from './published-overlay';

const compiled = { GBP: 50, USD: 65, NOK: 750, DKK: 475, SEK: 700, EUR: 90 };

describe('overlayPrices', () => {
  it('takes every published currency, euro included', () => {
    const published = { GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800, EUR: 95 };
    expect(overlayPrices(compiled, published)).toEqual(published);
  });

  it('keeps the compiled euro under a file published before euro existed', () => {
    const old = { GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800 } as never;
    expect(overlayPrices(compiled, old)).toEqual({ GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800, EUR: 90 });
  });

  it('refuses a row with no euro anywhere rather than sell for nothing', () => {
    const old = { GBP: 56, USD: 72, NOK: 800, DKK: 500, SEK: 800 } as never;
    expect(overlayPrices(undefined, old)).toBeUndefined();
  });

  it('refuses an incomplete or zero row', () => {
    expect(overlayPrices(compiled, undefined)).toBeUndefined();
    expect(overlayPrices(compiled, { GBP: 0, USD: 72, NOK: 800, DKK: 500, SEK: 800, EUR: 95 })).toBeUndefined();
  });
});
