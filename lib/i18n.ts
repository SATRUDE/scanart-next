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
  about: string;
  inspire: string;
  journal: string;
  artists: string;
  help: string;
  newsletter: string;
  shopAll: string;
  sendEmail: string;
  privacy: string;
  terms: string;
  delivery: string;
}

export interface BannerStrings {
  message: string;
  cta: string;
  dismiss: string;
  close: string;
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

export const footerStrings: Record<Locale, FooterStrings> = {
  en: {
    tagline: 'A Scandinavian art gallery, where we curate an exquisite selection of artworks.',
    categoryLabels: {},
    collectionLabels: {},
    wallArt: 'Wall Art',
    about: 'About',
    inspire: 'Inspire',
    journal: 'Journal',
    artists: 'Artists',
    help: 'Help',
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
    about: 'Om oss',
    inspire: 'Inspirasjon',
    journal: 'Journal',
    artists: 'Kunstnere',
    help: 'Hjelp',
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
export const bannerStrings: BannerStrings = {
  message: 'Denne siden finnes også på norsk.',
  cta: 'Se siden på norsk',
  dismiss: 'Fortsett på engelsk',
  close: 'Lukk',
};

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
