import type { Product } from '@/contexts/CartContext';
import { productImages, type AltLocale } from '@/lib/product-image-alt';
import { siteImage } from '@/lib/product-sitemap-images';

/**
 * The /about hero is not a stock interior shot. It is a real print from the
 * catalogue, photographed framed in a room, and both about pages have carried
 * it since the page shipped.
 *
 * It was hardcoded twice, as a path string with a generic alt ("A framed
 * Scandinavian art print in a light Nordic interior"), so the page showed one
 * of our artists' work without naming her, in the two places that describe an
 * image to anyone who cannot see it: the alt text a screen reader announces,
 * and the alt text Google Images ranks on. /about is our second-biggest
 * image-search surface at 275 image impressions in the 28 days to 2026-09-06,
 * and it was describing a Helene Brox print as "a framed Scandinavian art
 * print".
 *
 * Naming the slug here and resolving the rest from the catalogue fixes both
 * halves at once: the alt comes from `productImages`, the same function that
 * describes this exact picture on /product/tree-top-peach, so the two can never
 * disagree; and `about-hero.test.ts` fails the build if the print ever leaves
 * the catalogue, which is the drift a hardcoded path cannot notice. Retiring an
 * artist has already stranded live references on this site once.
 */
export const ABOUT_HERO_SLUG = 'tree-top-peach';

/**
 * What the hero renders if the catalogue cannot be read or the print is gone.
 * The page must still draw its hero, so this degrades rather than throwing; the
 * test is what makes sure it is never reached in practice.
 */
const FALLBACK: Record<AltLocale, AboutHeroImage> = {
  en: {
    src: '/images/products/tree-top-peach-scene.avif',
    alt: 'A framed Scandinavian art print in a light Nordic interior',
  },
  no: {
    src: '/images/products/tree-top-peach-scene.avif',
    alt: 'Et innrammet skandinavisk kunsttrykk i et lyst, nordisk interiør',
  },
};

export interface AboutHeroImage {
  src: string;
  alt: string;
}

/**
 * The hero picture for /about and /no/about: the styled room scene where the
 * print has one, the print itself otherwise.
 *
 * It reads the answer out of `productImages` rather than re-testing
 * `secondaryImage`, so the "is there a real second image" rule stays in the one
 * place that owns it, and the alt matches what the product page says about the
 * same file.
 */
export function aboutHeroImage(
  products: Product[],
  locale: AltLocale = 'en'
): AboutHeroImage {
  const product = products.find(p => p.slug === ABOUT_HERO_SLUG);
  if (!product) return FALLBACK[locale];

  const images = productImages(product, locale);
  const shown = images[images.length - 1];

  return { src: shown.src, alt: shown.alt };
}

/**
 * The `images` field for the /about and /no/about sitemap entries, in the shape
 * the other entries use: `{ images }` when there is one to declare, `{}` when
 * there is not.
 *
 * Both about pages render the same picture, so both entries declare it, exactly
 * as the Norwegian product entries repeat their English twin's images. It goes
 * through `siteImage` for the same reason everything else does: an absolute URL
 * on a domain we have verified, or nothing.
 */
export function aboutHeroSitemapImages(
  products: Product[]
): { images?: string[] } {
  const url = siteImage(aboutHeroImage(products).src);

  return url ? { images: [url] } : {};
}
