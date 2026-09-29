import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { getAllProducts, getShopProducts, getShopProductBySlug } from '@/lib/products';
import { getPublishedArtists, getShopArtists } from '@/lib/published-artists';
import { computeOrderAmount } from '@/lib/server/order';
import { warmImage } from '@/lib/warm-image';
import manifest from '@/scripts/artists/christina-hagerfors.json';

// Christina Hägerfors's unpublished preview (docs/christina-preview.md). The
// same gate as Markus Naarttijärvi's: review prints show on preview
// deployments only, and never reach checkout, feeds or the sitemap.
const ARTIST_ID = manifest.artist.id;
const slugs = manifest.prints.map(p => p.slug);

afterEach(() => vi.unstubAllEnvs());

describe('Christina Hägerfors preview', () => {
  it('keeps her prints and page hidden in production, even with the local preview switch', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('CATALOGUE_PREVIEW', '1');
    for (const slug of slugs) expect(await getShopProductBySlug(slug)).toBeNull();
    expect((await getShopArtists()).some(a => a.id === ARTIST_ID)).toBe(false);
  });

  it('shows every manifest print on a preview deployment, and only there', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const shop = await getShopProducts();
    expect(shop.filter(p => p.artistId === ARTIST_ID).map(p => p.slug)).toEqual(slugs);
    expect((await getShopArtists()).find(a => a.id === ARTIST_ID)?.printCount).toBe(slugs.length);
    expect((await getAllProducts()).some(p => p.artistId === ARTIST_ID)).toBe(false);
    expect((await getPublishedArtists()).some(a => a.id === ARTIST_ID)).toBe(false);
  });

  it('refuses her print IDs at checkout even on a preview deployment', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const draft = await getShopProductBySlug(slugs[0]);
    expect(draft?.published).toBe(false);
    expect(draft?.inStock).toBe(false);
    await expect(computeOrderAmount([
      { productId: draft!.id, size: '50x70cm', frame: 'wood', quantity: 1 },
    ], 'GBP', 'GB')).rejects.toThrow('Unknown product');
  });

  it('lists each print at the Entry 50 x 70 cm price with the manifest copy and its images', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    for (const print of manifest.prints) {
      const product = await getShopProductBySlug(print.slug);
      expect(product?.name).toBe(print.name);
      expect(product?.description).toBe(print.description);
      expect(Object.keys(product!.prices)).toEqual(['50x70cm']);
      expect(product?.prices['50x70cm'].GBP).toBe(35);
      expect(existsSync(`public${product!.image}`), product!.image).toBe(true);
      const warm = warmImage(product!.image);
      expect(warm).not.toBe(product!.image);
      expect(existsSync(`public${warm}`), warm).toBe(true);
    }
  });
});
