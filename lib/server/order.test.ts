import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { computeOrderAmount, validateDiscountCode } from './order';
import { getAllProducts } from '@/lib/products';
import { getProductPrice } from '@/lib/pricing';
import { getShippingRate } from '@/config/shipping';
import { getFramePrice } from '@/config/frame';

// The order maths is the single source of truth for what gets charged, so it
// gets real tests: computed against the live catalogue, not fixtures, because
// drift between this module and the data is exactly the bug class to catch.

const ORIGINAL_ENV = process.env.DISCOUNT_CODES;

beforeEach(() => {
  process.env.DISCOUNT_CODES = 'WELCOME10:10,SAVE20:20';
});

afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env.DISCOUNT_CODES;
  else process.env.DISCOUNT_CODES = ORIGINAL_ENV;
});

describe('validateDiscountCode', () => {
  it('accepts a configured code case-insensitively', () => {
    expect(validateDiscountCode('welcome10')).toEqual({ code: 'WELCOME10', percentage: 10 });
  });

  it('rejects unknown codes, including retired ones', () => {
    expect(validateDiscountCode('TRUDE100')).toBeNull();
    expect(validateDiscountCode('')).toBeNull();
  });

  it('has no valid codes when the env var is unset (fail safe)', () => {
    delete process.env.DISCOUNT_CODES;
    expect(validateDiscountCode('WELCOME10')).toBeNull();
  });

  it('ignores malformed env entries', () => {
    process.env.DISCOUNT_CODES = 'BAD,ALSOBAD:,NEG:-5,OVER:150,OK:15';
    expect(validateDiscountCode('BAD')).toBeNull();
    expect(validateDiscountCode('NEG')).toBeNull();
    expect(validateDiscountCode('OVER')).toBeNull();
    expect(validateDiscountCode('OK')).toEqual({ code: 'OK', percentage: 15 });
  });
});

describe('computeOrderAmount', () => {
  it('recomputes the total from the catalogue, matching the client formula', async () => {
    const [product] = await getAllProducts();
    const size = product.availableSizes?.[0];
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
    const size = product.availableSizes?.[0];
    const base = await computeOrderAmount([{ productId: product.id, size, quantity: 1 }], 'GBP', 'GB');
    const discounted = await computeOrderAmount(
      [{ productId: product.id, size, quantity: 1 }],
      'GBP',
      'GB',
      'SAVE20'
    );
    const expectedOff = Math.round(base.subtotal * 0.2 * 100) / 100;
    expect(discounted.amount).toBe(Math.round((base.amount - expectedOff) * 100) / 100);
    expect(discounted.discount).toEqual({ code: 'SAVE20', percentage: 20 });
  });

  it('ignores an invalid discount code rather than failing the order', async () => {
    const [product] = await getAllProducts();
    const order = await computeOrderAmount(
      [{ productId: product.id, quantity: 1 }],
      'GBP',
      'GB',
      'TRUDE100'
    );
    expect(order.discount).toBeNull();
    expect(order.amount).toBeGreaterThan(0);
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
