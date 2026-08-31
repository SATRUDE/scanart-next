import { BASE_URL } from '@/lib/site';

/**
 * Absolute URL for a site-relative image path, matching how the product and
 * article pages build their JSON-LD/OG image URLs (new URL(path, BASE_URL)).
 *
 * Empty and externally-hosted images are skipped on purpose. Google's image
 * sitemap documentation allows an image URL on another domain only "as long as
 * you verify both domains in Search Console", and we cannot verify a Vercel
 * Blob host we do not own, so a hotlinked image declared here would simply be
 * ignored. Dropping it is correct; the fix for a dropped image is to bring the
 * file into `public/` rather than to loosen this test.
 */
export function siteImage(src: string | undefined): string | undefined {
  if (!src || /^https?:\/\//i.test(src)) return undefined;
  return new URL(src, BASE_URL).toString();
}

/**
 * The images a product page submits to Google Images: the print itself, plus a
 * distinct secondary shot where one exists, deduped.
 *
 * This lives here rather than inline in `app/sitemap.ts` because two other
 * places have to agree with it: the English and Norwegian product entries, and
 * `licensable-image.test.ts`, which holds the Product JSON-LD to declaring the
 * same pictures. That test used to re-implement this list and left out
 * `siteImage`, so it asserted a sitemap that did not exist and passed green
 * while five products shipped a scene in their JSON-LD and no scene in the
 * sitemap. A guard belongs on the real function, not on a copy of it.
 */
export function productSitemapImages(product: {
  image: string;
  secondaryImage?: string;
}): string[] {
  return [
    ...new Set(
      [siteImage(product.image), siteImage(product.secondaryImage)].filter(
        (u): u is string => Boolean(u)
      )
    ),
  ];
}
