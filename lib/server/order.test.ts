import { describe, it, expect } from 'vitest';
import { computeOrderAmount } from './order';
import type { DiscountLookup } from './discounts';
import type { DeliveryQuote } from './shipping-rates';

// Delivery is injected, like the discount lookup, so these stay about the
// order maths and never reach for a database or Gelato.
const DELIVERY = 60;
const deliver = async (): Promise<DeliveryQuote> => ({ amount: DELIVERY, source: 'gelato' });
import { getAllProducts } from '@/lib/products';
import { getShippingRate } from '@/config/shipping';
import { getFramePrice } from '@/config/frame';
import { getProductPrice } from '@/lib/pricing';

// The order maths is the single source of truth for what gets charged, so it
// gets real tests: computed against the live catalogue, not fixtures, because
// drift between this module and the data is exactly the bug class to catch.
//
// Discount codes moved out of the DISCOUNT_CODES env var and into the
// socialagent store on 2026-08-12. The lookup is injected here so these tests
// stay about the maths and never need a database; the store lookup itself is
// covered in discounts.test.ts.

const CODES: Record<string, number> = { WELCOME10: 10, SAVE20: 20 };

const lookup: DiscountLookup = async code => {
  const normalised = code.trim().toUpperCase();
  const percentage = CODES[normalised];
  if (normalised === 'SALE20U') return { code: normalised, percentage: 20, scope: 'UNFRAMED' };
  return percentage ? { code: normalised, percentage, scope: 'ALL' } : null;
};

const noCodes: DiscountLookup = async () => null;

describe('computeOrderAmount', () => {
  it('recomputes the total from the catalogue, matching the client formula', async () => {
    const [product] = await getAllProducts();
    const size = Object.keys(product.sizes ?? {})[0];
    const unit = getProductPrice(product, size, 'GBP');
    const frame = getFramePrice('wood', size, 'GBP');
    const order = await computeOrderAmount(
      [{ productId: product.id, size, frame: 'wood', quantity: 2 }],
      'GBP',
      'GB',
      undefined,
      noCodes,
      deliver
    );

    expect(order.subtotal).toBe(Math.round((unit + frame) * 2 * 100) / 100);
    expect(order.amount).toBe(Math.round((order.subtotal + DELIVERY) * 100) / 100);
    expect(order.discount).toBeNull();
  });

  it('applies a valid discount to the subtotal only, not shipping', async () => {
    const [product] = await getAllProducts();
    const size = Object.keys(product.sizes ?? {})[0];
    const base = await computeOrderAmount(
      [{ productId: product.id, size, quantity: 1 }],
      'GBP',
      'GB',
      undefined,
      lookup
    );
    const discounted = await computeOrderAmount(
      [{ productId: product.id, size, quantity: 1 }],
      'GBP',
      'GB',
      'SAVE20',
      lookup
    );
    const expectedOff = Math.round(base.subtotal * 0.2 * 100) / 100;
    expect(discounted.amount).toBe(Math.round((base.amount - expectedOff) * 100) / 100);
    expect(discounted.discount).toEqual({ code: 'SAVE20', percentage: 20, scope: 'ALL' });
    expect(discounted.discountAmount).toBe(expectedOff);
  });

  it('accepts a code case-insensitively, as buyers type it', async () => {
    const [product] = await getAllProducts();
    const order = await computeOrderAmount(
      [{ productId: product.id, quantity: 1 }],
      'GBP',
      'GB',
      ' welcome10 ',
      lookup
    );
    expect(order.discount).toEqual({ code: 'WELCOME10', percentage: 10, scope: 'ALL' });
  });

  it('ignores an invalid discount code rather than failing the order', async () => {
    const [product] = await getAllProducts();
    const order = await computeOrderAmount(
      [{ productId: product.id, quantity: 1 }],
      'GBP',
      'GB',
      'TRUDE100',
      lookup
    );
    expect(order.discount).toBeNull();
    expect(order.discountAmount).toBe(0);
    expect(order.amount).toBeGreaterThan(0);
  });

  it('charges full price when the code store has nothing, which is the fail-safe direction', async () => {
    const [product] = await getAllProducts();
    const base = await computeOrderAmount([{ productId: product.id, quantity: 1 }], 'GBP', 'GB', undefined, noCodes);
    const attempted = await computeOrderAmount(
      [{ productId: product.id, quantity: 1 }],
      'GBP',
      'GB',
      'WELCOME10',
      noCodes
    );
    expect(attempted.discount).toBeNull();
    expect(attempted.amount).toBe(base.amount);
  });

  it('records the priced lines for the payment intent, from the catalogue not the request', async () => {
    const [product] = await getAllProducts();
    const size = Object.keys(product.sizes ?? {})[0];
    const unit = getProductPrice(product, size, 'NOK');
    const frame = getFramePrice('wood', size, 'NOK');

    const order = await computeOrderAmount(
      [{ productId: product.id, size, frame: 'wood', quantity: 2 }],
      'NOK',
      'NO'
    );

    expect(order.items).toEqual([
      {
        slug: product.slug,
        size,
        frame: 'wood',
        quantity: 2,
        unitPrice: Math.round((unit + frame) * 100) / 100,
      },
    ]);
  });

  it('rejects unknown products and bad quantities', async () => {
    await expect(computeOrderAmount([{ productId: 'nope', quantity: 1 }], 'GBP', 'GB')).rejects.toThrow(
      'Unknown product'
    );
    const [product] = await getAllProducts();
    await expect(
      computeOrderAmount([{ productId: product.id, quantity: 0 }], 'GBP', 'GB')
    ).rejects.toThrow('Invalid quantity');
    await expect(computeOrderAmount([], 'GBP', 'GB')).rejects.toThrow('Invalid order items');
  });

  // getProductPrice falls back to another size when asked for one the print
  // does not have, so a tampered basket could buy a framed A1 at a 50 x 70
  // print's price. The order now refuses a size the print is not sold in.
  it('refuses a size the print is not sold in, and a frame that does not exist', async () => {
    const products = await getAllProducts();
    const single = products.find(p => Object.keys(p.prices ?? {}).length === 1 && !p.prices?.A1)!;
    await expect(
      computeOrderAmount([{ productId: single.id, size: 'A1', frame: 'wood', quantity: 1 }], 'GBP', 'GB', undefined, noCodes, deliver)
    ).rejects.toThrow('is not sold in A1');
    const size = Object.keys(single.prices ?? {})[0];
    await expect(
      computeOrderAmount([{ productId: single.id, size, frame: 'gold-leaf', quantity: 1 }], 'GBP', 'GB', undefined, noCodes, deliver)
    ).rejects.toThrow('Unknown frame');
  });

  it('hands the guard the print and frame priced separately', async () => {
    const [product] = await getAllProducts();
    const size = Object.keys(product.prices ?? {})[0];
    const order = await computeOrderAmount(
      [{ productId: product.id, size, frame: 'wood', quantity: 2 }], 'GBP', 'GB', undefined, noCodes, deliver
    );
    expect(order.lines).toEqual([
      { size, frame: 'wood', quantity: 2, printPrice: getProductPrice(product, size, 'GBP'), framePrice: getFramePrice('wood', size, 'GBP') },
    ]);
  });

  // Delivery now comes from Gelato's swept prices, and this is the guarantee
  // that survives that change: whatever the country, and whatever the store
  // says, an order is never posted for nothing. It used to be, because
  // getShippingRate returns undefined for a code it does not know and the
  // caller turned that into zero, so "ZZ" bought free delivery.
  it('never charges nothing for delivery, whatever the country', async () => {
    const [product] = await getAllProducts();
    for (const code of ['XX', 'ZZ', '', 'not-a-country', 'DE', 'NO']) {
      const order = await computeOrderAmount(
        [{ productId: product.id, quantity: 1 }],
        'GBP',
        code,
        undefined,
        noCodes
      );
      expect(order.shipping, `${code} shipped for nothing`).toBeGreaterThan(0);
    }
  });

  it('falls back to the static table when the store cannot answer', async () => {
    const [product] = await getAllProducts();
    const restOfWorld = getShippingRate('ELSEWHERE')!.costs.GBP;
    const order = await computeOrderAmount(
      [{ productId: product.id, quantity: 1 }],
      'GBP',
      'ZZ',
      undefined,
      noCodes,
      async () => ({ amount: restOfWorld, source: 'fallback' })
    );
    expect(order.shipping).toBe(restOfWorld);
    expect(order.shippingSource).toBe('fallback');
  });

  it('records where the delivery figure came from, for the order record', async () => {
    const [product] = await getAllProducts();
    const order = await computeOrderAmount(
      [{ productId: product.id, quantity: 1 }],
      'NOK',
      'NO',
      undefined,
      noCodes,
      async () => ({ amount: 105, source: 'set-by-hand' })
    );
    expect(order.shipping).toBe(105);
    expect(order.shippingSource).toBe('set-by-hand');
  });

  describe('an unframed-only code', () => {
    const basket = async (frames: (string | undefined)[]) => {
      const [product] = await getAllProducts();
      const size = Object.keys(product.sizes ?? {})[0];
      return [product, size, frames.map(frame => ({ productId: product.id, size, frame, quantity: 1 }))] as const;
    };

    it('discounts an unframed print by the full percentage', async () => {
      const [, , items] = await basket([undefined]);
      const base = await computeOrderAmount(items, 'GBP', 'GB', undefined, lookup);
      const sale = await computeOrderAmount(items, 'GBP', 'GB', 'SALE20U', lookup);
      expect(sale.discountAmount).toBe(Math.round(base.subtotal * 0.2 * 100) / 100);
    });

    it('treats the explicit no-frame option as unframed', async () => {
      const [, , items] = await basket(['no-frame']);
      const sale = await computeOrderAmount(items, 'GBP', 'GB', 'SALE20U', lookup);
      expect(sale.discountAmount).toBeGreaterThan(0);
    });

    it('leaves a framed print, frame included, at full price', async () => {
      const [, , items] = await basket(['wood']);
      const base = await computeOrderAmount(items, 'GBP', 'GB', undefined, lookup);
      const sale = await computeOrderAmount(items, 'GBP', 'GB', 'SALE20U', lookup);
      expect(sale.discountAmount).toBe(0);
      expect(sale.amount).toBe(base.amount);
    });

    it('in a mixed basket discounts only the unframed line', async () => {
      const [product, size, items] = await basket([undefined, 'wood']);
      const plain = getProductPrice(product, size, 'GBP');
      const sale = await computeOrderAmount(items, 'GBP', 'GB', 'SALE20U', lookup);
      expect(sale.discountAmount).toBe(Math.round(plain * 0.2 * 100) / 100);
    });

    // It used to be taken, at no frame price and no discount. A frame the
    // catalogue does not know cannot be priced or made, so it is refused.
    it('refuses a frame id the catalogue does not know', async () => {
      const [, , items] = await basket(['not-a-frame']);
      await expect(computeOrderAmount(items, 'GBP', 'GB', 'SALE20U', lookup)).rejects.toThrow('Unknown frame');
    });

    it('an ALL code still discounts the frame, as before', async () => {
      const [, , items] = await basket(['wood']);
      const base = await computeOrderAmount(items, 'GBP', 'GB', undefined, lookup);
      const sale = await computeOrderAmount(items, 'GBP', 'GB', 'SAVE20', lookup);
      expect(sale.discountAmount).toBe(Math.round(base.subtotal * 0.2 * 100) / 100);
    });
  });
});
