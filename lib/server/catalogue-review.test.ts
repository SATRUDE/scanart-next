import fs from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogueReviewEnabled, getCatalogueReview } from './catalogue-review';
import { getAllProducts, getProductBySlug, getShopProducts, getShopProductBySlug, getShopProductsByArtist, getShopProductsByCategory } from '@/lib/products';
import { priceCategories } from '@/config/priceCategories';
import { computeOrderAmount } from './order';
import { GET as productFeed } from '@/app/product-feed.xml/route';
import sitemap from '@/app/sitemap';

vi.mock('@/lib/articles', () => ({ getAllArticles: async () => [] }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('catalogue review boundary', () => {
  it('allows Vercel preview, and only explicitly opted-in local development', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(catalogueReviewEnabled()).toBe(true);
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CATALOGUE_PREVIEW', '');
    expect(catalogueReviewEnabled()).toBe(false);
    vi.stubEnv('CATALOGUE_PREVIEW', '1');
    expect(catalogueReviewEnabled()).toBe(true);
  });

  it('refuses production even when the local flag is accidentally configured', async () => {
    vi.stubEnv('CATALOGUE_PREVIEW', '1');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL_ENV', 'production');
    const read = vi.spyOn(fs, 'readFile');
    expect(await getCatalogueReview()).toEqual([]);
    expect(read).not.toHaveBeenCalled();
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(catalogueReviewEnabled()).toBe(false);
  });

  it('previews selected unpriced drafts without making them public or orderable', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const draft = {
      id: 'draft-source', productId: '29', name: 'Review print', slug: 'review-print',
      artist: 'Review artist', artistId: '8', published: false, review: true,
      description: 'Unpublished work.', category: 'Illustrations',
      image: '/images/products/review-print.png', availableSizes: null, priceCategory: null,
    };
    const live = {
      ...draft, id: 'live-source', productId: '1', name: 'Published print', slug: 'published-print',
      image: '/images/products/published-print.png',
      published: true, availableSizes: ['50x70cm'], priceCategory: 'Premium',
    };
    const retired = { ...draft, slug: 'retired-print', review: false };
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([draft, live, retired]));
    expect(await getCatalogueReview()).toEqual([draft]);
    expect((await getAllProducts()).map(product => product.slug)).toEqual(['published-print']);
    expect(await getProductBySlug('review-print')).toBeNull();
    const xml = await (await productFeed()).text();
    expect(xml).toContain('<g:id>published-print</g:id>');
    expect(xml).not.toContain('review-print');
    expect((await sitemap()).some(entry => entry.url.includes('review-print'))).toBe(false);
    const discount = vi.fn();
    const delivery = vi.fn();
    await expect(computeOrderAmount([{ productId: '29', quantity: 1 }], 'GBP', 'GB', undefined, discount, delivery))
      .rejects.toThrow('Unknown product: 29');
    expect(discount).not.toHaveBeenCalled();
    expect(delivery).not.toHaveBeenCalled();
  });

  it('shows fully priced drafts only in shop preview, never in orders, feed or sitemap', async () => {
    const draft = {
      id: 'draft-source', productId: '29', name: 'Review print', slug: 'review-print',
      artist: 'Review artist', artistId: '8', published: false, review: true,
      description: 'Unpublished work.', category: 'Illustrations', inStock: false,
      image: '/images/products/review-print.png', availableSizes: ['A2'], priceCategory: 'Premium',
    };
    const live = { ...draft, id: 'live-source', productId: '1', slug: 'live-print', published: true, artistId: '1', image: '/images/products/live-print.png' };
    const retired = { ...draft, slug: 'retired-print', review: false };
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([draft, live, retired]));
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect((await getShopProducts()).map(product => product.slug)).toEqual(['review-print', 'live-print']);
    const shown = await getShopProductBySlug('review-print');
    expect(shown?.prices.A2).toEqual(priceCategories.Premium.A2);
    expect(shown?.published).toBe(false);
    expect((await getShopProductsByArtist('8')).map(product => product.slug)).toEqual(['review-print']);
    expect((await getShopProductsByCategory('Illustrations')).length).toBe(2);
    expect((await getAllProducts()).map(product => product.slug)).toEqual(['live-print']);
    expect(await getProductBySlug('review-print')).toBeNull();
    expect(await (await productFeed()).text()).not.toContain('review-print');
    expect((await sitemap()).some(entry => entry.url.includes('review-print'))).toBe(false);
    await expect(computeOrderAmount([{ productId: '29', size: 'A2', frame: 'wood', quantity: 1 }], 'GBP', 'GB'))
      .rejects.toThrow('Unknown product: 29');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('CATALOGUE_PREVIEW', '1');
    expect((await getShopProducts()).map(product => product.slug)).toEqual(['live-print']);
    expect(await getShopProductBySlug('review-print')).toBeNull();
    expect(await getShopProductsByArtist('8')).toEqual([]);
  });
});
