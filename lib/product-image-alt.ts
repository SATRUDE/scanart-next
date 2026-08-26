// Alt text for the images on a product page, in either language the shop
// speaks.
//
// These are the images app/sitemap.ts submits to Google Images as
// <image:image> entries, and the ones a screen reader announces on the page
// where someone decides to buy. Both audiences want to know what the picture
// shows; neither is helped by its position in the gallery.
//
// Everything here is derived from catalogue fields we already hold (name,
// artist, category) rather than written per print, so a new print gets sensible
// alt text the moment it lands in products.json.
//
// WHY THE NORWEGIAN LIVES HERE AND NOT IN lib/i18n/no.ts, where the rest of
// the /no copy lives: that dictionary is a thousand lines imported only by
// server components under app/no/, on purpose, so none of it reaches the
// browser. PrintCard is a client component and renders on every grid in both
// languages, so importing the dictionary from here would pull the whole thing
// into the client bundle for one phrase. Two short vocabularies side by side
// cost nothing and keep the pairing visible.

/** The languages the shop renders. Matches the /no URL prefix, not a locale code. */
export type AltLocale = 'en' | 'no';

interface AltVocabulary {
  /** Joins the work to its maker: "Dragon by Helene Brox" / "Dragon av ...". */
  by: string;
  /**
   * The catalogue's `category` values are plural nouns used as page headings
   * ("Illustrations"), which don't read as adjectives in a sentence. This maps
   * each to the word that does. An unmapped category simply drops out of the
   * description rather than guessing.
   */
  adjectives: Record<string, string>;
  /** "an abstract Scandinavian art print" / "et abstrakt skandinavisk kunsttrykk" */
  describe: (adjective: string | undefined) => string;
  /** What the styled second shot is: said in full, because that is its point. */
  scene: string;
}

function indefiniteArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

const VOCABULARY: Record<AltLocale, AltVocabulary> = {
  en: {
    by: 'by',
    adjectives: {
      Abstract: 'abstract',
      Botanical: 'botanical',
      Illustrations: 'illustrated',
    },
    describe: adjective => {
      const description = adjective
        ? `${adjective} Scandinavian art print`
        : 'Scandinavian art print';
      return `${indefiniteArticle(description)} ${description}`;
    },
    scene: 'framed and styled in a room setting',
  },
  no: {
    by: 'av',
    // Neuter singular, because they agree with "kunsttrykk". Norwegian needs no
    // a/an choice: the article is always "et" here.
    adjectives: {
      Abstract: 'abstrakt',
      Botanical: 'botanisk',
      Illustrations: 'illustrert',
    },
    describe: adjective =>
      adjective ? `et ${adjective} skandinavisk kunsttrykk` : 'et skandinavisk kunsttrykk',
    // Matches the hand-written Norwegian alt text already on the site
    // ("Et innrammet skandinavisk kunsttrykk i et lyst, nordisk interiør").
    scene: 'innrammet i et nordisk interiør',
  },
};

export interface ProductImageAltSource {
  name: string;
  /** The artist's name; falls back to `brand`, and both may be empty. */
  artist?: string;
  brand?: string;
  category?: string;
}

function subjectOf(product: ProductImageAltSource, vocabulary: AltVocabulary): string {
  const creator = (product.artist || product.brand || '').trim();
  return creator ? `${product.name} ${vocabulary.by} ${creator}` : product.name;
}

/**
 * "Birdie Brown by Renate Thor, an abstract Scandinavian art print"
 * "Birdie Brown av Renate Thor, et abstrakt skandinavisk kunsttrykk"
 *
 * Degrades cleanly: an unknown category drops the adjective, and a print with
 * neither artist nor brand drops the attribution.
 */
export function printImageAlt(
  product: ProductImageAltSource,
  locale: AltLocale = 'en'
): string {
  const vocabulary = VOCABULARY[locale];
  const adjective = product.category ? vocabulary.adjectives[product.category] : undefined;

  return `${subjectOf(product, vocabulary)}, ${vocabulary.describe(adjective)}`;
}

/**
 * "Birdie Brown by Renate Thor, framed and styled in a room setting"
 * "Birdie Brown av Renate Thor, innrammet i et nordisk interiør"
 *
 * The secondary shot is always a styled interior rather than the print on its
 * own, so it says so: that distinction is the reason the second image exists.
 */
export function sceneImageAlt(
  product: ProductImageAltSource,
  locale: AltLocale = 'en'
): string {
  const vocabulary = VOCABULARY[locale];

  return `${subjectOf(product, vocabulary)}, ${vocabulary.scene}`;
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
  product: ProductImageAltSource & { image: string; secondaryImage?: string },
  locale: AltLocale = 'en'
): ProductImage[] {
  const images: ProductImage[] = [
    { src: product.image, alt: printImageAlt(product, locale) },
  ];

  const secondary = product.secondaryImage?.trim();
  if (secondary && secondary !== product.image) {
    images.push({ src: secondary, alt: sceneImageAlt(product, locale) });
  }

  return images;
}

/**
 * The alt text for a surface that shows the styled scene where a print has one
 * and the print itself otherwise: what `SmartImage` renders when it is passed
 * `useSecondary`, as the homepage hero does.
 *
 * It reads the answer out of `productImages` rather than re-testing
 * `secondaryImage`, so the "is there a real second image" rule stays in one
 * place. The order is print-then-scene, so the last entry is the one shown.
 */
export function secondaryFirstImageAlt(
  product: ProductImageAltSource & { image: string; secondaryImage?: string },
  locale: AltLocale = 'en'
): string {
  const images = productImages(product, locale);

  return images[images.length - 1].alt;
}
