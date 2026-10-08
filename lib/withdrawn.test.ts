import { describe, expect, it } from 'vitest';
import { withdrawnResponseFor, featuresWithdrawnPrint } from '@/lib/withdrawn';
import { artists } from '@/data/artists';
import { getAllProducts } from '@/lib/products';
import { WITHDRAWN_ARTIST_SLUGS, WITHDRAWN_PRODUCT_SLUGS } from '@/lib/withdrawn';
import { computeOrderAmount } from '@/lib/server/order';

describe('withdrawn work', () => {
  it('301s the artist page to the artists index in its own language', () => {
    expect(withdrawnResponseFor('/artist/helene-brox')).toEqual({ kind: 'redirect', to: '/artists' });
    expect(withdrawnResponseFor('/no/artist/helene-brox/')).toEqual({ kind: 'redirect', to: '/no/artists' });
  });

  it('answers 410 for every withdrawn print, English and Norwegian', () => {
    for (const slug of WITHDRAWN_PRODUCT_SLUGS) {
      expect(withdrawnResponseFor(`/product/${slug}`)).toEqual({ kind: 'gone' });
      expect(withdrawnResponseFor(`/no/product/${slug}`)).toEqual({ kind: 'gone' });
    }
  });

  it('leaves live pages alone', () => {
    expect(withdrawnResponseFor('/product/eltsjoen')).toBeNull();
    expect(withdrawnResponseFor('/artist/simen-wahlqvist')).toBeNull();
    expect(withdrawnResponseFor('/artists')).toBeNull();
    expect(withdrawnResponseFor('/product/dancer/extra')).toBeNull();
  });

  it('is gone from the roster and the catalogue', async () => {
    expect(artists.some(a => WITHDRAWN_ARTIST_SLUGS.includes(a.slug))).toBe(false);
    const products = await getAllProducts();
    expect(products.some(p => WITHDRAWN_PRODUCT_SLUGS.includes(p.slug ?? ""))).toBe(false);
    expect(products.some(p => /brox/i.test(p.artist ?? ""))).toBe(false);
  });

  it('refuses a stale basket that still holds a withdrawn print', async () => {
    const lookup = async () => null;
    const deliver = async () => ({ amount: 5, source: 'fallback' as const });
    await expect(
      computeOrderAmount([{ productId: '7', slug: 'dancer', size: '50x70cm', quantity: 1 }], 'GBP', 'GB', undefined, lookup, deliver as never)
    ).rejects.toThrow(/Unknown product/);
    await expect(
      computeOrderAmount([{ productId: '9', size: '50x70cm', quantity: 1 }], 'GBP', 'GB', undefined, lookup, deliver as never)
    ).rejects.toThrow(/Unknown product/);
  });

  it('flags any scene featuring a withdrawn print', () => {
    expect(featuresWithdrawnPrint(['massa-applen', 'tree-top-peach'])).toBe(true);
    expect(featuresWithdrawnPrint(['massa-applen'])).toBe(false);
  });
});
