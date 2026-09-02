// Phase 1 of the Norwegian site: types, path helpers and the small
// "chrome" dictionaries (header, footer, first-visit banner) that client
// components need on every page. The full Norwegian page dictionary lives in
// lib/i18n/no.ts and is only imported by the server-rendered /no pages, so
// none of that copy ships in the shared client bundle.
//
// English pages keep their strings inline (component defaults), so EN output
// is byte-identical with zero prop changes; the Norwegian strings here are the
// overrides the chrome swaps in under /no.

export type Locale = 'en' | 'no';

/** True when the path is inside the Norwegian tree. */
export function isNoPath(pathname: string): boolean {
  return pathname === '/no' || pathname.startsWith('/no/');
}

/**
 * The /no twin of an English path, where one exists, else null.
 * Category, artist and collection slugs are not validated here: the Norwegian
 * routes use the same generateStaticParams and data sources as the English
 * ones, so every English category/artist/collection page that renders has a
 * Norwegian twin by construction. Collections joined in phase 2 (2026-08-21).
 */
export function noPathFor(pathname: string): string | null {
  if (pathname === '/') return '/no';
  // Not covered by the pattern below: the two-segment pages under /artists.
  // Without these the language control offers a Norwegian reader nothing at
  // all on the English page, which is how /artists/how-it-works shipped on
  // 30 Aug. The twin existed and was live; nothing on the English page could
  // reach it, because this function is an allowlist and the route was not on
  // it. lib/i18n-no.test.ts now fails if a /no page is ever missing from here.
  if (pathname === '/artists/apply') return '/no/artists/apply';
  if (pathname === '/artists/how-it-works') return '/no/artists/how-it-works';
  if (/^\/(about|delivery|help|artists)$/.test(pathname)) return `/no${pathname}`;
  if (/^\/(category|artist|collection)\/[^/]+$/.test(pathname)) return `/no${pathname}`;
  return null;
}

/**
 * The English twin of a /no path (the inverse of noPathFor). Undefined input
 * or a /no path with no clean twin falls back to the English homepage.
 */
export function enPathFor(noPathname: string): string {
  if (noPathname === '/no') return '/';
  if (noPathname.startsWith('/no/')) return noPathname.slice(3);
  return '/';
}

/**
 * hreflang alternates for a translated EN/NO pair, for Metadata.alternates.
 * `enPath` is the English page ('/' for the homepage); the Norwegian page is
 * always the /no-prefixed twin. English is the x-default.
 */
export function hreflangPair(enPath: string): Record<string, string> {
  const noPath = enPath === '/' ? '/no' : `/no${enPath}`;
  return { en: enPath, no: noPath, 'x-default': enPath };
}

// ---------------------------------------------------------------------------
// Chrome strings (Header / Footer / banner), needed by client components.
// ---------------------------------------------------------------------------

export interface HeaderStrings {
  announcement: string;
  nav: {
    prints: string;
    inspire: string;
    journal: string;
    artists: string;
    about: string;
    help: string;
    shopAll: string;
  };
  categoriesLabel: string;
  moreLabel: string;
  sendEmail: string;
  searchPlaceholder: string;
  aria: {
    search: string;
    openCart: string;
    openMenu: string;
    closeSearch: string;
    navMenuTitle: string;
    navMenuDescription: string;
  };
  /** Catalogue category value (e.g. "Botanical") -> visible label. */
  categoryLabels: Record<string, string>;
}

export interface FooterStrings {
  tagline: string;
  /** Category landing slug -> visible label. */
  categoryLabels: Record<string, string>;
  /** Collection landing slug -> visible label. */
  collectionLabels: Record<string, string>;
  wallArt: string;
  /**
   * The /nordic-art landing. Rendered on the English branch only, because that
   * page has no Norwegian twin; the Norwegian value is carried anyway so the
   * link needs no new copy on the day one ships.
   */
  nordicArt: string;
  about: string;
  inspire: string;
  journal: string;
  artists: string;
  help: string;
  /** Footer link to /feedback: the intercept's permanent re-entry route. */
  feedback: string;
  newsletter: string;
  shopAll: string;
  sendEmail: string;
  privacy: string;
  terms: string;
  delivery: string;
}


// English chrome: must match the literals the components previously hardcoded,
// so English pages render identically.
export const headerStrings: Record<Locale, HeaderStrings> = {
  en: {
    announcement: 'From Scandinavian Artists, delivered worldwide',
    nav: {
      prints: 'Prints',
      inspire: 'Inspire',
      journal: 'Journal',
      artists: 'Artists',
      about: 'About',
      help: 'Help',
      shopAll: 'Shop All',
    },
    categoriesLabel: 'Categories',
    moreLabel: 'More',
    sendEmail: 'Send Email',
    searchPlaceholder: 'Search artwork...',
    aria: {
      search: 'Search',
      openCart: 'Open cart',
      openMenu: 'Open menu',
      closeSearch: 'Close search',
      navMenuTitle: 'Navigation Menu',
      navMenuDescription: 'Mobile navigation menu',
    },
    categoryLabels: {},
  },
  no: {
    announcement: 'Fra skandinaviske kunstnere, levert til hele verden',
    nav: {
      prints: 'Trykk',
      inspire: 'Inspirasjon',
      journal: 'Journal',
      artists: 'Kunstnere',
      about: 'Om oss',
      help: 'Hjelp',
      shopAll: 'Alle trykk',
    },
    categoriesLabel: 'Kategorier',
    moreLabel: 'Mer',
    sendEmail: 'Send e-post',
    searchPlaceholder: 'Søk etter kunst...',
    aria: {
      search: 'Søk',
      openCart: 'Åpne handlekurven',
      openMenu: 'Åpne menyen',
      closeSearch: 'Lukk søket',
      navMenuTitle: 'Navigasjonsmeny',
      navMenuDescription: 'Mobil navigasjonsmeny',
    },
    categoryLabels: {
      Botanical: 'Botanisk',
      Abstract: 'Abstrakt',
      Illustrations: 'Illustrasjoner',
    },
  },
};

/**
 * Accessible names for the icon-only controls, which carry no visible words and
 * so were invisible to every pass that looked at the Norwegian pages.
 *
 * The chrome above was translated in phase 1 and these were missed, which left
 * a Norwegian screen-reader user hearing "Decrease quantity" and "Next image"
 * on the buying path: in the basket, and on every /no/product gallery. The
 * visible copy on those controls is fine because there is none.
 *
 * Interpolated labels keep the variable part out of the dictionary (the print's
 * name, the currency code), so these stay plain strings like the rest.
 */
export interface ChromeAriaStrings {
  cart: {
    /** Prefixed to the print's name: "Remove Dragon" / "Fjern Dragon". */
    removePrefix: string;
    decreaseQuantity: string;
    increaseQuantity: string;
  };
  gallery: {
    previousImage: string;
    nextImage: string;
    closeViewer: string;
  };
  /** The homepage strip of room scenes, which is one big link. */
  inspireStrip: string;
  /** Prefixed to ": Norsk, GBP". */
  languageAndCurrency: string;
  /** The gallery wall planner's drawing: the group, its toolbar, and remove. */
  wallPlanner: {
    wall: string;
    selectedPrint: string;
    removePrint: string;
  };
}

export const chromeAria: Record<Locale, ChromeAriaStrings> = {
  en: {
    cart: {
      removePrefix: 'Remove',
      decreaseQuantity: 'Decrease quantity',
      increaseQuantity: 'Increase quantity',
    },
    gallery: {
      previousImage: 'Previous image',
      nextImage: 'Next image',
      closeViewer: 'Close image viewer',
    },
    inspireStrip: 'Be inspired: see our prints in real rooms',
    languageAndCurrency: 'Language and currency',
    wallPlanner: {
      wall: 'Your wall. Each print is a button: arrow keys move it, S changes its size, Delete removes it.',
      selectedPrint: 'Selected print',
      removePrint: 'Remove this print',
    },
  },
  no: {
    cart: {
      removePrefix: 'Fjern',
      decreaseQuantity: 'Reduser antall',
      increaseQuantity: 'Øk antall',
    },
    gallery: {
      previousImage: 'Forrige bilde',
      nextImage: 'Neste bilde',
      closeViewer: 'Lukk bildevisning',
    },
    inspireStrip: 'La deg inspirere: se trykkene våre i ekte rom',
    languageAndCurrency: 'Språk og valuta',
    wallPlanner: {
      wall: 'Veggen din. Hvert trykk er en knapp: piltastene flytter det, S endrer størrelsen, Delete fjerner det.',
      selectedPrint: 'Valgt trykk',
      removePrint: 'Fjern dette trykket',
    },
  },
};

export const footerStrings: Record<Locale, FooterStrings> = {
  en: {
    tagline: 'A Scandinavian art gallery, where we curate an exquisite selection of artworks.',
    categoryLabels: {},
    collectionLabels: {},
    wallArt: 'Wall Art',
    nordicArt: 'Nordic Art',
    about: 'About',
    inspire: 'Inspire',
    journal: 'Journal',
    artists: 'Artists',
    help: 'Help',
    feedback: 'Feedback',
    newsletter: 'Newsletter',
    shopAll: 'Shop All',
    sendEmail: 'Send Email',
    privacy: 'Privacy',
    terms: 'Terms',
    delivery: 'Delivery',
  },
  no: {
    tagline: 'Et skandinavisk kunstgalleri, der vi kuraterer et utsøkt utvalg av kunstverk.',
    categoryLabels: {
      botanical: 'Botanisk',
      abstract: 'Abstrakt',
      illustrations: 'Illustrasjoner',
    },
    collectionLabels: {
      'living-room': 'Stue',
      bedroom: 'Soverom',
      'home-office': 'Hjemmekontor',
      kitchen: 'Kjøkken',
      'birds-and-animals': 'Fugler og dyr',
    },
    wallArt: 'Veggkunst',
    nordicArt: 'Nordisk kunst',
    about: 'Om oss',
    inspire: 'Inspirasjon',
    journal: 'Journal',
    artists: 'Kunstnere',
    help: 'Hjelp',
    feedback: 'Tilbakemelding',
    newsletter: 'Nyhetsbrev',
    shopAll: 'Alle trykk',
    sendEmail: 'Send e-post',
    privacy: 'Personvern',
    terms: 'Vilkår',
    delivery: 'Levering',
  },
};

// The first-visit suggestion banner is Norwegian-only by design: it is shown
// to visitors whose browser prefers Norwegian, on English pages.
// RETIRED 2026-08-21. The first-visit "this page is also in Norwegian" banner
// is gone, along with components/LocaleSuggestionBanner.tsx.
//
// It was the third mechanism doing one job. A Norwegian visitor is now
// redirected to the /no twin automatically by proxy.ts (geo, 302, once
// per visitor, bots excluded), and the header control offers both languages
// explicitly at any time. Mark's call: "I don't think we need this banner now
// then if we have it automatic plus the toggle."
//
// It also fired on navigator.language rather than location, so it targeted
// Norwegian SPEAKERS anywhere rather than people in Norway, which is a
// different question from the one the redirect answers.
//
// If the redirect is ever turned off, this needs to come back: without either,
// a Norwegian visitor is never offered Norwegian at all.


// ---------------------------------------------------------------------------
// Page dictionary types (implemented by lib/i18n/no.ts, server-side only).
// ---------------------------------------------------------------------------

export interface HeroStrings {
  badge: string;
  heading: string;
  sub: string;
  cta: string;
}

export interface QualityPromiseStrings {
  heading: string;
  sub: string;
  features: { title: string; desc: string }[];
}

export interface TestimonialsStrings {
  heading: string;
  sub: string;
  quote: string;
  name: string;
  location: string;
}

export interface CrossLinksStrings {
  heading: string;
  allPrints: string;
  wallArt: string;
  nordicArt: string;
  meetTheArtists: string;
  /** Category landing slug -> visible label. */
  categoryLabels: Record<string, string>;
  /** Collection landing slug -> visible label (the English chipLabel translated). */
  collectionLabels: Record<string, string>;
}

export interface CategoryLandingCopy {
  title: string;
  description: string;
  heading: string;
  intro: string;
  intro2: string;
  stylingHeading: string;
  stylingBody: string;
  faqs: { question: string; answer: string }[];
}

/**
 * Norwegian copy for a collection landing page. Copy only: the curated
 * productSlugs, the styling-card images and the related-article slug stay in
 * lib/collections.ts so the curation cannot drift between languages.
 * stylingCards and relatedArticleLabel are optional because two collections
 * (kitchen, birds-and-animals) run on a plain tip list with no cards.
 */
export interface CollectionLandingCopy {
  title: string;
  description: string;
  heading: string;
  intro: string;
  intro2: string;
  stylingHeading: string;
  stylingTips: string[];
  stylingCards?: { label: string; tip: string; alt: string }[];
  relatedArticleLabel?: string;
  faqs: { question: string; answer: string }[];
}

export interface ArtistCopy {
  location: string;
  bio: string;
}

export interface ArtistEditorialCopy {
  heading: string;
  para1: string;
  para2: string;
}

export interface HelpItemCopy {
  q: string;
  a: string;
}

export interface HelpGroupCopy {
  category: string;
  items: HelpItemCopy[];
}

/** Labels for the catalogue grid on /products and /no/products. */
export interface ProductsGridStrings {
  heading: string;
  searchPrefix: string;
  printsSuffix: string;
  allChip: string;
  sortLabel: string;
  sortName: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  outOfStock: string;
  emptyHeading: string;
  emptyCta: string;
  /** Catalogue category value -> visible label. Falls back to the raw value. */
  categoryLabels?: Record<string, string>;
  /** Collection slug -> chip label. Falls back to the config's chipLabel. */
  collectionChips?: Record<string, string>;
}

/** Labels on the buying control on a product page. */
export interface ProductActionsStrings {
  size: string;
  frame: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  soldOut: string;
  selectSize: string;
  addToCart: string;
  /** Frame option id -> visible label. Falls back to the config's name. */
  frameLabels?: Record<string, string>;
}

/** Labels on the checkout page. Strings only: the payment flow itself is
 *  identical in both trees. */
export interface CheckoutStrings {
  heading: string;
  subheading: string;
  cartEmpty: string;
  continueShopping: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  country: string;
  city: string;
  searchCountry: string;
  noCountry: string;
  cardDetails: string;
  processing: string;
  payPrefix: string;
  orderSummary: string;
  discountPlaceholder: string;
  apply: string;
  percentOff: string;
  subtotal: string;
  shipping: string;
  free: string;
  discount: string;
  total: string;
  secureHeading: string;
  secureBody: string;
  shipsMostHeading: string;
  elsewhereHeading: string;
  payNotice: string;
  invalidCode: string;
  couldNotCheckCode: string;
  orderTotalChanged: string;
  paymentFailed: string;
}

/** Labels on the journal index. */
export interface JournalStrings {
  heading: string;
  intro?: string;
  allChip: string;
  articlesSuffix: string;
  empty: string;
  booksSeriesHeading: string;
  /** Article category -> visible label. Falls back to the raw value. */
  categoryLabels?: Record<string, string>;
}
