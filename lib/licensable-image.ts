// Image licence metadata for the print on a product page.
//
// Google's licensable-images feature puts a "Licensable" badge on an image in
// Google Images and a link to the page where you can acquire it. It is built
// for stock libraries, photographers and print sellers, which is us: image
// search is already about half our Google reach (2,395 impressions in the 28
// days to 20 August 2026, against web's 2,619) and it converts at 0.04%,
// because an image result today offers no route to the page that sells the
// thing.
//
// Google's requirements (developers.google.com/search/docs/appearance/
// structured-data/image-license-metadata): `contentUrl` plus at least one of
// `creator`, `creditText`, `copyrightNotice` or `license`. `license` is the
// one that earns the badge itself; the rest make the metadata valid and give
// Google the credit and the acquire link.
//
// This applies to the PRINT image only. See the note on the scene shot below.

import { BASE_URL } from './site';
import { printImageAlt, type ProductImageAltSource } from './product-image-alt';

/**
 * A URL to the page setting out the terms an image may be used under.
 *
 * Deliberately null. Google's own wording is that "you must include the
 * `license` property for your image to be eligible to be shown with the
 * Licensable badge", so this one value is the difference between valid image
 * metadata and the badge. It is not mine to choose: what we sell is a print,
 * not a licence to a file, so whether `/terms` is the honest target or whether
 * it needs a paragraph of its own is Mark's call. Setting this to a path or an
 * absolute URL turns the badge on everywhere, with no other change.
 */
export const IMAGE_LICENCE_URL: string | null = null;

export interface LicensableImageSource extends ProductImageAltSource {
  /** The print itself, site-relative or absolute. */
  image: string;
}

/**
 * The `image` value for a product page's Product JSON-LD.
 *
 * The print is returned as an ImageObject carrying its licence metadata. The
 * styled room shot, where one exists, stays a plain URL on purpose: it is a
 * composite we made from the artist's work, so the artist is not its
 * photographer and we have not established who holds copyright in the
 * composition. Crediting either party would be a guess, and a guess in a
 * copyrightNotice is worse than an absent one. An ImageObject with a
 * contentUrl and none of the four required companions would also be an
 * incomplete one, which Search Console reports; a bare URL is simply an image.
 *
 * Both entries are the same two images `app/sitemap.ts` declares to Google
 * Images for this page, which `licensable-image.test.ts` holds them to.
 */
export function productImageLd(
  product: LicensableImageSource & { secondaryImage?: string },
  pagePath: string
): Array<Record<string, unknown> | string> {
  const absolute = (src: string) => new URL(src, BASE_URL).toString();
  const acquireLicensePage = `${BASE_URL}${pagePath}`;

  const entries: Array<Record<string, unknown> | string> = [
    printImageObject(product, acquireLicensePage),
  ];

  const scene = product.secondaryImage?.trim();
  if (scene && scene !== product.image) {
    entries.push(absolute(scene));
  }

  return entries;
}

function printImageObject(
  product: LicensableImageSource,
  acquireLicensePage: string
): Record<string, unknown> | string {
  const creator = (product.artist || product.brand || '').trim();
  const contentUrl = new URL(product.image, BASE_URL).toString();

  // Without a named artist there is no creator, no credit and no copyright
  // holder we can name, so contentUrl would stand alone and the object would
  // fail Google's "at least one of" rule. Every print in the catalogue has an
  // artist today, and the test says so; this is what happens if one ever does
  // not.
  if (!creator) return contentUrl;

  return {
    '@type': 'ImageObject',
    contentUrl,
    caption: printImageAlt(product),
    creator: { '@type': 'Person', name: creator },
    creditText: creator,
    // The artwork is the artist's; we sell prints of it. No year, because the
    // catalogue does not record when a piece was made and an invented one
    // would be a fabricated fact in a copyright notice.
    copyrightNotice: `© ${creator}`,
    acquireLicensePage,
    ...(IMAGE_LICENCE_URL
      ? { license: new URL(IMAGE_LICENCE_URL, BASE_URL).toString() }
      : {}),
  };
}
