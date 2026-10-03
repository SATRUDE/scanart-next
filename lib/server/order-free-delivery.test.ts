import { describe, it, expect, vi } from 'vitest';
import { FREE_DELIVERY_THRESHOLD } from '@/config/free-delivery';
import type { Currency } from '@/lib/pricing';
import type { DiscountLookup } from './discounts';
import type { DeliveryQuote } from './shipping-rates';

// Free delivery, applied where the charge is made. The catalogue is replaced
// by fixtures priced to land exactly on, and a penny either side of, each
// currency's threshold, so the boundary is tested rather than approximated
// from whatever the live prices happen to be.

const CURRENCIES: Currency[] = ['GBP', 'NOK', 'USD', 'DKK', 'SEK'];
const spread = (f: (c: Currency) => number) =>
  Object.fromEntries(CURRENCIES.map(c => [c, f(c)])) as Record<Currency, number>;
const cents = (n: number) => Math.round(n * 100) / 100;

vi.mock('@/lib/products', () => ({
  getAllProducts: async () => [
    // One unit costs exactly the threshold.
    { id: 'at', slug: 'at', sizes: { A3: true }, prices: { A3: spread(c => FREE_DELIVERY_THRESHOLD[c]) } },
    // One unit costs a penny under it.
    { id: 'under', slug: 'under', sizes: { A3: true }, prices: { A3: spread(c => cents(FREE_DELIVERY_THRESHOLD[c] - 0.01)) } },
    // One unit costs a penny over it.
    { id: 'over', slug: 'over', sizes: { A3: true }, prices: { A3: spread(c => cents(FREE_DELIVERY_THRESHOLD[c] + 0.01)) } },
    // Two of these make exactly the threshold.
    { id: 'half', slug: 'half', sizes: { A3: true }, prices: { A3: spread(c => FREE_DELIVERY_THRESHOLD[c] / 2) } },
  ],
}));

const { computeOrderAmount } = await import('./order');

const DELIVERY = 6.5;
const deliver = vi.fn(async (): Promise<DeliveryQuote> => ({ amount: DELIVERY, source: 'gelato' }));
const noCodes: DiscountLookup = async () => null;
const tenOff: DiscountLookup = async () => ({ code: 'TEN', percentage: 10 });

const order = (productId: string, quantity: number, currency: Currency, country = 'GB', lookup = noCodes, code?: string) =>
  computeOrderAmount([{ productId, size: 'A3', quantity }], currency, country, code, lookup, deliver);

describe('free delivery in the order maths', () => {
  for (const currency of CURRENCIES) {
    describe(currency, () => {
      it('is free exactly at the threshold', async () => {
        deliver.mockClear();
        const o = await order('at', 1, currency);
        expect(o.subtotal).toBe(FREE_DELIVERY_THRESHOLD[currency]);
        expect(o.shipping).toBe(0);
        expect(o.shippingSource).toBe('free-delivery');
        expect(o.amount).toBe(FREE_DELIVERY_THRESHOLD[currency]);
        // A free order does not ask the store for a quote at all.
        expect(deliver).not.toHaveBeenCalled();
      });

      it('is free just over, and when two halves add up to the threshold', async () => {
        expect((await order('over', 1, currency)).shipping).toBe(0);
        expect((await order('half', 2, currency)).shipping).toBe(0);
      });

      it('is charged one penny under the threshold', async () => {
        const o = await order('under', 1, currency);
        expect(o.shipping).toBe(DELIVERY);
        expect(o.shippingSource).toBe('gelato');
        expect(o.amount).toBe(cents(o.subtotal + DELIVERY));
      });

      it('is charged well under the threshold', async () => {
        expect((await order('half', 1, currency)).shipping).toBe(DELIVERY);
      });

      it('is free to every destination, the dearest included', async () => {
        for (const country of ['GB', 'NO', 'SE', 'DK', 'US', 'CH', 'IS', 'AU', 'JP']) {
          expect((await order('at', 1, currency, country)).shipping, country).toBe(0);
        }
      });
    });
  }

  it('decides on the subtotal AFTER a discount: 10% off a threshold basket drops under it', async () => {
    const o = await order('at', 1, 'GBP', 'GB', tenOff, 'TEN');
    expect(o.discountAmount).toBe(10);
    expect(o.shipping).toBe(DELIVERY);
    expect(o.amount).toBe(cents(100 - 10 + DELIVERY));
  });

  it('a discount that still leaves the basket at the threshold keeps delivery free', async () => {
    // 2 x 'at' = 200, 10% off = 180, still over 100.
    const o = await order('at', 2, 'GBP', 'GB', tenOff, 'TEN');
    expect(o.shipping).toBe(0);
    expect(o.amount).toBe(180);
  });

  it('a discount landing exactly on the threshold is free ("or more")', async () => {
    // 'half' x 2 = 100; no discount. Use a 10% code on a basket priced 111.11-ish is
    // brittle, so land exactly via a 50% code on two thresholds.
    const fiftyOff: DiscountLookup = async () => ({ code: 'HALF', percentage: 50 });
    const o = await order('at', 2, 'NOK', 'NO', fiftyOff, 'HALF');
    expect(o.subtotal - o.discountAmount).toBe(1500);
    expect(o.shipping).toBe(0);
  });
});
