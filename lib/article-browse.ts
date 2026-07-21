// Curated map from article slug to the category/collection landing pages a
// reader of that piece would plausibly browse next. Explicit per-article
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
};

export function getBrowseLinksForArticle(slug: string): BrowseLink[] {
  return browseLinksByArticle[slug] ?? [];
}
