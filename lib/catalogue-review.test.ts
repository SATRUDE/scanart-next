import { availableCategoryLandings } from '@/lib/categories';
import { searchIndex, type SearchIndex } from '@/lib/site-search';
import { refineProducts } from '@/components/v2/shop/shop-filters';
import { buildSearchIndex } from '@/lib/search-index';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { getAllProducts, getShopProducts, getShopProductBySlug } from '@/lib/products';
import { getPublishedArtists, getShopArtists } from '@/lib/published-artists';
import { computeOrderAmount } from '@/lib/server/order';
import manifest from '@/scripts/artists/patrik-wennerlund-review.json';

afterEach(() => vi.unstubAllEnvs());

describe('unpublished artist preview', () => {
  it('keeps drafts hidden in production even with the local preview switch', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('CATALOGUE_PREVIEW', '1');
    expect(await getShopProductBySlug('storm')).toBeNull();
    expect((await getShopArtists()).some(a => a.id === '10')).toBe(false);
  });

  it('shows only marked drafts on previews and never reactivates retired prints', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const shop = await getShopProducts();
    expect(shop.filter(p => p.artistId === '10').map(p => p.slug)).toEqual(manifest.prints.map(p => p.slug));
    expect(shop.filter(p => p.published === false).every(p => p.artistId === '10')).toBe(true);
    expect((await getShopArtists()).find(a => a.id === '10')?.printCount).toBe(5);
    expect((await getAllProducts()).some(p => p.artistId === '10')).toBe(false);
    expect((await getPublishedArtists()).some(a => a.id === '10')).toBe(false);
  });

  it('refuses preview print IDs at checkout even on a preview deployment', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const draft = await getShopProductBySlug('storm');
    expect(draft?.published).toBe(false);
    await expect(computeOrderAmount([
      { productId: draft!.id, size: '40x60cm', frame: 'wood', quantity: 1 },
    ], 'GBP', 'GB')).rejects.toThrow('Unknown product');
  });

  it('offers one native-ratio size per work and supplies each image', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    for (const print of manifest.prints) {
      const product = await getShopProductBySlug(print.slug);
      expect(product?.name).toBe(print.title);
      expect(Object.keys(product!.prices)).toEqual([print.size]);
      expect(product?.prices[print.size].GBP).toBe(56);
      const [w, h] = print.px;
      const [pw, ph] = print.paper;
      expect(Math.abs(w / h - pw / ph) / (pw / ph)).toBeLessThan(0.01);
      for (const src of [product!.image]) expect(existsSync(`public${src}`), src).toBe(true);
    }
  });
});


describe('photography category visibility and search', () => {
  it('offers the category only where its prints can be viewed', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(availableCategoryLandings(await getShopProducts()).map(c => c.slug)).not.toContain('photography');
    vi.stubEnv('VERCEL_ENV', 'preview');
    const products = await getShopProducts();
    expect(availableCategoryLandings(products).map(c => c.slug)).toContain('photography');
    expect(products.filter(p => p.category === 'Photography')).toHaveLength(5);
  });

  it('keeps unpublished photographs out of the search index even on preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const index = await buildSearchIndex('no');
    expect(searchIndex(index, 'fotografi').prints).toHaveLength(0);
    expect(index.popular.some(link => link.href.endsWith('/category/photography'))).toBe(false);
  });

  it.each(['fotografi', 'FOTOKUNST', '  photography  '])('matches %s equally in the overlay and grid when photographs are available', async query => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const products = await getShopProducts();
    // Exercise matching with available photographs without publishing anything.
    const index: SearchIndex = {
      prints: products.map(p => ({ ...p, artist: p.artist ?? '', href: `/no/product/${p.slug}` })),
      artists: [], stories: [], popular: [],
      productsHref: '/no/products', searchHref: '/no/search', inspireHref: '/no/inspire',
    };
    const overlay = searchIndex(index, query).prints.map(p => p.slug).sort();
    const grid = refineProducts(products, { query, category: 'All', artist: '', size: '', sort: 'featured' }).map(p => p.slug).sort();
    expect(overlay).toHaveLength(5);
    expect(grid).toEqual(overlay);
  });
});
