import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { getAllProducts, getShopProductBySlug } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { computeOrderAmount } from '@/lib/server/order';
import { sceneFocus } from '@/lib/scene-focus';
import { pinFor } from '@/lib/artist-cities';
import { getArtistBySlug } from '@/data/artists';
import { aboutPlaces } from '@/components/v2/about/about-data';
import { no } from '@/lib/i18n/no';
import manifest from '@/scripts/artists/christina-hagerfors.json';

afterEach(() => vi.unstubAllEnvs());

describe('Christina Hägerfors is live', () => {
  it('sells her four posters in production, with no draft gate involved', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const mine = (await getAllProducts()).filter(p => p.artistId === '12');
    expect(mine.map(p => p.slug).sort()).toEqual(manifest.prints.map(p => p.slug).sort());
    expect(mine.every(p => p.inStock)).toBe(true);
    expect((await getPublishedArtists()).find(a => a.id === '12')?.printCount).toBe(4);
  });

  it('offers each poster at 50 x 70 cm on the Entry list she saw on her preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const work of manifest.prints) {
      const product = await getShopProductBySlug(work.slug);
      expect(product?.published, work.slug).toBe(true);
      expect(product?.name).toBe(work.name);
      expect(product?.description).toBe(work.description);
      expect(Object.keys(product!.prices)).toEqual(['50x70cm']);
      expect(product!.prices['50x70cm']).toEqual({ GBP: 35, USD: 45, NOK: 500, DKK: 325, SEK: 500 });
    }
  });

  it('keeps every image and scene focus on disk', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const work of manifest.prints) {
      const product = await getShopProductBySlug(work.slug);
      for (const src of [product!.image, product!.secondaryImage!, product!.secondaryImage!.replace('.avif', '.webp')]) {
        expect(existsSync(`public${src}`), src).toBe(true);
      }
      expect(sceneFocus(product!.secondaryImage!), work.slug).toBeDefined();
    }
  });

  it('prices an unframed and a framed Big Whale at checkout', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const print = await getShopProductBySlug('big-whale');
    const order = await computeOrderAmount([
      { productId: print!.id, size: '50x70cm', quantity: 1 },
      { productId: print!.id, size: '50x70cm', frame: 'wood', quantity: 1 },
    ], 'GBP', 'GB');
    // GBP 35 unframed; GBP 35 + 39 framing for the 50 x 70 (config/frame.ts).
    expect(order.subtotal).toBe(35 + 35 + 39);
  });

  it('says she lives in France, pins Karlstad as her home town and keeps her off "Where the artists work"', () => {
    const christina = getArtistBySlug('christina-hagerfors')!;
    expect(christina.location).toBe('Cérons, France');
    expect(christina.mapCity).toBe('Karlstad');
    expect(pinFor('Karlstad')).not.toBeNull();
    const places = aboutPlaces([{ ...christina, printCount: 4 }]);
    expect(places).toEqual([]);
  });

  it('has Norwegian copy for the page and each poster', () => {
    expect(no.artists['christina-hagerfors'].bio).toMatch(/^Christina Hägerfors er /);
    expect(no.artists['christina-hagerfors'].location).toBe('Cérons, Frankrike');
    expect(no.artistStatements['christina-hagerfors']).toBeTruthy();
    for (const work of manifest.prints) {
      expect(no.productCopy[work.slug]?.description, `no Norwegian description for ${work.slug}`).toBe(work.descriptionNo);
    }
  });
});
