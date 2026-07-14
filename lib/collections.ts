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
  /** Optional illustrated version of the styling tips (label + tip + image). When
   *  present, the collection page renders image cards instead of the plain list. */
  stylingCards?: { label: string; tip: string; image: string; alt: string }[];
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
      'Curated Scandinavian and Nordic wall art for the living room: warm, characterful prints from independent Norwegian artists. Framing options and worldwide delivery.',
    heading: 'Scandinavian Wall Art for the Living Room',
    intro:
      'The living room sets the tone the moment you walk in, so the wall is worth a piece with real presence. Our Scandinavian and Nordic prints run from calm botanical landscapes to bold, colourful abstracts, work that can anchor a sofa or carry a feature wall on its own. All are printed to museum quality by the independent Norwegian artists behind the gallery.',
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
      'Hang the centre of the piece at eye level, roughly 145 to 150 cm off the floor. Above a sofa, leave 15 to 25 cm between the frame and the sofa back.',
      'One large print makes a feature wall; a pair or trio (the Birdie prints sit well together) makes an easy gallery wall.',
      'Warm tones like Tree Top Peach soften a minimalist room, while a bold abstract lifts a calmer palette.',
    ],
    stylingCards: [
      {
        label: 'Height',
        tip: 'Hang the centre of the piece at eye level, roughly 145 to 150 cm off the floor. Above a sofa, leave 15 to 25 cm between the frame and the sofa back.',
        image: '/images/collections/living-room-height.jpg',
        alt: 'Framed prints hung on the wall above a green sofa',
      },
      {
        label: 'Grouping',
        tip: 'One large print makes a feature wall; a pair or trio (the Birdie prints sit well together) makes an easy gallery wall.',
        image: '/images/collections/living-room-grouping.jpg',
        alt: 'A pair of framed prints hung side by side above a sideboard',
      },
      {
        label: 'Tone',
        tip: 'Warm tones like Tree Top Peach soften a minimalist room, while a bold abstract lifts a calmer palette.',
        image: '/images/collections/living-room-tone.jpg',
        alt: 'A single bold red print in a calm, neutral room',
      },
    ],
    relatedArticleSlug: 'how-to-style-scandinavian-wall-art-living-room',
    relatedArticleLabel: 'How to style Scandinavian wall art in the living room',
  },
  {
    slug: 'bedroom',
    chipLabel: 'Bedroom',
    title: 'Scandinavian Bedroom Wall Art',
    description:
      'Calm Scandinavian and Nordic wall art for the bedroom: restful botanicals and soft abstracts from independent Norwegian artists. Framing options and worldwide delivery.',
    heading: 'Scandinavian Wall Art for the Bedroom',
    intro:
      'The bedroom asks for calm, and these prints lean into it. Restful botanicals, soft landscapes and quiet abstracts in gentle palettes, chosen to help the room wind down rather than compete with it. Every piece is made to order and finished to museum standard, with sizes to suit the wall above a bed or a quiet reading corner.',
    productSlugs: [
      'eltsjoen',
      'trysilkaffe',
      'tree-top-peach',
      'morgenlevering',
      'hyttefrokost',
      'hummer-og-vin',
      'ithinkithink',
      'swallow-dive',
      'vinkveld',
      'birdie-blue',
      'birdie-green',
    ],
    stylingHeading: 'Styling art in the bedroom',
    stylingTips: [
      'Centre a piece over the bed, about 15 to 20 cm above the headboard, and keep it within the width of the bed so it feels anchored.',
      'Softer, cooler tones settle a bedroom. Save the boldest pieces for the rooms you pass through, not the ones you rest in.',
      'A wide single print suits the space above a headboard; a matching pair works either side of the bed or above bedside tables.',
    ],
    stylingCards: [
      {
        label: 'Placement',
        tip: 'Centre a piece over the bed, about 15 to 20 cm above the headboard, and keep it within the width of the bed so it feels anchored.',
        image: '/images/collections/bedroom-placement.jpg',
        alt: 'A framed print on the wall beside a made bed',
      },
      {
        label: 'Palette',
        tip: 'Softer, cooler tones settle a bedroom. Save the boldest pieces for the rooms you pass through, not the ones you rest in.',
        image: '/images/collections/bedroom-palette.jpg',
        alt: 'A single framed print in a calm, green-toned bedroom',
      },
      {
        label: 'Pairing',
        tip: 'A wide single print suits the space above a headboard; a matching pair works either side of the bed or above bedside tables.',
        image: '/images/collections/bedroom-pairing.jpg',
        alt: 'A pair of framed prints on the wall above a bed',
      },
    ],
    relatedArticleSlug: 'complete-guide-choosing-print-sizes',
    relatedArticleLabel: 'A complete guide to choosing print sizes',
  },
  {
    slug: 'home-office',
    chipLabel: 'Home Office',
    title: 'Scandinavian Home Office Wall Art',
    description:
      'Scandinavian and Nordic wall art for the home office: characterful illustrations and bold abstracts from independent Norwegian artists. Framing options and worldwide delivery.',
    heading: 'Scandinavian Wall Art for the Home Office',
    intro:
      'A good home office holds your interest without stealing your focus. These prints bring some personality to the desk wall: characterful, hand-drawn illustrations and bold abstracts with enough energy to carry a working day. All are produced to museum quality, in sizes from a single desk print to a full wall behind you on calls.',
    productSlugs: [
      'eye-nose-eye',
      'half-man',
      'mean-snothing',
      'morgenstrekk',
      'slingshot',
      'dragon',
      'dancer',
      'birdie-blue',
      'birdie-pink',
      'ithinkithink',
      'swallow-dive',
    ],
    stylingHeading: 'Styling art in the home office',
    stylingTips: [
      'Hang a piece in your eyeline from the desk, at or just above screen height, so it gives you something when you look up.',
      'A small grid of illustrations suits a narrow desk wall; one bold abstract holds a larger space behind you on calls.',
      'Graphic, characterful pieces keep a workspace from feeling flat. Save the calmest botanicals for the rooms you relax in.',
    ],
    stylingCards: [
      {
        label: 'Sightline',
        tip: 'Hang a piece in your eyeline from the desk, at or just above screen height, so it gives you something when you look up.',
        image: '/images/collections/office-sightline.jpg',
        alt: 'A framed print hung at eye level above a home-office desk',
      },
      {
        label: 'Layout',
        tip: 'A small grid of illustrations suits a narrow desk wall; one bold abstract holds a larger space behind you on calls.',
        image: '/images/collections/office-layout.jpg',
        alt: 'A pair of framed prints above a home-office desk',
      },
      {
        label: 'Character',
        tip: 'Graphic, characterful pieces keep a workspace from feeling flat. Save the calmest botanicals for the rooms you relax in.',
        image: '/images/collections/office-character.jpg',
        alt: 'A bold graphic print above a home-office desk',
      },
    ],
    relatedArticleSlug: 'the-art-of-choosing-art-comprehensive-guide',
    relatedArticleLabel: 'The art of choosing art: a comprehensive guide',
  },
];

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find(c => c.slug === slug);
}
