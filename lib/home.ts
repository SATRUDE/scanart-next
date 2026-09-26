import fs from 'node:fs';
import path from 'node:path';
import type { Product } from '@/contexts/CartContext';
import { getAllProducts, getFeaturedProducts } from '@/lib/products';
import { getAllArticles, type Article } from '@/lib/articles';
import { getPublishedArtists, type PublishedArtist } from '@/lib/published-artists';
import { getProductPrices } from '@/lib/pricing';
import { shopScenes } from '@/lib/shop-scenes';
import { ROOM, wallArtPath, wallChipPath, type WallPrint, type WallId } from '@/components/v2/home/wall/room';

/*
 * The V2 homepage (Figma 12:139 desktop, 184:1470 mobile): its English copy
 * and the data both homepages read. app/(en)/page.tsx and app/(no)/no/page.tsx
 * call getHomeData() and differ only in strings, so the Norwegian homepage
 * mirrors the English one by construction (it used to be a hand-kept copy and
 * drifted: see the hero note below). Norwegian copy: lib/i18n/no.ts, home.
 */

export interface HomeStrings {
  /** The H1 (docs/v2-seo.md item 2, Mark approved): keeps "Scandinavian art",
   *  the homepage's top query, where the design says "Original prints by
   *  Nordic artists." */
  heading: string;
  seePrints: string;
  meetArtists: string;
  /** Names the hero's scrolling row for screen readers. */
  carouselLabel: string;
  newPrints: { heading: string; link: string };
  wall: {
    heading: string;
    inspire: string;
    wallLabel: string;
    printLabel: string;
    seePrint: string;
    walls: Record<WallId, string>;
    wallsInSentence: Record<WallId, string>;
    roomDescription: string;
    stillAlt: string;
  };
  howItWorks: {
    heading: string;
    /** The homepage's "Scandinavian wall art" text link (docs/v2-seo.md,
     *  Homepage links), kept from the old "Explore categories" copy. */
    wallArtBefore: string;
    wallArtLink: string;
    wallArtAfter: string;
    rows: { title: string; body: string }[];
  };
  /** The Statement band. The design's placeholder ("Name Surname, customer in
   *  Oslo") is not a real review, so the band carries the one real customer
   *  quote the homepage has always shown (Testimonials). */
  statement: { quote: string; name: string; location: string };
  artists: {
    heading: string;
    all: string;
    printOne: string;
    printOther: string;
    /** One line about each artist's work, from their bio in data/artists.ts. */
    lines: Record<string, string>;
  };
  journal: { heading: string; all: string; categoryLabels?: Record<string, string> };
  questions: { heading: string; all: string };
  apply: { heading: string; body: string; cta: string };
}

export const homeStrings: HomeStrings = {
  heading: 'Original Scandinavian art, printed to order.',
  seePrints: 'See the prints',
  meetArtists: 'Meet the artists',
  carouselLabel: 'Prints in real rooms',
  newPrints: { heading: 'New prints', link: 'See all prints' },
  wall: {
    heading: 'Start from your wall',
    inspire: 'Be inspired',
    wallLabel: 'Wall',
    printLabel: 'Print',
    seePrint: 'See the print',
    walls: { blue: 'Blue', yellow: 'Yellow', peach: 'Peach', green: 'Green', white: 'White' },
    wallsInSentence: { blue: 'blue', yellow: 'yellow', peach: 'peach', green: 'green', white: 'white' },
    roomDescription: '{print} by {artist}, {size}, framed on a {wall} wall in a home office.',
    stillAlt: 'Dancer by Helene Brox, 50 × 70 cm, framed on a peach wall above a desk in a home office',
  },
  howItWorks: {
    heading: 'How the shop works',
    wallArtBefore: 'Carefully curated ',
    wallArtLink: 'Scandinavian wall art',
    wallArtAfter: ' from talented Nordic artists, bringing authentic minimalism and truly timeless design into your home.',
    rows: [
      { title: 'Chosen, not listed', body: 'Every artist is selected by us. Nobody signs up and uploads; we find the work first.' },
      { title: 'Printed to order', body: 'Each print is made when you order it, so nothing sits in a warehouse and nothing goes to waste.' },
      // The artist's share is not on the public site (Mark, 2026-09-26).
      { title: 'Framed or unframed', body: 'Choose a wood, black or white frame, or order the print on its own.' },
    ],
  },
  statement: {
    // Its first sentence: the band holds a short statement in H1.
    quote: 'I bought a print for my home, and I will definitely buy more in the future.',
    name: 'David Steel',
    location: 'London, England',
  },
  artists: {
    heading: 'The artists',
    all: 'All artists',
    printOne: 'print',
    printOther: 'prints',
    lines: {
      'helene-brox': 'Illustrator, hand letterer and mural painter, and a founding member of the agency Heiaklubben.',
      'simen-wahlqvist': 'Graphic designer and illustrator who catches moments with as few lines as possible.',
      'sia-siamos': 'Half Greek, half Norwegian: still life, food and the quiet details of everyday life.',
      'ingunn-dybendal': 'Illustrator in the Heiaklubben collective, whose work runs from a Google Doodle to a 360 square metre wall.',
      'hedvig-wallin': 'Illustrator from Gothenburg who borrows from naive art: simple shapes, wonky perspective, detail everywhere.',
    },
  },
  journal: { heading: 'Journal', all: 'All stories' },
  questions: { heading: 'Questions', all: 'All help and delivery' },
  apply: {
    heading: 'Are you an artist?',
    body: 'We represent a small number of Nordic artists. Tell us about your work and we will be in touch if it is a fit.',
    cta: 'Apply to be considered',
  },
};

/** The four questions the design asks, as [group, item] in data/help.ts and
 *  no.help.groups (the two lists share their order). */
export const HOME_QUESTIONS: [number, number][] = [
  [1, 1], // How long will my order take?
  [0, 3], // Can I add a frame?
  [1, 0], // Where do you ship?
  [2, 0], // Can I return my order?
];

export interface HomeTile {
  product: Product;
  /** The room scene the tile shows. */
  scene: string;
}

export interface HomeData {
  hero: HomeTile[];
  newPrints: HomeTile[];
  wallPrints: WallPrint[];
  artists: PublishedArtist[];
  articles: Article[];
}

// The design's hero row (Figma 30:222): these four in this order.
const HERO_PICKS = ['rosa-blomster', 'massa-applen', 'dragon', 'dancer'];

// Hero-only override: these prints show their styled room scene in the hero
// rotation, while the product page keeps the clean print. Mark picks the
// scene; add a slug here and drop the file in public/images/homepage.
// vinkveld 2026-08-07, morgenlevering 2026-08-21.
const HERO_SCENES: Record<string, string> = {
  vinkveld: '/images/homepage/vinkveld-scene.jpg',
  morgenlevering: '/images/homepage/morgenlevering-scene.jpg',
};

/** The room scene for a print: Mark's hero pick, the curated shop scene, then the catalogue's. */
function sceneFor(p: Product, hero = false): string {
  return (hero && HERO_SCENES[p.slug]) || shopScenes[p.slug]?.image || p.secondaryImage || p.image;
}

/** '50x70cm' → '50 × 70 cm'. PrintCard has the same helper, but it is a client
 *  module, and a server module cannot call into one. */
const sizeLabel = (size: string) => size.replace(/^(\d+)x(\d+)cm$/i, '$1 × $2 cm');

/** When each print was added, from the catalogue snapshot (Product has no date). */
function createdTimes(): Record<string, string> {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'notion-data', 'products.json'), 'utf-8')) as { slug: string; created_time?: string }[];
    return Object.fromEntries(raw.map(p => [p.slug, p.created_time ?? '']));
  } catch {
    return {};
  }
}

export async function getHomeData(localePrefix: '' | '/no' = ''): Promise<HomeData> {
  const all = await getAllProducts();
  const bySlug = new Map(all.map(p => [p.slug, p]));

  // Hero: the design's four, then the Featured prints (the Notion checkbox the
  // old hero was built from), so every print the homepage has linked from its
  // first screen is still linked from it (docs/v2-seo.md, Homepage links).
  //
  // The scene goes in `secondaryImage`, the slot a tile displays, and the print
  // stays in `image`. It used to go in both slots on /no, so the print and the
  // scene were the same file and nothing downstream could tell them apart: the
  // alt text described a bare print over a photo of a styled room (the known
  // issue in docs/v2-seo.md). Both homepages now read this one list.
  const featured = await getFeaturedProducts();
  const heroProducts = [
    ...HERO_PICKS.map(s => bySlug.get(s)).filter((p): p is Product => !!p),
    ...featured.filter(p => !HERO_PICKS.includes(p.slug)),
  ];
  const hero = heroProducts.map(p => {
    const scene = sceneFor(p, true);
    return { product: { ...p, secondaryImage: scene }, scene };
  });

  // New prints: the three most recently added that the hero does not already show.
  const created = createdTimes();
  const inHero = new Set(heroProducts.map(p => p.slug));
  const newPrints = all
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !inHero.has(p.slug))
    .sort((a, b) => (created[b.p.slug] ?? '').localeCompare(created[a.p.slug] ?? '') || a.i - b.i)
    .slice(0, 3)
    .map(({ p }) => ({ product: { ...p, secondaryImage: sceneFor(p) }, scene: sceneFor(p) }));

  // Start from your wall: every print sold at the room frame's size that has
  // its artwork crop (public/images/v2/wall/prints). A new print without a crop
  // is left out rather than hung as a blank; cropping one is build/prebuild.py's
  // art_box in the wall-match prototype.
  const size = ROOM.slot.size;
  const wallPrints = all
    .filter(p => p.sizes?.[size] && fs.existsSync(path.join(process.cwd(), 'public', wallArtPath(p.slug))))
    .map(p => ({
      slug: p.slug,
      name: p.name,
      artist: p.artist || p.brand,
      size: sizeLabel(size),
      prices: getProductPrices(p, size),
      art: wallArtPath(p.slug),
      chip: wallChipPath(p.slug),
      href: `${localePrefix}/product/${p.slug}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Featured articles first (the Featured checkbox in Notion curates this
  // teaser), newest fill the remaining slots. Keeps a stable homepage link to
  // the pages we want search to treat as canonical for their topic, e.g. the
  // books pillar, which the homepage was cannibalising in search results.
  const allArticles = await getAllArticles();
  const articles = [...allArticles.filter(a => a.featured), ...allArticles.filter(a => !a.featured)].slice(0, 3);

  // Most prints first. Ties keep roster order (sort is stable), so the artist
  // who has been with the gallery longer holds the slot: Mark's call on 7 Sep
  // 2026 when Hedvig Wallin arrived with four prints and would otherwise have
  // displaced Sia Siamos, whom he had just put on the homepage, on alphabet.
  const artists = await getPublishedArtists();

  return { hero, newPrints, wallPrints, artists, articles };
}
