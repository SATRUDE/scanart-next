// Three prints under Add to basket on the product page (Mark's decision board,
// 18 Nov 2026). Phone visitors from the Vinkveld Meta ad who stayed went looking
// for other prints; this puts three in reach without leaving the buying panel.
//
// Order of preference, each step only filling what the one before left empty:
//   1. the same artist, in catalogue order;
//   2. a hand-picked collection the print belongs to (lib/collections.ts), in
//      that collection's own order;
//   3. the print's own "More prints like this" picks (recommendedProducts),
//      which the page already shows further down;
//   4. the same category, so a row is never short while the shop has prints.
// Never the print itself, and only prints a visitor can buy now: an out of stock
// or "coming soon" print is left out, because this row sits beside the button.
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
  const add = (p: P | undefined) => {
    if (!p || picked.length >= count || seen.has(p.slug) || !isBuyable(p)) return;
    seen.add(p.slug);
    picked.push(p);
  };

  if (current.artistId) shop.filter(p => p.artistId === current.artistId).forEach(add);
  collections
    .filter(c => c.productSlugs.includes(current.slug))
    .forEach(c => c.productSlugs.forEach(slug => add(bySlug.get(slug))));
  (current.recommendedProducts ?? []).forEach(name => add(byName.get(name)));
  shop.filter(p => p.category === current.category).forEach(add);
  return picked;
}

/** Whether every print in the row is by this artist, which decides the heading. */
export function allByArtist(prints: readonly Pick<Product, 'artistId'>[], artistId: string | undefined): boolean {
  return !!artistId && prints.length > 0 && prints.every(p => p.artistId === artistId);
}

/** The lower "More prints like this" row, less anything already shown under the
 *  button, so the page never shows the same print twice in two rows. */
export function withoutShown<P extends Pick<Product, 'slug'>>(prints: readonly P[], shown: readonly Pick<Product, 'slug'>[]): P[] {
  const slugs = new Set(shown.map(p => p.slug));
  return prints.filter(p => !slugs.has(p.slug));
}
