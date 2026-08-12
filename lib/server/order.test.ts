import { describe, it, expect } from 'vitest';
import { computeOrderAmount } from './order';
import type { DiscountLookup } from './discounts';
import { getAllProducts } from '@/lib/products';
import { getProductPrice } from '@/lib/pricing';
import { getShippingRate } from '@/config/shipping';
import { getFramePrice } from '@/config/frame';

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
  return percentage ? { code: normalised, percentage } : null;
};

const noCodes: DiscountLookup = async () => null;

describe('computeOrderAmount', () => {
  it('recomputes the total from the catalogue, matching the client formula', async () => {
    const [product] = await getAllProducts();
    const size = Object.keys(product.sizes ?? {})[0];
    const unit = getProductPrice(product, size, 'GBP');
    const frame = getFramePrice('wood', 'GBP');
    const shipping = getShippingRate('GB')?.costs.GBP || 0;

    const order = await computeOrderAmount(
      [{ productId: product.id, size, frame: 'wood', quantity: 2 }],
      'GBP',
      'GB'
    );

    expect(order.subtotal).toBe(Math.round((unit + frame) * 2 * 100) / 100);
    expect(order.amount).toBe(Math.round((order.subtotal + shipping) * 100) / 100);
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
    expect(discounted.discount).toEqual({ code: 'SAVE20', percentage: 20 });
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
    expect(order.discount).toEqual({ code: 'WELCOME10', percentage: 10 });
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
    const frame = getFramePrice('wood', 'NOK');

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

  it('falls back to zero shipping for unknown countries, like the client', async () => {
    const [product] = await getAllProducts();
    const order = await computeOrderAmount([{ productId: product.id, quantity: 1 }], 'GBP', 'XX');
    expect(order.shipping).toBe(0);
  });
});
