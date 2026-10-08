/**
 * Work an artist has asked us to take down, and the URLs that must now say so.
 *
 * Retiring a print normally means a 301 to the nearest live page, so the
 * search equity goes somewhere useful (see RETIRED_PRODUCT_SLUGS in
 * next.config.ts). A withdrawal is different: the artist has asked for her work
 * to be removed, so her print pages answer 410 Gone, which tells search engines
 * to drop them, and nothing of hers is linked, shown or sold. Her artist page is
 * the one exception: it 301s to /artists (or /no/artists), because an external
 * article that stays up links to it and that backlink should land somewhere
 * live (Mark, 2026-10-08). proxy.ts serves both; the catalogue no longer
 * carries the prints, so the checkout refuses a stale basket that still holds one.
 *
 * Helene Brox, 2026-10-08 (Mark's instruction, at her request).
 */
export const WITHDRAWN_ARTIST_SLUGS: readonly string[] = ['helene-brox'];

export const WITHDRAWN_PRODUCT_SLUGS: readonly string[] = [
  'dancer',
  'dragon',
  'ithinkithink',
  'swallow-dive',
  'tree-top-peach',
  // The "2"-suffixed legacy slugs that used to 301 to the five above.
  'dancer2',
  'dragon2',
  'ithinkithink2',
  'swallow-dive2',
  'tree-top-peach2',
];

const ARTISTS = new Set(WITHDRAWN_ARTIST_SLUGS);
const PRODUCTS = new Set(WITHDRAWN_PRODUCT_SLUGS);

export type WithdrawnResponse = { kind: 'gone' } | { kind: 'redirect'; to: string } | null;

/**
 * What a withdrawn URL answers: a withdrawn artist's page 301s to the artists
 * index in its own language, a withdrawn print's page is 410 Gone, and
 * anything else is null (carry on as normal).
 */
export function withdrawnResponseFor(pathname: string): WithdrawnResponse {
  const m = /^(\/no)?\/(artist|product)\/([^/]+)\/?$/i.exec(pathname);
  if (!m) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(m[3]).toLowerCase();
  } catch {
    return null;
  }
  const prefix = m[1] ? '/no' : '';
  if (m[2].toLowerCase() === 'artist') {
    return ARTISTS.has(slug) ? { kind: 'redirect', to: `${prefix}/artists` } : null;
  }
  return PRODUCTS.has(slug) ? { kind: 'gone' } : null;
}

/** True when a scene, article or list features any withdrawn print. */
export function featuresWithdrawnPrint(slugs: readonly string[]): boolean {
  return slugs.some(s => PRODUCTS.has(s));
}

/** The body of the 410 page: plain, self-contained, pointing somewhere live. */
export function withdrawnPageHtml(norwegian: boolean): string {
  const t = norwegian
    ? {
        lang: 'nb',
        title: 'Siden er fjernet',
        body: 'Dette verket er ikke lenger tilgjengelig hos Scandinavian Art.',
        artists: 'Se kunstnerne',
        prints: 'Se alle trykk',
        p: '/no',
      }
    : {
        lang: 'en-GB',
        title: 'This page has been removed',
        body: 'This work is no longer available from Scandinavian Art.',
        artists: 'See the artists',
        prints: 'See all prints',
        p: '',
      };
  return `<!doctype html><html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${t.title} | Scandinavian Art</title><style>body{margin:0;font-family:system-ui,sans-serif;background:#faf8f4;color:#1d1d1b}main{max-width:36rem;margin:0 auto;padding:4rem 1rem}h1{font-weight:500;font-size:1.75rem}a{color:inherit;margin-right:1.5rem}</style></head><body><main><h1>${t.title}</h1><p>${t.body}</p><p><a href="${t.p}/artists">${t.artists}</a><a href="${t.p}/products">${t.prints}</a></p></main></body></html>`;
}
