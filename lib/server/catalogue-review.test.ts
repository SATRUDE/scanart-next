import fs from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogueReviewEnabled, getCatalogueReview } from './catalogue-review';
import { getAllProducts, getProductBySlug } from '@/lib/products';
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
});
