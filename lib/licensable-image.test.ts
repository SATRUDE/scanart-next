import { describe, expect, it } from 'vitest';

import { IMAGE_LICENCE_URL, productImageLd } from './licensable-image';
import { productSitemapImages, siteImage } from './product-sitemap-images';
import { getAllProducts } from './products';
import { BASE_URL } from './site';

const dancer = {
  name: 'Dancer',
  artist: 'Helene Brox',
  category: 'Abstract',
  image: '/images/products/dancer.png',
  secondaryImage: 'https://cdn.example.com/scenes/dancer-room.png',
};

describe('productImageLd', () => {
  it('returns the print as an ImageObject and the scene as a plain URL', () => {
    const [print, scene] = productImageLd(dancer, '/product/dancer');

    expect(print).toMatchObject({
      '@type': 'ImageObject',
      contentUrl: `${BASE_URL}/images/products/dancer.png`,
      creator: { '@type': 'Person', name: 'Helene Brox' },
      creditText: 'Helene Brox',
      copyrightNotice: '© Helene Brox',
      acquireLicensePage: `${BASE_URL}/product/dancer`,
    });
    expect(scene).toBe('https://cdn.example.com/scenes/dancer-room.png');
  });

  it('satisfies Google: contentUrl plus at least one of creator, creditText, copyrightNotice or license', () => {
    const [print] = productImageLd(dancer, '/product/dancer') as [Record<string, unknown>];

    expect(print.contentUrl).toBeTruthy();
    expect(
      ['creator', 'creditText', 'copyrightNotice', 'license'].some(key => key in print)
    ).toBe(true);
  });

  it('omits license until Mark sets one, since that is the property that earns the badge', () => {
    const [print] = productImageLd(dancer, '/product/dancer') as [Record<string, unknown>];

    // If this fails because IMAGE_LICENCE_URL was set on purpose, the assertion
    // to keep is the one below it: whatever the value, it resolves absolute.
    expect(IMAGE_LICENCE_URL).toBeNull();
    expect(print.license).toBeUndefined();
  });

  it('points the acquire link at the page it was rendered on, so /no keeps its own', () => {
    const [print] = productImageLd(dancer, '/no/product/dancer') as [Record<string, unknown>];

    expect(print.acquireLicensePage).toBe(`${BASE_URL}/no/product/dancer`);
  });

  it('captions the image in the language of the page, English by default', () => {
    const [english] = productImageLd(dancer, '/product/dancer') as [Record<string, unknown>];
    const [norwegian] = productImageLd(dancer, '/no/product/dancer', 'no') as [
      Record<string, unknown>,
    ];

    expect(english.caption).toBe('Dancer by Helene Brox, an abstract Scandinavian art print');
    expect(norwegian.caption).toBe(
      'Dancer av Helene Brox, et abstrakt skandinavisk kunsttrykk'
    );
  });

  it('drops to a bare URL rather than emit an ImageObject nobody can be credited for', () => {
    const anonymous = { name: 'Untitled', image: '/images/products/x.png' };

    expect(productImageLd(anonymous, '/product/x')).toEqual([
      `${BASE_URL}/images/products/x.png`,
    ]);
  });

  it('does not repeat the print when a product has no distinct scene shot', () => {
    const single = { ...dancer, secondaryImage: dancer.image };

    expect(productImageLd(single, '/product/dancer')).toHaveLength(1);
  });
});

describe('against the real catalogue', () => {
  it('credits every print, so no product falls back to a bare URL', async () => {
    const products = await getAllProducts();
    expect(products.length).toBeGreaterThan(0);

    const uncredited = products.filter(p => !(p.artist || p.brand)?.trim());
    expect(uncredited.map(p => p.slug)).toEqual([]);
  });

  it('declares exactly the images the sitemap submits to Google Images', async () => {
    const products = await getAllProducts();

    for (const product of products) {
      // Ask the sitemap's own helper rather than re-deriving the list here.
      // The earlier version of this test rebuilt it from `image` and
      // `secondaryImage` directly and so left out `siteImage`, which drops an
      // externally-hosted URL. That made the assertion vacuous for any product
      // whose scene was hotlinked: the JSON-LD declared two images, the sitemap
      // declared one, and this test passed.
      const sitemapImages = productSitemapImages(product);
      const ld = productImageLd(product, `/product/${product.slug}`);

      expect(ld, product.slug).toHaveLength(sitemapImages.length);
    }
  });

  it('serves every catalogue image from our own domain, so the sitemap can declare it', async () => {
    const products = await getAllProducts();

    // Google accepts an image URL on another domain "as long as you verify both
    // domains in Search Console", which we cannot do for a Blob host we do not
    // own. So a hotlinked scene is silently absent from Google Images. Five
    // prints shipped that way between 2026-08-17 and 2026-08-31; this keeps the
    // sixth from happening quietly.
    const hotlinked = products.flatMap(p =>
      [p.image, p.secondaryImage]
        .filter((src): src is string => Boolean(src?.trim()))
        .filter(src => siteImage(src) === undefined)
        .map(src => `${p.slug}: ${src}`)
    );

    expect(hotlinked).toEqual([]);
  });
});
