// Alt text for the images on a product page.
//
// These are the images app/sitemap.ts submits to Google Images as
// <image:image> entries, and the ones a screen reader announces on the page
// where someone decides to buy. Both audiences want to know what the picture
// shows; neither is helped by its position in the gallery.
//
// Everything here is derived from catalogue fields we already hold (name,
// artist, category) rather than written per print, so a new print gets sensible
// alt text the moment it lands in products.json.

/**
 * The catalogue's `category` values are plural nouns used as page headings
 * ("Illustrations"), which don't read as adjectives in a sentence. This maps
 * each to the word that does. An unmapped category simply drops out of the
 * description rather than guessing.
 */
const CATEGORY_ADJECTIVE: Record<string, string> = {
  Abstract: 'abstract',
  Botanical: 'botanical',
  Illustrations: 'illustrated',
};

function indefiniteArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

export interface ProductImageAltSource {
  name: string;
  /** The artist's name; falls back to `brand`, and both may be empty. */
  artist?: string;
  brand?: string;
  category?: string;
}

/**
 * "Birdie Brown by Renate Thor, an abstract Scandinavian art print"
 *
 * Degrades cleanly: an unknown category drops the adjective, and a print with
 * neither artist nor brand drops the attribution.
 */
export function printImageAlt(product: ProductImageAltSource): string {
  const creator = (product.artist || product.brand || '').trim();
  const adjective = product.category ? CATEGORY_ADJECTIVE[product.category] : undefined;

  const subject = creator ? `${product.name} by ${creator}` : product.name;
  const description = adjective
    ? `${adjective} Scandinavian art print`
    : 'Scandinavian art print';

  return `${subject}, ${indefiniteArticle(description)} ${description}`;
}

/**
 * "Birdie Brown by Renate Thor, framed and styled in a room setting"
 *
 * The secondary shot is always a styled interior rather than the print on its
 * own, so it says so: that distinction is the reason the second image exists.
 */
export function sceneImageAlt(product: ProductImageAltSource): string {
  const creator = (product.artist || product.brand || '').trim();
  const subject = creator ? `${product.name} by ${creator}` : product.name;

  return `${subject}, framed and styled in a room setting`;
}

export interface ProductImage {
  src: string;
  alt: string;
}

/**
 * The gallery's images in display order: the print itself first, then the
 * styled scene where one exists and differs from the print.
 */
export function productImages(
  product: ProductImageAltSource & { image: string; secondaryImage?: string }
): ProductImage[] {
  const images: ProductImage[] = [{ src: product.image, alt: printImageAlt(product) }];

  const secondary = product.secondaryImage?.trim();
  if (secondary && secondary !== product.image) {
    images.push({ src: secondary, alt: sceneImageAlt(product) });
  }

  return images;
}
