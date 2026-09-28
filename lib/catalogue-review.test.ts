import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { getAllProducts, getShopProducts, getShopProductBySlug } from '@/lib/products';
import { getPublishedArtists, getShopArtists } from '@/lib/published-artists';
import { computeOrderAmount } from '@/lib/server/order';
import { sceneFocus } from '@/lib/scene-focus';
import manifest from '@/scripts/artists/markus-naarttijarvi-review.json';

afterEach(() => vi.unstubAllEnvs());

describe('unpublished artist preview', () => {
  it('keeps drafts hidden in production even with the local preview switch', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('CATALOGUE_PREVIEW', '1');
    expect(await getShopProductBySlug('through-the-willows')).toBeNull();
    expect((await getShopArtists()).some(a => a.id === '9')).toBe(false);
  });

  it('shows only marked drafts on previews and never reactivates Ishtar or retired prints', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const shop = await getShopProducts();
    expect(shop.filter(p => p.artistId === '9').map(p => p.slug)).toEqual(manifest.prints.map(p => p.slug));
    expect(shop.filter(p => p.published === false).every(p => p.artistId === '9')).toBe(true);
    expect((await getShopArtists()).find(a => a.id === '9')?.printCount).toBe(10);
    expect((await getAllProducts()).some(p => p.artistId === '9')).toBe(false);
    expect((await getPublishedArtists()).some(a => a.id === '9')).toBe(false);
  });

  it('refuses preview print IDs at checkout even on a preview deployment', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const draft = await getShopProductBySlug('through-the-willows');
    expect(draft?.published).toBe(false);
    await expect(computeOrderAmount([
      { productId: draft!.id, size: '50x70cm', frame: 'wood', quantity: 1 },
    ], 'GBP', 'GB')).rejects.toThrow('Unknown product');
  });

  it('keeps Ken’s exact copy and supplies every preview image, scene twin and focus', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    for (const print of manifest.prints) {
      const product = await getShopProductBySlug(print.slug);
      expect(product?.name).toBe(print.title);
      expect(product?.description).toBe(print.description);
      expect(product?.prices['50x70cm'].GBP).toBe(56);
      for (const src of [product!.image, product!.secondaryImage!, product!.secondaryImage!.replace('.avif', '.webp')]) {
        expect(existsSync(`public${src}`), src).toBe(true);
      }
      expect(sceneFocus(product!.secondaryImage!), print.slug).toBeDefined();
    }
  });
});
