import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { getAllProducts, getShopProductBySlug } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { computeOrderAmount } from '@/lib/server/order';
import { sceneFocus } from '@/lib/scene-focus';
import { pinFor } from '@/lib/artist-cities';
import { no } from '@/lib/i18n/no';
import manifest from '@/scripts/artists/emma-iben-review.json';

afterEach(() => vi.unstubAllEnvs());

// Sizes follow resolution (T-0099): three works are offered in A3, A2 and A1;
// Precautions is 2354 px wide, so A3 only until Emma sends a larger file.
const SIZES: Record<string, string[]> = {
  'fitting-in': ['A3', 'A2', 'A1'],
  'precautions': ['A3'],
  'pressure': ['A3', 'A2', 'A1'],
  'good-conversation': ['A3', 'A2', 'A1'],
};

describe('Emma Iben is live', () => {
  it('sells her four prints in production, with no draft gate involved', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const mine = (await getAllProducts()).filter(p => p.artistId === '11');
    expect(mine.map(p => p.slug).sort()).toEqual(Object.keys(SIZES).sort());
    expect((await getPublishedArtists()).find(a => a.id === '11')?.printCount).toBe(4);
  });

  it('offers each print only in the sizes its file supports, at the Budget (middle) band', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const work of manifest.works) {
      const product = await getShopProductBySlug(work.slug);
      expect(product?.published, work.slug).toBe(true);
      expect(product?.name).toBe(work.title);
      expect(Object.keys(product!.prices).sort(), work.slug).toEqual([...SIZES[work.slug]].sort());
      expect(product!.prices.A3.GBP, work.slug).toBe(35);
      if (SIZES[work.slug].length > 1) {
        expect(product!.prices.A2.GBP).toBe(45);
        expect(product!.prices.A1.GBP).toBe(66);
      }
    }
  });

  it('keeps every image and scene focus on disk', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const slug of Object.keys(SIZES)) {
      const product = await getShopProductBySlug(slug);
      for (const src of [product!.image, `/images/artworks/${slug}.avif`, product!.secondaryImage!, product!.secondaryImage!.replace('.avif', '.webp')]) {
        expect(existsSync(`public${src}`), src).toBe(true);
      }
      expect(sceneFocus(product!.secondaryImage!), slug).toBeDefined();
    }
  });

  it('prices an A3 and a framed A1 of Fitting in at checkout', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const print = await getShopProductBySlug('fitting-in');
    const order = await computeOrderAmount([
      { productId: print!.id, size: 'A3', quantity: 1 },
      { productId: print!.id, size: 'A1', frame: 'wood', quantity: 1 },
    ], 'GBP', 'GB');
    // GBP 35 for the A3; GBP 66 + 55 framing for the A1 (config/frame.ts).
    expect(order.subtotal).toBe(35 + 66 + 55);
  });

  it('has Copenhagen on the artist map and Norwegian copy for the page and each print', () => {
    expect(pinFor('Copenhagen')).not.toBeNull();
    expect(no.artists['emma-iben'].bio).toMatch(/^Emma Iben er /);
    expect(no.artists['emma-iben'].location).toBe('København, Danmark');
    expect(no.artistStatements['emma-iben']).toBeTruthy();
    expect(no.artistEditorial['emma-iben'].heading).toBeTruthy();
    for (const slug of Object.keys(SIZES)) {
      expect(no.productCopy[slug]?.description, `no Norwegian description for ${slug}`).toBeTruthy();
    }
  });
});
