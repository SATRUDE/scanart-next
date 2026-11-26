// Three prints under Add to basket on the product page (Mark's decision board,
// 18 Nov 2026). Phone visitors from the Vinkveld Meta ad who stayed went looking
// for other prints; this puts three in reach without leaving the buying panel.
//
// Mark, 26 Nov 2026: the row under Add to basket is the artist's own other
// prints ("More from <artist>"), and other artists' prints go in the section
// lower down. An artist with fewer than three other prints has the row topped
// up with similar prints so it is never short.
//
// Order of preference, each step only filling what the one before left empty:
//   1. the same artist, in catalogue order;
//   2. a hand-picked collection the print belongs to (lib/collections.ts), in
//      that collection's own order;
//   3. the print's own hand-picked recommendedProducts;
//   4. the same category, so a row is never short while the shop has prints.
// Steps 2 to 4 are the "similar" prints, which the click event marks as such.
// Never the print itself, and only prints a visitor can buy now: an out of stock
// or "coming soon" print is left out, because this row sits beside the button.
// (One exception: on a preview, the artist's own prints still in review show,
// so a new artist's pages can be judged before they go live.)
//
// Pure: the page passes in the shop list it already reads, so there is no extra
// query (the pages are statically generated, so this runs at build).

import type { Product } from '@/contexts/CartContext';
import type { Collection } from '@/lib/collections';

export const RELATED_PRINTS_COUNT = 3;

type RelatedProduct = Pick<Product, 'slug' | 'name' | 'artistId' | 'category' | 'inStock' | 'published' | 'recommendedProducts'>;

/** A print someone could add to the basket today. */
export function isBuyable(p: Pick<Product, 'inStock' | 'published'>): boolean {
  return p.inStock && p.published !== false;
}

/** Buyable, or an unpublished print in review (preview builds only). */
function inReviewOrBuyable(p: Pick<Product, 'inStock' | 'published'>): boolean {
  return isBuyable(p) || p.published === false;
}

export function pickRelatedPrints<P extends RelatedProduct>(
  current: RelatedProduct,
  shop: readonly P[],
  collections: readonly Pick<Collection, 'productSlugs'>[],
  count = RELATED_PRINTS_COUNT,
): P[] {
  const bySlug = new Map(shop.map(p => [p.slug, p]));
  const byName = new Map(shop.map(p => [p.name, p]));
  const picked: P[] = [];
  const seen = new Set([current.slug]);
  const add = (p: P | undefined, ok: (p: P) => boolean = isBuyable) => {
    if (!p || picked.length >= count || seen.has(p.slug) || !ok(p)) return;
    seen.add(p.slug);
    picked.push(p);
  };

  // The artist's own prints also include one in review: those only reach the
  // shop list on a Vercel preview (lib/server/catalogue-review.ts), where the
  // page should show the row as it will be once they go live.
  if (current.artistId) shop.filter(p => p.artistId === current.artistId).forEach(p => add(p, inReviewOrBuyable));
  collections
    .filter(c => c.productSlugs.includes(current.slug))
    .forEach(c => c.productSlugs.forEach(slug => add(bySlug.get(slug))));
  (current.recommendedProducts ?? []).forEach(name => add(byName.get(name)));
  shop.filter(p => p.category === current.category).forEach(p => add(p));
  return picked;
}

/** Whether every print in the row is by this artist, which decides the heading. */
export function allByArtist(prints: readonly Pick<Product, 'artistId'>[], artistId: string | undefined): boolean {
  return !!artistId && prints.length > 0 && prints.every(p => p.artistId === artistId);
}

/** Whether at least one print in the row is by this artist. */
export function someByArtist(prints: readonly Pick<Product, 'artistId'>[], artistId: string | undefined): boolean {
  return !!artistId && prints.some(p => p.artistId === artistId);
}

/** Which heading the row under Add to basket takes: "More from {name}" when
 *  every print is the artist's, "More from {name} and similar prints" when the
 *  artist's own run out and similar prints fill the row, otherwise the general
 *  heading. */
export type RelatedHeading = 'artist' | 'artist-and-similar' | 'general';
export function relatedHeading(prints: readonly Pick<Product, 'artistId'>[], artistId: string | undefined): RelatedHeading {
  if (allByArtist(prints, artistId)) return 'artist';
  if (someByArtist(prints, artistId)) return 'artist-and-similar';
  return 'general';
}

/** The `match` property on the click event, so the running onward test can tell
 *  the artist's own prints from the similar ones that fill the row, and both
 *  from the other artists' row lower down. */
export type RelatedMatch = 'same-artist' | 'similar' | 'other-artist';
export function relatedMatch(p: Pick<Product, 'artistId'>, artistId: string | undefined): Exclude<RelatedMatch, 'other-artist'> {
  return !!artistId && p.artistId === artistId ? 'same-artist' : 'similar';
}

/** The lower "More prints like this" row: other artists' prints only (Mark,
 *  26 Nov 2026), never one already shown under the button. Similar first, in
 *  the same order as above (the print's collections, its hand-picked picks,
 *  its category), then the rest of the shop so the row is never short. One
 *  print per artist first, so the row shows several other artists, then a
 *  second from an artist if the shop runs short. */
export function pickOtherArtistPrints<P extends RelatedProduct>(
  current: RelatedProduct,
  shop: readonly P[],
  collections: readonly Pick<Collection, 'productSlugs'>[],
  shown: readonly Pick<Product, 'slug'>[],
  count = RELATED_PRINTS_COUNT,
): P[] {
  const bySlug = new Map(shop.map(p => [p.slug, p]));
  const byName = new Map(shop.map(p => [p.name, p]));
  const isOther = (p: P | undefined): p is P =>
    !!p && p.slug !== current.slug && (!current.artistId || p.artistId !== current.artistId) && isBuyable(p);
  const shownSlugs = new Set(shown.map(p => p.slug));
  const ordered: P[] = [];
  const queued = new Set<string>();
  const queue = (p: P | undefined) => {
    if (!isOther(p) || queued.has(p.slug) || shownSlugs.has(p.slug)) return;
    queued.add(p.slug);
    ordered.push(p);
  };
  collections
    .filter(c => c.productSlugs.includes(current.slug))
    .forEach(c => c.productSlugs.forEach(slug => queue(bySlug.get(slug))));
  (current.recommendedProducts ?? []).forEach(name => queue(byName.get(name)));
  shop.filter(p => p.category === current.category).forEach(queue);
  shop.forEach(queue);

  const picked: P[] = [];
  const artists = new Set<string | undefined>();
  for (const p of ordered) {
    if (picked.length >= count) break;
    if (artists.has(p.artistId)) continue;
    artists.add(p.artistId);
    picked.push(p);
  }
  for (const p of ordered) {
    if (picked.length >= count) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}
