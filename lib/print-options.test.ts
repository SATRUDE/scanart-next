import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import { gelatoOrientation, lineImage, lineOrientation, offersFrame, orientationsOf, orientedSize } from './print-options';
import { encodeOrderItems, buildOrderDescription } from './server/order-metadata';
import { receiptFromIntent } from './server/purchase-measurement';
import catalogue from '../public/notion-data/products.json';

// The orientation option (Kopia, Mark 25 Nov 2026) and the unframed-only flag
// (Åsa Törnquist's files have no bleed yet). Both are general print options,
// not special cases, so they are tested as such.

const both = {
  image: '/p.avif',
  orientations: [
    { id: 'portrait' as const, image: '/p.avif' },
    { id: 'landscape' as const, image: '/l.avif' },
  ],
};

describe('orientation option', () => {
  it('is only a choice with two orientations, each with an image', () => {
    expect(orientationsOf(both).map(o => o.id)).toEqual(['portrait', 'landscape']);
    expect(orientationsOf({ orientations: [both.orientations[0]] })).toEqual([]);
    expect(orientationsOf({ orientations: [both.orientations[0], { id: 'landscape', image: '' }] })).toEqual([]);
    expect(orientationsOf({})).toEqual([]);
  });

  it('keeps an offered orientation, falls back to the first, and gives none to a print without the choice', () => {
    expect(lineOrientation(both, 'landscape')).toBe('landscape');
    expect(lineOrientation(both, 'sideways')).toBe('portrait');
    expect(lineOrientation(both, undefined)).toBe('portrait');
    expect(lineOrientation({}, 'landscape')).toBeUndefined();
  });

  it('turns the size on its side for landscape only', () => {
    expect(orientedSize('50x70cm', 'landscape')).toBe('70x50cm');
    expect(orientedSize('50x70cm', 'portrait')).toBe('50x70cm');
    expect(orientedSize('50x70cm')).toBe('50x70cm');
    expect(orientedSize('50x50cm', 'landscape')).toBe('50x50cm');
    expect(orientedSize('A3', 'landscape')).toBe('A3');
  });

  it('maps to Gelato’s _hor / _ver suffix', () => {
    expect(gelatoOrientation('landscape')).toBe('hor');
    expect(gelatoOrientation('portrait')).toBe('ver');
    expect(gelatoOrientation()).toBe('ver');
  });

  it('shows the landscape image for a landscape basket line', () => {
    expect(lineImage(both, 'landscape')).toBe('/l.avif');
    expect(lineImage(both, 'portrait')).toBe('/p.avif');
    expect(lineImage({ image: '/x.png' }, 'landscape')).toBe('/x.png');
  });
});

describe('unframed only', () => {
  it('offers no frame but None', () => {
    expect(offersFrame({ unframedOnly: true }, 'no-frame')).toBe(true);
    expect(offersFrame({ unframedOnly: true }, undefined)).toBe(true);
    expect(offersFrame({ unframedOnly: true }, 'wood')).toBe(false);
    expect(offersFrame({}, 'wood')).toBe(true);
  });
});

describe('the order record', () => {
  it('adds a sixth field only to a line with an orientation, so every other line is unchanged', () => {
    const plain = { slug: 'big-whale', size: '50x70cm', frame: 'no-frame', quantity: 1, unitPrice: 50 };
    expect(encodeOrderItems([plain])).toBe('big-whale~50x70cm~no-frame~1~50');
    expect(encodeOrderItems([{ ...plain, slug: 'kopia', orientation: 'landscape' }])).toBe('kopia~50x70cm~no-frame~1~50~hor');
    expect(encodeOrderItems([{ ...plain, slug: 'kopia', orientation: 'portrait' }])).toBe('kopia~50x70cm~no-frame~1~50~ver');
    expect(buildOrderDescription([{ ...plain, slug: 'kopia', orientation: 'landscape' }])).toBe('kopia, 50x70cm, landscape');
  });

  it('still counts the purchase for measurement with the sixth field', () => {
    const intent = (items: string) =>
      ({
        id: 'pi_1',
        status: 'succeeded',
        livemode: true,
        currency: 'gbp',
        amount_received: 5599,
        metadata: { measurement_version: '1', order_items_1: items },
      }) as unknown as Stripe.PaymentIntent;
    expect(receiptFromIntent(intent('kopia~50x70cm~no-frame~1~50~hor'))?.itemCount).toBe(1);
    expect(receiptFromIntent(intent('kopia~50x70cm~no-frame~1~50~xx'))).toBeNull();
  });
});

describe('the server', () => {
  it('records the orientation and refuses a frame on an unframed-only print', async () => {
    const kopia = (catalogue as { slug: string }[]).find(p => p.slug === 'kopia')!;
    vi.resetModules();
    vi.doMock('@/lib/products', async () => {
      const real = await vi.importActual<typeof import('@/lib/products')>('@/lib/products');
      // The catalogue as it will be once Kopia is published.
      return { ...real, getAllProducts: async () => [...(await real.getAllProducts()), ...(await real.getShopProducts()).filter(p => p.slug === kopia.slug)] };
    });
    vi.doMock('@/lib/server/catalogue-review', () => ({ catalogueReviewEnabled: () => true }));
    const { computeOrderAmount } = await import('./server/order');
    const deliver = async () => ({ amount: 5.99, source: 'gelato' as const });
    const noCodes = async () => null;

    const landscape = await computeOrderAmount([{ productId: '67', slug: 'kopia', size: '50x70cm', frame: 'no-frame', orientation: 'landscape', quantity: 1 }], 'GBP', 'GB', undefined, noCodes, deliver);
    expect(landscape.items[0]).toMatchObject({ slug: 'kopia', orientation: 'landscape', unitPrice: 50 });
    const unsaid = await computeOrderAmount([{ productId: '67', slug: 'kopia', size: '50x70cm', frame: 'no-frame', quantity: 1 }], 'GBP', 'GB', undefined, noCodes, deliver);
    expect(unsaid.items[0].orientation).toBe('portrait');
    await expect(
      computeOrderAmount([{ productId: '67', slug: 'kopia', size: '50x70cm', frame: 'wood', quantity: 1 }], 'GBP', 'GB', undefined, noCodes, deliver)
    ).rejects.toThrow('No frame');
    vi.doUnmock('@/lib/products');
    vi.doUnmock('@/lib/server/catalogue-review');
  });
});
