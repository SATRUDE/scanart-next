import { describe, it, expect } from 'vitest';
import { combineDelivery, roundUp, BUFFER } from './shipping-rates';

// The real Gelato figures for an A1 to Oslo, quoted 2026-08-12, in EUR:
// rolled 8.48 first and 0.70 for each after, framed 21.10 and 9.50.
const ROLLED = { first: 8.48, additional: 0.7, quantity: 1 };
const FRAMED = { first: 21.1, additional: 9.5, quantity: 1 };

describe('combineDelivery', () => {
  // Gelato charges first item + additional x (n-1), and the two are nothing
  // alike: a second rolled print adds a twelfth of the first, a second framed
  // one nearly half. Summing would overcharge a multi-buy badly; taking the
  // dearest alone would undercharge a pair of framed prints just as badly.
  it('charges one first-item price and the rest at their additional rate', () => {
    expect(combineDelivery([{ ...ROLLED, quantity: 3 }])).toBe(9.88); // 8.48 + 0.70 + 0.70
    expect(combineDelivery([{ ...FRAMED, quantity: 2 }])).toBe(30.6); // 21.10 + 9.50
  });

  it('gives the first-item price to the DEAREST thing in the basket', () => {
    // A framed print and a rolled one: the frame pays full, the rolled one
    // pays its additional rate, not the other way round.
    expect(combineDelivery([ROLLED, FRAMED])).toBe(21.8); // 21.10 + 0.70
    expect(combineDelivery([FRAMED, ROLLED])).toBe(21.8);
  });

  it('is not fooled by the order the basket happens to be in', () => {
    const a = combineDelivery([ROLLED, ROLLED, FRAMED]);
    const b = combineDelivery([FRAMED, ROLLED, ROLLED]);
    expect(a).toBe(b);
  });

  it('charges full price again when no additional rate was swept', () => {
    // Erring high: an unknown marginal cost is not a reason to post cheaply.
    expect(combineDelivery([{ first: 10, additional: null, quantity: 2 }])).toBe(20);
  });

  it('handles a single item and an empty basket', () => {
    expect(combineDelivery([ROLLED])).toBe(8.48);
    expect(combineDelivery([])).toBe(0);
  });

  it('treats a nonsense quantity as one rather than none', () => {
    expect(combineDelivery([{ ...ROLLED, quantity: 0 }])).toBe(8.48);
    expect(combineDelivery([{ ...ROLLED, quantity: -3 }])).toBe(8.48);
  });
});

describe('roundUp', () => {
  // Always up, so rounding can never take the price below what it cost to
  // post. 21.10 EUR x 10.9705 x 1.08 is 250.05 kr, which is not a number
  // anyone would write on a delivery line.
  it('rounds the kroner currencies up to the nearest five', () => {
    expect(roundUp(250.05, 'NOK')).toBe(255);
    expect(roundUp(250.0, 'NOK')).toBe(250);
    expect(roundUp(101.2, 'SEK')).toBe(105);
    expect(roundUp(56.4, 'DKK')).toBe(60);
  });

  it('rounds sterling and dollars up to the nearest fifty', () => {
    expect(roundUp(6.72, 'GBP')).toBe(7);
    expect(roundUp(6.2, 'GBP')).toBe(6.5);
    expect(roundUp(6.5, 'GBP')).toBe(6.5);
    expect(roundUp(14.01, 'USD')).toBe(14.5);
  });

  it('never rounds DOWN, in any currency', () => {
    for (const currency of ['NOK', 'SEK', 'DKK', 'GBP', 'USD'] as const) {
      for (const amount of [0.01, 1.11, 9.99, 100.4, 249.99]) {
        expect(roundUp(amount, currency), `${amount} ${currency}`).toBeGreaterThanOrEqual(amount);
      }
    }
  });
});

describe('the buffer', () => {
  // It absorbs exchange-rate movement between sweeps and however long it has
  // been since the last one. The shop's own hardcoded rates had drifted about
  // 5% from the ECB's before any of this, which is roughly what it is sized
  // for.
  it('is a real margin over cost, not a rounding error', () => {
    expect(BUFFER).toBeGreaterThanOrEqual(0.05);
    expect(BUFFER).toBeLessThanOrEqual(0.15);
  });

  it('keeps a framed A1 to Oslo above its 21.10 EUR cost once converted', () => {
    const perEur = 10.9705;
    const charged = roundUp(21.1 * perEur * (1 + BUFFER), 'NOK');
    expect(charged).toBeGreaterThan(21.1 * perEur);
  });
});
