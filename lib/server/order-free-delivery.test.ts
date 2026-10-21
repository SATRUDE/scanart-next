import { describe, it, expect, vi } from 'vitest';
import { FREE_DELIVERY_THRESHOLD } from '@/config/free-delivery';
import type { Currency } from '@/lib/pricing';
import type { DiscountLookup } from './discounts';
import type { DeliveryQuote } from './shipping-rates';

// Free delivery, applied where the charge is made (Mark, 2026-10-21): GBP 100
// or more after discount, no framed print, to the UK, Norway, the US or the
// EU. The catalogue is replaced by fixtures priced to land exactly on, and a
// penny either side of, each currency's threshold, so the boundary is tested
// rather than approximated from whatever the live prices happen to be.

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
const tenOff: DiscountLookup = async () => ({ code: 'TEN', percentage: 10, scope: 'ALL' });
// The 26 Oct sale: 20% off unframed prints only (NORDIC20 in the store).
const saleCode: DiscountLookup = async () => ({ code: 'SALE20', percentage: 20, scope: 'UNFRAMED' });

const order = (productId: string, quantity: number, currency: Currency, country = 'GB', lookup = noCodes, code?: string, frame?: string) =>
  computeOrderAmount([{ productId, size: 'A3', quantity, frame }], currency, country, code, lookup, deliver);

// The countries the PR first shipped free to that now pay: dear framed
// postage, or outside the zones entirely.
const PAYING = ['CH', 'IS', 'LI', 'AU', 'JP', 'CA', 'FO'];
const FREE = ['GB', 'NO', 'SE', 'DK', 'US', 'DE', 'ES', 'IE'];

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

      it('is free to the UK, Norway, the US and the EU', async () => {
        for (const country of FREE) {
          expect((await order('at', 1, currency, country)).shipping, country).toBe(0);
        }
      });

      it('is charged everywhere else, however big the order', async () => {
        for (const country of PAYING) {
          const o = await order('at', 5, currency, country);
          expect(o.shipping, country).toBe(DELIVERY);
          expect(o.amount, country).toBe(cents(o.subtotal + DELIVERY));
        }
      });

      it('is charged on any basket with a framed print, even far over the threshold', async () => {
        for (const country of FREE) {
          const o = await order('at', 3, currency, country, noCodes, undefined, 'wood');
          expect(o.shipping, country).toBe(DELIVERY);
          expect(o.shippingSource, country).toBe('gelato');
        }
      });
    });
  }

  it('one framed line in an otherwise free basket makes the whole basket pay', async () => {
    const o = await computeOrderAmount(
      [
        { productId: 'at', size: 'A3', quantity: 2 },
        { productId: 'half', size: 'A3', quantity: 1, frame: 'black' },
      ],
      'GBP', 'GB', undefined, noCodes, deliver,
    );
    expect(o.shipping).toBe(DELIVERY);
  });

  it('the explicit no-frame option still ships free', async () => {
    expect((await order('at', 1, 'GBP', 'GB', noCodes, undefined, 'no-frame')).shipping).toBe(0);
  });

  it('decides on the subtotal AFTER a discount: 10% off a threshold basket drops under it', async () => {
    const o = await order('at', 1, 'GBP', 'GB', tenOff, 'TEN');
    expect(o.discountAmount).toBe(10);
    expect(o.shipping).toBe(DELIVERY);
    expect(o.amount).toBe(cents(100 - 10 + DELIVERY));
  });

  it('a discount that still leaves the basket at the threshold keeps delivery free (codes stack)', async () => {
    // 2 x 'at' = 200, 10% off = 180, still over 100.
    const o = await order('at', 2, 'GBP', 'GB', tenOff, 'TEN');
    expect(o.shipping).toBe(0);
    expect(o.amount).toBe(180);
  });

  it('a discount landing exactly on the threshold is free ("or more")', async () => {
    const fiftyOff: DiscountLookup = async () => ({ code: 'HALF', percentage: 50, scope: 'ALL' });
    const o = await order('at', 2, 'NOK', 'NO', fiftyOff, 'HALF');
    expect(o.subtotal - o.discountAmount).toBe(1500);
    expect(o.shipping).toBe(0);
  });

  describe('the 26 Oct sale code (20% off unframed prints)', () => {
    it('stacks: an unframed basket still over the line after 20% off ships free', async () => {
      // 2 x 100 = 200, 20% off = 160.
      const o = await order('at', 2, 'GBP', 'GB', saleCode, 'SALE20');
      expect(o.discountAmount).toBe(40);
      expect(o.shipping).toBe(0);
      expect(o.amount).toBe(160);
    });

    it('a basket the code takes under the line pays delivery', async () => {
      // 100 - 20% = 80.
      const o = await order('at', 1, 'GBP', 'GB', saleCode, 'SALE20');
      expect(o.discountAmount).toBe(20);
      expect(o.shipping).toBe(DELIVERY);
      expect(o.amount).toBe(cents(80 + DELIVERY));
    });

    it('a framed basket gets no discount on the framed line and still pays delivery', async () => {
      const o = await computeOrderAmount(
        [
          { productId: 'at', size: 'A3', quantity: 2 },
          { productId: 'half', size: 'A3', quantity: 1, frame: 'wood' },
        ],
        'GBP', 'GB', 'SALE20', saleCode, deliver,
      );
      expect(o.discountAmount).toBe(40);
      expect(o.shipping).toBe(DELIVERY);
    });
  });
});
