// Collection landing pages are curated, cross-cutting selections of the catalogue
// (by room, later by style/format) that own query families the category pages
// don't, e.g. "scandinavian living room wall art". Unlike category pages, the
// selection is hand-picked: `productSlugs` lists the prints to feature, in order,
// so we stay in full control of what shows (no thin or accidental grids).
// Shared between app/collection/[slug]/page.tsx, app/sitemap.ts and the /products
// filter row so the three never drift.

export interface Collection {
  slug: string;
  /** Short label for the /products filter chip. */
  chipLabel: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  /** Curated prints, in display order. Must match Product.slug exactly. */
  productSlugs: string[];
  stylingHeading: string;
  stylingTips: string[];
  /** Contextual interlink to a related journal article, if one fits. */
  relatedArticleSlug?: string;
  relatedArticleLabel?: string;
}

export const collections: Collection[] = [
  {
    slug: 'living-room',
    chipLabel: 'Living Room',
    title: 'Scandinavian Living Room Wall Art',
    description:
      'Curated Scandinavian and Nordic wall art for the living room: warm, characterful prints from independent Norwegian artists. Framing options and free UK delivery.',
    heading: 'Scandinavian Wall Art for the Living Room',
    intro:
      'The living room is where a piece of art earns its keep, it sets the tone the moment you walk in. Our Scandinavian and Nordic prints bring warmth and quiet character to the space, from calm botanical landscapes to bold abstracts that anchor a sofa or feature wall. Each is printed to museum quality by independent Norwegian artists, with framing and sizes to suit the room.',
    productSlugs: [
      'tree-top-peach',
      'eltsjoen',
      'vinkveld',
      'hyttefrokost',
      'morgenlevering',
      'birdie-blue',
      'birdie-green',
      'birdie-pink',
      'dancer',
      'swallow-dive',
      'morgenstrekk',
      'slingshot',
    ],
    stylingHeading: 'Styling art in the living room',
    stylingTips: [
      'Hang the centre of your piece at eye level, about 145 to 150 cm from the floor. Above a sofa, leave 15 to 25 cm between the frame and the sofa back.',
      'One large print makes a feature wall; a pair or trio (the Birdie prints sit beautifully together) makes an easy gallery wall.',
      'Warm tones like Tree Top Peach soften a minimalist room, while a bold abstract lifts a calmer palette.',
    ],
    relatedArticleSlug: 'how-to-style-scandinavian-wall-art-living-room',
    relatedArticleLabel: 'How to style Scandinavian wall art in the living room',
  },
];

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find(c => c.slug === slug);
}
