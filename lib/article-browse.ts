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
  // Eight ways to dress a wall: the flagship wall-art landing is the direct
  // subject match, and the living room is where most of its ideas are set.
  'scandinavian-wall-decor-ideas': [
    { href: '/scandinavian-wall-art', label: 'Scandinavian wall art' },
    { href: '/collection/living-room', label: 'living room wall art collection' },
  ],
  // A gallery wall is several prints at once, so the full catalogue is the
  // honest next step, with the living room as the usual setting. The piece also
  // builds its worked example out of the bird prints (Swallow Dive as the
  // anchor, then Birdie Blue, Pink and Brown, all four named in the body), and a
  // set of colourways is exactly what a gallery wall wants, so the birds
  // collection is a third genuine door rather than a generic one.
  'create-an-art-wall': [
    { href: '/products', label: 'browse the full print collection' },
    { href: '/collection/living-room', label: 'living room wall art collection' },
    { href: '/collection/birds-and-animals', label: 'bird and animal art prints' },
  ],
  'nordic-art-and-design-books': [
    { href: '/collection/living-room', label: 'living room wall art collection' },
    { href: '/category/illustrations', label: 'Scandinavian illustrations' },
  ],
  // About / interview pieces: the honest next steps from a story about the
  // gallery are the full catalogue and the people behind it.
  // The informational pillar: someone who has just read what Scandinavian art
  // is wants to see it, and then the people making it.
  'what-is-scandinavian-art': [
    { href: '/products', label: 'browse the full print collection' },
    { href: '/artists', label: 'meet the gallery’s artists' },
  ],
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
  // The Norwegian titles this piece explains ARE the kitchen collection: it
  // walks through hyttefrokost, vinkveld, morgenlevering and Hummer og Vin,
  // which is all four of that collection's prints, so the kitchen landing is
  // the one page a reader who has just learned the words would want next.
  'norwegian-words-behind-the-prints': [
    { href: '/collection/kitchen', label: 'kitchen wall art collection' },
    { href: '/products', label: 'browse the full print collection' },
  ],
};

/**
 * The whole curated map, exposed so a test can check every destination still
 * resolves to a landing page that exists. Call `getBrowseLinksForArticle` for
 * anything that renders.
 */
export const browseLinkTargets: Readonly<Record<string, BrowseLink[]>> = browseLinksByArticle;

export function getBrowseLinksForArticle(slug: string): BrowseLink[] {
  return browseLinksByArticle[slug] ?? [];
}
