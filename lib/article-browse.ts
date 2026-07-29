// Curated map from article slug to the landing pages a reader of that piece
// would plausibly browse next: a specific category or collection landing where
// one clearly fits, otherwise the shop (/products) and artists (/artists) hubs,
// which are a genuine door-in from any journal piece. Explicit per-article
// curation (never auto-derived from tags) mirrors lib/collections.ts: the
// article categories are editorial (Guide/Styling/About), not shop taxonomy,
// so a computed mapping would guess. Articles without a genuinely relevant
// landing get no entry and no block. Anchors describe the destination page.
// Slugs may reference articles that live only in Notion (the journal syncs at
// prebuild, see scripts/sync-notion.mjs); unknown slugs simply never render.

export interface BrowseLink {
  href: string;
  label: string;
}

const browseLinksByArticle: Record<string, BrowseLink[]> = {
  'how-to-style-scandinavian-wall-art-living-room': [
    { href: '/collection/living-room', label: 'living room wall art collection' },
    { href: '/category/abstract', label: 'abstract art prints' },
  ],
  'complete-guide-choosing-print-sizes': [
    { href: '/collection/bedroom', label: 'bedroom wall art collection' },
    { href: '/collection/home-office', label: 'home office wall art collection' },
  ],
  'the-art-of-choosing-art-comprehensive-guide': [
    { href: '/category/abstract', label: 'abstract art prints' },
    { href: '/category/botanical', label: 'botanical art prints' },
  ],
  'nordic-art-and-design-books': [
    { href: '/collection/living-room', label: 'living room wall art collection' },
    { href: '/category/illustrations', label: 'Scandinavian illustrations' },
  ],
  // About / interview pieces: the honest next steps from a story about the
  // gallery are the full catalogue and the people behind it.
  'who-are-scandinavian-art': [
    { href: '/products', label: 'browse the full print collection' },
    { href: '/artists', label: 'meet the gallery’s artists' },
  ],
  'an-interview-by-nordic-notes': [
    { href: '/artists', label: 'the gallery’s artists' },
    { href: '/products', label: 'our Scandinavian art prints' },
  ],
  // Exhibitions strand (the Oslo scene): our artists are Oslo-based, so the
  // artists hub and the shop are the relevant onward links.
  'art-in-oslo-july-2026': [
    { href: '/artists', label: 'the Oslo-based artists we represent' },
    { href: '/products', label: 'browse the art prints' },
  ],
  'henie-onstad-in-focus': [
    { href: '/artists', label: 'meet our Norwegian artists' },
    { href: '/products', label: 'the print collection' },
  ],
  // Books series: each instalment points at the closest fitting landing, plus
  // the shop or artists hub.
  'nordic-artist-monographs': [
    { href: '/artists', label: 'the gallery’s artists' },
    { href: '/products', label: 'our Scandinavian art prints' },
  ],
  'nordic-photography-books': [
    { href: '/products', label: 'browse the art prints' },
    { href: '/artists', label: 'the Norwegian artists' },
  ],
  'contemporary-nordic-art-books': [
    { href: '/category/abstract', label: 'abstract art prints' },
    { href: '/products', label: 'the contemporary print collection' },
  ],
  'nordic-design-and-architecture-books': [
    { href: '/collection/home-office', label: 'home office wall art collection' },
    { href: '/products', label: 'the print collection' },
  ],
  'nordic-craft-books-glass-ceramics-textiles': [
    { href: '/collection/living-room', label: 'living room wall art collection' },
    { href: '/category/botanical', label: 'botanical art prints' },
  ],
};

export function getBrowseLinksForArticle(slug: string): BrowseLink[] {
  return browseLinksByArticle[slug] ?? [];
}
