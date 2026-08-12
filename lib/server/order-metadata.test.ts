import { describe, it, expect } from 'vitest';
import {
  buildOrderDescription,
  buildOrderMetadata,
  chunkItems,
  encodeOrderItems,
  MAX_ITEM_CHUNKS,
  STRIPE_METADATA_VALUE_LIMIT,
} from './order-metadata';

// This is one half of a contract with socialagent's Orders page, which decodes
// what is written here. The fixture is the real basket from the near-sale on
// 2026-08-11, Birdie Brown A1 with a wood frame: 1,401 kr of goods plus 89 kr
// delivery to Norway, so 1,490 kr to pay. A format change is therefore checked
// against an order that actually happened.
//
// Worth knowing when reading the analytics: the site's `checkout` event fires
// from the cart, where delivery is not yet known, so its `total` is the goods
// subtotal and always reads 89 kr light against what Stripe is asked to charge.

const BIRDIE = { slug: 'birdie-brown', size: 'A1', frame: 'wood', quantity: 1, unitPrice: 1401 };

/** The decoder from socialagent, inlined so the contract is checked, not assumed. */
function decode(encoded: string) {
  return encoded
    .split(';')
    .filter(Boolean)
    .map(chunk => {
      const [slug, size, frame, quantity, unitPrice] = chunk.split('~');
      return {
        slug,
        size: size === '-' ? null : size,
        frame: frame === '-' ? null : frame,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      };
    });
}

describe('encodeOrderItems', () => {
  it('round-trips through the decoder socialagent uses', () => {
    expect(decode(encodeOrderItems([BIRDIE]))).toEqual([
      { slug: 'birdie-brown', size: 'A1', frame: 'wood', quantity: 1, unitPrice: 1401 },
    ]);
  });

  it('writes an absent field as "-" rather than an empty gap', () => {
    expect(encodeOrderItems([{ slug: 'morgenstrekk', quantity: 1, unitPrice: 640 }])).toBe(
      'morgenstrekk~-~-~1~640'
    );
  });

  it('strips the delimiters, so a stray character cannot shift every later field', () => {
    const encoded = encodeOrderItems([{ ...BIRDIE, slug: 'bird~ie;brown' }]);
    expect(decode(encoded)).toHaveLength(1);
    expect(decode(encoded)[0].slug).toBe('birdiebrown');
  });

  it('never writes a quantity below one', () => {
    expect(decode(encodeOrderItems([{ ...BIRDIE, quantity: 0 }]))[0].quantity).toBe(1);
  });

  it('keeps several items separate', () => {
    expect(decode(encodeOrderItems([BIRDIE, { slug: 'eltsjoen', quantity: 2, unitPrice: 640 }]))).toHaveLength(2);
  });
});

describe('chunkItems', () => {
  it('leaves a small basket in one key', () => {
    expect(Object.keys(chunkItems(encodeOrderItems([BIRDIE])))).toEqual(['order_items_1']);
  });

  it('never exceeds a single metadata value, which Stripe would reject', () => {
    const many = Array.from({ length: 40 }, () => BIRDIE);
    for (const [key, value] of Object.entries(chunkItems(encodeOrderItems(many)))) {
      if (key.startsWith('order_items_') && key !== 'order_items_truncated') {
        expect(value.length).toBeLessThanOrEqual(STRIPE_METADATA_VALUE_LIMIT);
      }
    }
  });

  it('rejoins to exactly what went in', () => {
    const encoded = encodeOrderItems(Array.from({ length: 30 }, () => BIRDIE));
    const chunks = chunkItems(encoded);
    let joined = '';
    for (let i = 1; i <= MAX_ITEM_CHUNKS; i += 1) joined += chunks[`order_items_${i}`] ?? '';
    expect(joined).toBe(encoded);
    expect(decode(joined)).toHaveLength(30);
  });

  it('flags a basket too long to record rather than silently shortening it', () => {
    const huge = Array.from({ length: 400 }, () => BIRDIE);
    expect(chunkItems(encodeOrderItems(huge)).order_items_truncated).toBe('1');
  });
});

describe('buildOrderMetadata', () => {
  it('carries what the order was, with money to two places', () => {
    const metadata = buildOrderMetadata({
      items: [BIRDIE],
      currency: 'nok',
      subtotal: 1401,
      shipping: 89,
      countryCode: 'NO',
    });
    expect(metadata.order_currency).toBe('NOK');
    expect(metadata.order_subtotal).toBe('1401.00');
    expect(metadata.order_shipping).toBe('89.00');
    expect(metadata.order_country).toBe('NO');
    expect(metadata.order_items_1).toContain('birdie-brown');
  });

  it('leaves the discount keys off entirely when no code was used', () => {
    const metadata = buildOrderMetadata({
      items: [BIRDIE],
      currency: 'NOK',
      subtotal: 1401,
      shipping: 89,
      countryCode: 'NO',
      discount: null,
    });
    expect(metadata.order_discount_code).toBeUndefined();
    expect(metadata.order_discount_amount).toBeUndefined();
  });

  it('records the code and what it was worth', () => {
    const metadata = buildOrderMetadata({
      items: [BIRDIE],
      currency: 'NOK',
      subtotal: 1401,
      shipping: 89,
      countryCode: 'NO',
      discount: { code: 'SUMMER10', percentage: 10 },
      discountAmount: 140.1,
    });
    expect(metadata.order_discount_code).toBe('SUMMER10');
    expect(metadata.order_discount_amount).toBe('140.10');
  });

  it('stays inside Stripe\'s 50-key limit even on a huge basket', () => {
    const huge = Array.from({ length: 400 }, () => BIRDIE);
    const metadata = buildOrderMetadata({
      items: huge,
      currency: 'NOK',
      subtotal: 1,
      shipping: 0,
      countryCode: 'NO',
    });
    expect(Object.keys(metadata).length).toBeLessThanOrEqual(50);
  });
});

describe('buildOrderDescription', () => {
  it('reads as the order, for Stripe\'s own dashboard', () => {
    expect(buildOrderDescription([BIRDIE])).toBe('birdie brown, A1, wood frame');
  });

  it('leaves out an unframed print\'s frame and shows a quantity above one', () => {
    expect(buildOrderDescription([{ slug: 'eltsjoen', size: 'A2', frame: 'no-frame', quantity: 3, unitPrice: 640 }]))
      .toBe('eltsjoen, A2 x3');
  });

  it('truncates rather than being refused by Stripe', () => {
    const long = buildOrderDescription(Array.from({ length: 50 }, () => BIRDIE));
    expect(long.length).toBeLessThanOrEqual(300);
    expect(long.endsWith('...')).toBe(true);
  });
});
