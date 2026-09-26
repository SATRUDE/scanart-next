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
 * The Norwegian destination offered by navigation. Slugs share the same data
 * in both trees. Checkout remains outside the switch until the separately
 * scoped payment-language work; articles and the planner are English only.
 * Automatic redirects have their own, deliberately narrower policy below.
 */
export function noPathFor(pathname: string): string | null {
  if (pathname === '/') return '/no';
  if (pathname === '/artists/apply' || pathname === '/artists/how-it-works') return `/no${pathname}`;
  if (/^\/(about|delivery|help|artists|products|inspire|journal|privacy|terms|credits|scandinavian-wall-art|feedback)$/.test(pathname)) return `/no${pathname}`;
  if (/^\/(category|artist|collection|product)\/[^/]+$/.test(pathname)) return `/no${pathname}`;
  return null;
}

/** Existing first-visit redirect policy, separate from manual navigation. */
export function noRedirectPathFor(pathname: string): string | null {
  if (pathname === '/') return '/no';
  if (pathname === '/artists/apply' || pathname === '/artists/how-it-works') return `/no${pathname}`;
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
  /** V2 nav text controls: Basket (n), Menu, Close. */
  basket: string;
  menu: string;
  close: string;
  /** V2 checkout header (Nav · checkout). */
  checkout: { back: string; backShort: string; secure: string; secureShort: string };
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
  /** V2 footer: the season selector (winter, spring, summer, autumn) and its label for screen readers. */
  seasons: { winter: string; spring: string; summer: string; autumn: string; label: string };
  /** V2 footer: heading of the crawlable "shop by" line. */
  shopBy: string;
  /** V2 footer: the control that stops and restarts the wordmark footage (WCAG 2.2.2). */
  motion: { pause: string; play: string };
  privacy: string;
  terms: string;
  /** V2 footer: the attribution page for the Wikimedia Commons footage and photographs. */
  credits: string;
  delivery: string;
}


// English chrome: must match the literals the components previously hardcoded,
// so English pages render identically.
export const headerStrings: Record<Locale, HeaderStrings> = {
  en: {
    basket: 'Basket',
    menu: 'Menu',
    close: 'Close',
    checkout: { back: 'Continue shopping', backShort: 'Shop', secure: 'Secure checkout', secureShort: 'Secure' },
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
    basket: 'Handlekurv',
    menu: 'Meny',
    close: 'Lukk',
    checkout: { back: 'Fortsett å handle', backShort: 'Butikk', secure: 'Sikker betaling', secureShort: 'Sikker' },
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
  /** V2 landmark labels: the header nav, the mobile menu, the footer nav and breadcrumbs. */
  landmarks: { main: string; menu: string; footer: string; breadcrumb: string };
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
  /** The product video's round control (Figma Video 257:3920), WCAG 2.2.2. */
  video: { pause: string; play: string };
  /** The homepage strip of room scenes, which is one big link. */
  inspireStrip: string;
  /** Prefixed to ": Norsk, GBP". */
  languageAndCurrency: string;
  /** The gallery wall planner's drawing: the group, its toolbar, and remove. */
  wallPlanner: {
    wall: string;
    selectedPrint: string;
    removePrint: string;
    addFirst: string;
    /** One per side of a print. */
    addSide: { left: string; right: string; above: string; below: string };
    wontFit: string;
    heightMarker: string;
    startFrom: string;
    sofaSwitch: string;
    removeFurniture: string;
    linesSwitch: string;
    copyLink: string;
    reset: string;
    expand: string;
    collapse: string;
    viewGroup: string;
    viewPlan: string;
    viewRoom: string;
    saveImage: string;
    roomImage: string;
  };
}

export const chromeAria: Record<Locale, ChromeAriaStrings> = {
  en: {
    landmarks: { main: 'Main', menu: 'Menu', footer: 'Footer', breadcrumb: 'Breadcrumb' },
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
    video: { pause: 'Pause video', play: 'Play video' },
    inspireStrip: 'Be inspired: see our prints in real rooms',
    languageAndCurrency: 'Language and currency',
    wallPlanner: {
      wall: 'Your wall. Each print is a button: arrow keys nudge it by a centimetre, with Shift by ten; S changes its size; Delete removes it.',
      selectedPrint: 'Selected print',
      removePrint: 'Remove this print',
      addFirst: 'Add the first print',
      addSide: { left: 'Add a print to the left of this one', right: 'Add a print to the right of this one', above: 'Add a print above this one', below: 'Add a print below this one' },
      wontFit: 'It would not fit the wall',
      heightMarker: 'Height of the group above the floor. Drag, or use the arrow keys.',
      startFrom: 'Start from an arrangement',
      sofaSwitch: 'Show a sofa for scale',
      removeFurniture: 'Remove this piece of furniture',
      linesSwitch: 'Show the measurement lines',
      copyLink: 'Copy a link to this wall',
      reset: 'Start again from the default wall',
      expand: 'Fill the screen',
      collapse: 'Close full screen',
      viewGroup: 'View',
      viewPlan: 'Plan view: the wall face on, where you arrange the prints',
      viewRoom: 'Room view: the wall from inside the room. Drag to turn.',
      saveImage: 'Save the room view as an image',
      roomImage: 'Your wall seen from inside the room. Drag left or right to turn the view.',
    },
  },
  no: {
    landmarks: { main: 'Hovedmeny', menu: 'Meny', footer: 'Bunntekst', breadcrumb: 'Brødsmulesti' },
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
    video: { pause: 'Sett videoen på pause', play: 'Spill av videoen' },
    inspireStrip: 'La deg inspirere: se trykkene våre i ekte rom',
    languageAndCurrency: 'Språk og valuta',
    wallPlanner: {
      wall: 'Veggen din. Hvert trykk er en knapp: piltastene flytter det én centimeter, med Shift ti; S endrer størrelsen; Delete fjerner det.',
      selectedPrint: 'Valgt trykk',
      removePrint: 'Fjern dette trykket',
      addFirst: 'Legg til det første trykket',
      addSide: { left: 'Legg til et trykk til venstre for dette', right: 'Legg til et trykk til høyre for dette', above: 'Legg til et trykk over dette', below: 'Legg til et trykk under dette' },
      wontFit: 'Det ville ikke få plass på veggen',
      heightMarker: 'Gruppens høyde over gulvet. Dra, eller bruk piltastene.',
      startFrom: 'Start fra et oppsett',
      sofaSwitch: 'Vis en sofa for skala',
      removeFurniture: 'Fjern dette møbelet',
      linesSwitch: 'Vis målelinjene',
      copyLink: 'Kopier en lenke til denne veggen',
      reset: 'Begynn på nytt med standardveggen',
      expand: 'Fyll skjermen',
      collapse: 'Lukk fullskjerm',
      viewGroup: 'Visning',
      viewPlan: 'Planvisning: veggen rett forfra, der du ordner trykkene',
      viewRoom: 'Romvisning: veggen sett fra rommet. Dra for å snu.',
      saveImage: 'Lagre romvisningen som bilde',
      roomImage: 'Veggen din sett fra rommet. Dra til venstre eller høyre for å snu.',
    },
  },
};

/**
 * The search overlay (components/v2/SearchOverlay.tsx). A client component
 * mounted by the Header on every page, so both languages live here beside the
 * rest of the chrome. `{n}` and `{q}` are filled in by the component.
 */
export interface SearchStrings {
  dialog: string;
  placeholder: string;
  placeholderShort: string;
  submit: string;
  clear: string;
  close: string;
  popular: string;
  recent: string;
  roomsHeading: string;
  roomsLink: string;
  prints: string;
  artists: string;
  stories: string;
  allResults: string;
  tabsLabel: string;
  seeAll: string;
  /** When there is exactly one result. */
  seeAllOne: string;
  seeOnPrintsPage: string;
  searching: string;
  noResultsTitle: string;
  noResultsBody: string;
  tryHeading: string;
  allPrints: string;
  printCount: string;
  printCountOne: string;
  resultCount: string;
}

export const searchStrings: Record<Locale, SearchStrings> = {
  en: {
    dialog: 'Search',
    placeholder: 'Search prints, artists and stories',
    placeholderShort: 'Search prints and artists',
    submit: 'Search',
    clear: 'Clear',
    close: 'Close',
    popular: 'Popular searches',
    recent: 'Recent',
    roomsHeading: 'Or start from a room',
    roomsLink: 'Prints in real rooms',
    prints: 'Prints',
    artists: 'Artists',
    stories: 'Stories',
    allResults: 'All results',
    tabsLabel: 'Kinds of result',
    seeAll: 'See all {n} results for “{q}”',
    seeAllOne: 'See the result for “{q}”',
    seeOnPrintsPage: 'See them on the Prints page',
    searching: 'Searching',
    noResultsTitle: 'Nothing for “{q}” yet',
    noResultsBody: 'Check the spelling, try a shorter word, or search for an artist’s name.',
    tryHeading: 'Try',
    allPrints: 'All {n} prints',
    printCount: '{n} prints',
    printCountOne: '1 print',
    resultCount: '{n} results',
  },
  no: {
    dialog: 'Søk',
    placeholder: 'Søk etter trykk, kunstnere og artikler',
    placeholderShort: 'Søk etter trykk',
    submit: 'Søk',
    clear: 'Tøm',
    close: 'Lukk',
    popular: 'Populære søk',
    recent: 'Nylige søk',
    roomsHeading: 'Eller start fra et rom',
    roomsLink: 'Trykk i ekte rom',
    prints: 'Trykk',
    artists: 'Kunstnere',
    stories: 'Artikler',
    allResults: 'Alle treff',
    tabsLabel: 'Typer treff',
    seeAll: 'Se alle {n} treff for «{q}»',
    seeAllOne: 'Se treffet for «{q}»',
    seeOnPrintsPage: 'Se dem på trykksiden',
    searching: 'Søker',
    noResultsTitle: 'Ingenting for «{q}» ennå',
    noResultsBody: 'Sjekk stavemåten, prøv et kortere ord, eller søk etter navnet på en kunstner.',
    tryHeading: 'Prøv',
    allPrints: 'Alle {n} trykk',
    printCount: '{n} trykk',
    printCountOne: '1 trykk',
    resultCount: '{n} treff',
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
    seasons: { winter: 'Winter', spring: 'Spring', summer: 'Summer', autumn: 'Autumn', label: 'Season shown in the footer' },
    shopBy: 'Shop by',
    motion: { pause: 'Pause motion', play: 'Play motion' },
    privacy: 'Privacy',
    terms: 'Terms',
    credits: 'Credits',
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
    seasons: { winter: 'Vinter', spring: 'Vår', summer: 'Sommer', autumn: 'Høst', label: 'Årstiden som vises i bunnteksten' },
    shopBy: 'Utforsk',
    motion: { pause: 'Stopp bevegelse', play: 'Start bevegelse' },
    privacy: 'Personvern',
    terms: 'Vilkår',
    credits: 'Kreditering',
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
  /** The Filter bar's overflow toggle: "More" shows the options that don't fit on one line, "Less" folds them away. */
  /** In the open Artist and Size menus, the option that clears the filter. */
  artistAny: string;
  sizeAny: string;
  moreFilters: string;
  lessFilters: string;
  sortLabel: string;
  /** The page's own order, the default on the curated landings: "Sort: Featured". */
  sortFeatured: string;
  sortName: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  outOfStock: string;
  emptyHeading: string;
  emptyCta: string;
  /** The grid's sr-only h2, so the card titles sit at h3 under it. */
  printsSrHeading: string;
  /** Filter bar refine controls: the first option doubles as the visible label. */
  artistAll: string;
  artistFilterLabel: string;
  sizeAll: string;
  sizeFilterLabel: string;
  /** Visible before the sort control: "Sort: Name". */
  sortPrefix: string;
  clearSearch: string;
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
  /** V2 assurance lines under the button; {price} is the store's cheapest
   *  delivery outside the UK (lib/server/delivery-guide.ts). */
  assurance?: { printed: string; delivery: string; returns: string };
}

type Step = { title: string; body: string };

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
  /** V2 checkout (Figma: Checkout · desktop 276:4235 and friends). `{x}` is filled in by the component. */
  v2: {
    contactTitle: string;
    contactNote: string;
    deliveryTitle: string;
    paymentTitle: string;
    cardNote: string;
    loadingCard: string;
    codePlaceholder: string;
    remove: string;
    yourOrder: string;
    showOrder: string;
    hideOrder: string;
    printCount: string;
    printCountOne: string;
    quantity: string;
    deliveryNote: string;
    assuranceMade: string;
    assuranceReturns: string;
    assuranceStripe: string;
    paymentFailedTitle: string;
    paymentFailedHint: string;
    contactHelp: string;
    unavailableTitle: string;
    unavailableBody: string;
    testMode: string;
    /** Frame option id -> the words in an order line ("oak frame", "no frame"). */
    frameLabels: Record<string, string>;
    thanks: string;
    thanksNoName: string;
    placed: string;
    nextHeading: string;
    steps: { made: Step; sent: Step; sentNoEstimate: string; decide: Step };
    keepBrowsing: string;
    deliveringTo: string;
  };
}

/** Labels on the journal index. */
export interface JournalStrings {
  heading: string;
  intro?: string;
  allChip: string;
  articlesSuffix: string;
  empty: string;
  booksSeriesHeading: string;
  /** The pillar's note in the books-series hub: "(start here)". */
  startHere: string;
  /** Article category -> visible label. Falls back to the raw value. */
  categoryLabels?: Record<string, string>;
  /** The ruled list under the story tiles (Figma "More to read"). */
  moreToReadHeading: string;
  moreToReadIntro: string;
  /** The featured story's closing link. */
  readTheStory: string;
  /** "{n} min read". */
  minRead: string;
  /** Language the story dates are written in. */
  dateLocale: 'en' | 'no';
}

/**
 * The basket panel (components/Cart.tsx, Figma Basket panel 242:4070). Here,
 * beside the header and footer strings, because the panel is a client
 * component mounted on every page in both trees, and lib/i18n/no.ts must not
 * reach the browser. The delivery guide's prices come from the store at
 * render (lib/server/delivery-guide.ts), in the buyer's currency, never typed here.
 */
export interface BasketStrings {
  title: string;
  /** "Basket ({count})" */
  titleCount: string;
  close: string;
  remove: string;
  /** Frame id -> how the line describes it: "wood frame", "unframed". */
  frames: Record<string, string>;
  subtotal: string;
  delivery: string;
  deliveryValue: string;
  guidePrefix: string;
  /** After the guide line: framed costs more, checkout has the exact amount. */
  guideSuffix: string;
  /** Shipping region code -> name in the guide line. */
  regions: Record<string, string>;
  and: string;
  assurance: string[];
  checkout: string;
  continueShopping: string;
  emptyHeading: string;
  emptyBody: string;
  seePrints: string;
  startFromWall: string;
}

export const basketStrings: Record<Locale, BasketStrings> = {
  en: {
    title: 'Basket',
    titleCount: 'Basket ({count})',
    close: 'Close',
    remove: 'Remove',
    frames: { 'no-frame': 'unframed', wood: 'wood frame', black: 'black frame', white: 'white frame' },
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    deliveryValue: 'Calculated at checkout',
    guidePrefix: 'As a guide, one unframed print from:',
    guideSuffix: 'Framed costs more, and checkout shows the exact amount.',
    regions: { GB: 'UK', NO: 'Norway', DK: 'Denmark', SE: 'Sweden', US: 'United States', ELSEWHERE: 'rest of world' },
    and: 'and',
    assurance: ['Made to order, produced in 1 to 4 business days', '14 days to change your mind', 'Secure payment by Stripe'],
    checkout: 'Checkout',
    continueShopping: 'Continue shopping',
    emptyHeading: 'Your basket is empty.',
    emptyBody: 'Every print is made to order and delivered worldwide. Start with the collection, or see the prints in rooms like yours.',
    seePrints: 'See the prints',
    startFromWall: 'Start from your wall',
  },
  no: {
    title: 'Handlekurv',
    titleCount: 'Handlekurv ({count})',
    close: 'Lukk',
    remove: 'Fjern',
    frames: { 'no-frame': 'uten ramme', wood: 'ramme i tre', black: 'sort ramme', white: 'hvit ramme' },
    subtotal: 'Delsum',
    delivery: 'Frakt',
    deliveryValue: 'Beregnes i kassen',
    guidePrefix: 'Som en pekepinn, ett trykk uten ramme fra:',
    guideSuffix: 'Med ramme koster det mer, og i kassen ser du nøyaktig beløp.',
    regions: { GB: 'Storbritannia', NO: 'Norge', DK: 'Danmark', SE: 'Sverige', US: 'USA', ELSEWHERE: 'resten av verden' },
    and: 'og',
    assurance: ['Lages på bestilling, produseres på 1 til 4 virkedager', '14 dagers angrerett', 'Sikker betaling med Stripe'],
    checkout: 'Til kassen',
    continueShopping: 'Fortsett å handle',
    emptyHeading: 'Handlekurven din er tom.',
    emptyBody: 'Hvert trykk lages på bestilling og sendes til hele verden. Begynn med samlingen, eller se trykkene i rom som ligner ditt.',
    seePrints: 'Se trykkene',
    startFromWall: 'Begynn med veggen din',
  },
};
