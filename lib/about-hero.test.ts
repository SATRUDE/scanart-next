import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ABOUT_HERO_SLUG, aboutHeroImage, aboutHeroSitemapImages } from '@/lib/about-hero';
import { getAllProducts } from '@/lib/products';

const treeTopPeach = {
  name: 'Tree Top Peach',
  slug: 'tree-top-peach',
  artist: 'Helene Brox',
  category: 'Botanical',
  image: '/images/products/tree-top-peach.png',
  secondaryImage: '/images/products/tree-top-peach-scene.avif',
};

// The pages pass real catalogue rows; these fixtures only need the fields the
// alt vocabulary reads, so they are cast at the call site rather than filled
// out with prices and sizes that play no part in choosing a picture.
const catalogue = (...products: unknown[]) =>
  products as Parameters<typeof aboutHeroImage>[0];

describe('aboutHeroImage', () => {
  it('names the print and its artist rather than describing it generically', () => {
    expect(aboutHeroImage(catalogue(treeTopPeach))).toEqual({
      src: '/images/products/tree-top-peach-scene.avif',
      alt: 'Tree Top Peach by Helene Brox, framed and styled in a room setting',
    });
  });

  it('says the same thing in bokmål on the Norwegian page', () => {
    expect(aboutHeroImage(catalogue(treeTopPeach), 'no')).toEqual({
      src: '/images/products/tree-top-peach-scene.avif',
      alt: 'Tree Top Peach av Helene Brox, innrammet i et nordisk interiør',
    });
  });

  it('falls back to the print itself when it has no styled scene', () => {
    const { src, alt } = aboutHeroImage(
      catalogue({ ...treeTopPeach, secondaryImage: '' })
    );

    expect(src).toBe('/images/products/tree-top-peach.png');
    expect(alt).toBe('Tree Top Peach by Helene Brox, a botanical Scandinavian art print');
  });

  it('still draws a hero when the print is not in the catalogue at all', () => {
    // The page must render; the catalogue test below is what makes sure this
    // branch is never the one production takes.
    const { src, alt } = aboutHeroImage(catalogue());

    expect(src).toBe('/images/products/tree-top-peach-scene.avif');
    expect(alt.length).toBeGreaterThan(0);
  });
});

describe('aboutHeroSitemapImages', () => {
  it('declares the hero as an absolute URL, in the shape the other entries use', () => {
    expect(aboutHeroSitemapImages(catalogue(treeTopPeach))).toEqual({
      images: [
        'https://www.scandinavianart.co.uk/images/products/tree-top-peach-scene.avif',
      ],
    });
  });
});

describe('the /about hero against the real catalogue', () => {
  it('names a print that is still published, so the hero cannot go stale unnoticed', async () => {
    const products = await getAllProducts();
    const hero = products.find(p => p.slug === ABOUT_HERO_SLUG);

    // If this fails, the print on the /about hero has left the catalogue.
    // Retiring an artist has stranded live references on this site before, so
    // pick a replacement in lib/about-hero rather than deleting the assertion.
    expect(hero, `${ABOUT_HERO_SLUG} is no longer in the catalogue`).toBeDefined();
  });

  it('resolves to a file that exists and an alt that names the artist', async () => {
    const products = await getAllProducts();
    const { src, alt } = aboutHeroImage(products);

    expect(existsSync(join(process.cwd(), 'public', src))).toBe(true);
    expect(alt).toContain('Tree Top Peach');
    expect(alt).toContain('Helene Brox');
  });
});
