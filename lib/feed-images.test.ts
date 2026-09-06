import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { feedAdditionalImages, merchantCenterImagePath } from '@/lib/feed-images';
import { getAllProducts } from '@/lib/products';

describe('merchantCenterImagePath', () => {
  it('passes through a format Merchant Center already accepts', () => {
    expect(merchantCenterImagePath('/images/products/dragon.png')).toBe(
      '/images/products/dragon.png'
    );
    expect(merchantCenterImagePath('/images/products/dragon-scene.webp')).toBe(
      '/images/products/dragon-scene.webp'
    );
  });

  it('points an AVIF scene at its WebP twin, because Merchant Center cannot read AVIF', () => {
    expect(merchantCenterImagePath('/images/products/dragon-scene.avif')).toBe(
      '/images/products/dragon-scene.webp'
    );
  });

  it('keeps the rest of the filename, including capitals', () => {
    // Morgenlevering-scene.avif is the one scene with a capital in its name.
    expect(merchantCenterImagePath('/images/products/Morgenlevering-scene.avif')).toBe(
      '/images/products/Morgenlevering-scene.webp'
    );
  });

  it('offers nothing for an empty value or an extension it has not been taught', () => {
    expect(merchantCenterImagePath(undefined)).toBeUndefined();
    expect(merchantCenterImagePath('   ')).toBeUndefined();
    expect(merchantCenterImagePath('/images/products/dragon-scene.heic')).toBeUndefined();
  });
});

describe('feedAdditionalImages', () => {
  it('returns the scene as an absolute URL', () => {
    expect(
      feedAdditionalImages({
        image: '/images/products/dragon.png',
        secondaryImage: '/images/products/dragon-scene.avif',
      })
    ).toEqual(['https://www.scandinavianart.co.uk/images/products/dragon-scene.webp']);
  });

  it('offers nothing when the secondary image is the primary one', () => {
    expect(
      feedAdditionalImages({
        image: '/images/products/dragon.png',
        secondaryImage: '/images/products/dragon.png',
      })
    ).toEqual([]);
  });

  it('drops an externally-hosted scene, the same way the image sitemap does', () => {
    expect(
      feedAdditionalImages({
        image: '/images/products/dragon.png',
        secondaryImage: 'https://cdn.example.com/scenes/dragon-room.png',
      })
    ).toEqual([]);
  });

  it('offers nothing when there is no secondary image at all', () => {
    expect(feedAdditionalImages({ image: '/images/products/dragon.png' })).toEqual([]);
  });
});

/**
 * The guard that matters. A `g:additional_image_link` naming a file we do not
 * serve is an item-level disapproval in Merchant Center, and nothing in the
 * build would otherwise notice: the feed is generated from a string in the
 * catalogue, so a missing twin produces a perfectly well-formed URL to a 404.
 *
 * `image-format.test.ts` separately holds each of these files to containing the
 * bytes its extension claims, so between the two, a scene cannot reach the feed
 * as a broken or mislabelled image.
 */
describe('every print in the catalogue', () => {
  it('offers exactly one extra image to the feed, and the file is on disk', async () => {
    const products = await getAllProducts();
    expect(products.length).toBeGreaterThan(0);

    const missing: string[] = [];

    for (const product of products) {
      const extra = feedAdditionalImages(product);
      expect(extra, `${product.slug} should offer its room scene to the feed`).toHaveLength(1);

      const path = new URL(extra[0]).pathname;
      if (!existsSync(join(process.cwd(), 'public', path))) {
        missing.push(`${product.slug} -> ${path}`);
      }
    }

    expect(
      missing,
      `these feed images are named but not served, which disapproves the item:\n${missing.join('\n')}`
    ).toEqual([]);
  });
});
