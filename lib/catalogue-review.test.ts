import { availableCategoryLandings } from '@/lib/categories';
import { searchIndex, type SearchIndex } from '@/lib/site-search';
import { refineProducts } from '@/components/v2/shop/shop-filters';
import { buildSearchIndex } from '@/lib/search-index';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { getAllProducts, getShopProducts, getShopProductBySlug } from '@/lib/products';
import { getPublishedArtists, getShopArtists } from '@/lib/published-artists';
import { computeOrderAmount } from '@/lib/server/order';
import { sceneFocus } from '@/lib/scene-focus';
import manifest from '@/scripts/artists/markus-naarttijarvi-review.json';
import patrik from '@/scripts/artists/patrik-wennerlund-review.json';

afterEach(() => vi.unstubAllEnvs());

describe('Markus Naarttijärvi is live', () => {
  it('sells all ten prints in production, with no draft gate involved', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const all = await getAllProducts();
    expect(all.filter(p => p.artistId === '9').map(p => p.slug).sort()).toEqual(manifest.prints.map(p => p.slug).sort());
    expect((await getPublishedArtists()).find(a => a.id === '9')?.printCount).toBe(10);
    expect((await getShopArtists()).find(a => a.id === '9')?.printCount).toBe(10);
  });

  it('keeps Ken’s copy, the approved price in each offered size, and every image and scene focus', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const print of manifest.prints) {
      const product = await getShopProductBySlug(print.slug);
      expect(product?.published).toBe(true);
      expect(product?.name).toBe(print.title);
      expect(product?.description).toBe(print.description);
      const sizes = Object.keys(product!.prices);
      expect(sizes).toHaveLength(1);
      expect(['45x60cm', '40x50cm']).toContain(sizes[0]);
      expect(product!.prices[sizes[0]].GBP).toBe(56);
      for (const src of [product!.image, product!.secondaryImage!, product!.secondaryImage!.replace('.avif', '.webp')]) {
        expect(existsSync(`public${src}`), src).toBe(true);
      }
      expect(sceneFocus(product!.secondaryImage!), print.slug).toBeDefined();
    }
  });

  it('prices a published Markus print at checkout', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const print = await getShopProductBySlug('through-the-willows');
    const order = await computeOrderAmount([
      { productId: print!.id, slug: print!.slug, size: '45x60cm', quantity: 1 },
      { productId: print!.id, slug: print!.slug, size: '45x60cm', frame: 'wood', quantity: 1 },
    ], 'GBP', 'GB');
    // GBP 56 unframed, GBP 56 + 39 framed: the approved prices, unchanged.
    expect(order.subtotal).toBe(56 + 56 + 39);
  });
});

describe('Patrik Wennerlund is live', () => {
  it('sells all five prints in production, with no draft gate involved', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const all = await getAllProducts();
    expect(all.filter(p => p.artistId === '10').map(p => p.slug).sort()).toEqual(patrik.prints.map(p => p.slug).sort());
    expect((await getPublishedArtists()).find(a => a.id === '10')?.printCount).toBe(5);
    expect((await getShopArtists()).find(a => a.id === '10')?.printCount).toBe(5);
  });

  it('offers one native-ratio size per work at the approved price, and supplies each image and scene focus', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    for (const print of patrik.prints) {
      const product = await getShopProductBySlug(print.slug);
      expect(product?.published).toBe(true);
      expect(product?.name).toBe(print.title);
      expect(Object.keys(product!.prices)).toEqual([print.size]);
      // 40 x 60 and the other native sizes sit at the Premium 50 x 70 price (Mark, 6 Oct 2026).
      expect(product?.prices[print.size].GBP).toBe(56);
      const [w, h] = print.px;
      const [pw, ph] = print.paper;
      expect(Math.abs(w / h - pw / ph) / (pw / ph)).toBeLessThan(0.01);
      for (const src of [product!.image, product!.secondaryImage!, product!.secondaryImage!.replace('.avif', '.webp')]) {
        expect(existsSync(`public${src}`), src).toBe(true);
      }
      expect(sceneFocus(product!.secondaryImage!), print.slug).toBeDefined();
    }
  });

  it('prices a published Patrik print at checkout, framed and unframed', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const print = await getShopProductBySlug('storm');
    const order = await computeOrderAmount([
      { productId: print!.id, size: '40x60cm', quantity: 1 },
      { productId: print!.id, size: '40x60cm', frame: 'wood', quantity: 1 },
    ], 'GBP', 'GB');
    // GBP 56 unframed, GBP 56 + 39 framed: the 50 x 70 price and supplement.
    expect(order.subtotal).toBe(56 + 56 + 39);
  });
});

describe('photography category and search', () => {
  it('offers the Photography landing in production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const products = await getShopProducts();
    expect(availableCategoryLandings(products).map(c => c.slug)).toContain('photography');
    expect(products.filter(p => p.category === 'Photography')).toHaveLength(15);
  });

  it.each(['fotografi', 'FOTOKUNST', '  photography  '])('matches %s equally in the overlay and grid', async query => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const products = await getShopProducts();
    const index: SearchIndex = {
      prints: products.map(p => ({ ...p, artist: p.artist || p.brand || '', href: `/no/product/${p.slug}` })),
      artists: [], stories: [], popular: [],
      productsHref: '/no/products', searchHref: '/no/search', inspireHref: '/no/inspire',
    };
    const overlay = searchIndex(index, query).prints.map(p => p.slug).sort();
    const grid = refineProducts(products, { query, category: 'All', artist: '', size: '', sort: 'featured' }).map(p => p.slug).sort();
    expect(overlay).toHaveLength(15);
    expect(grid).toEqual(overlay);
  });

  it('puts the Photography category in the search index', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    const index = await buildSearchIndex('no');
    expect(searchIndex(index, 'fotografi').prints).toHaveLength(15);
  });
});
