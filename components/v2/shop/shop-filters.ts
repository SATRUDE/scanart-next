import { getArtistById } from '@/data/artists';
import { getLowestProductPrices } from '@/lib/pricing';
import type { Product } from '@/contexts/CartContext';

/**
 * The Filter bar's refine logic, shared by the server (which works out each
 * shop page's Artist and Size options) and the client grid (which applies
 * them). No 'use client' and no React, so both sides import the same code and
 * the options can never offer a value the grid does not understand.
 */

/** The name a print is filed under: the artist record, then the catalogue's own fallbacks. */
export const artistOf = (p: Product) =>
  (p.artistId ? getArtistById(p.artistId)?.name || p.artist || p.brand : p.artist || p.brand);

/** The Artist and Size options for a set of prints, sorted. */
export function refineOptions(products: Product[]) {
  return {
    artists: [...new Set(products.map(artistOf))].filter(Boolean).sort(),
    sizes: [...new Set(products.flatMap(p => Object.keys(p.prices)))].sort(),
  };
}

/**
 * "featured" keeps the page's own order, which on a collection is the curated
 * order its config sets (and its ItemList JSON-LD follows). /products has no
 * curated order and defaults to name, as it always has.
 */
export type ShopSort = 'featured' | 'name' | 'price-low' | 'price-high';

export function refineProducts(
  products: Product[],
  { query, category, artist, size, sort }: { query: string; category: string; artist: string; size: string; sort: ShopSort },
) {
  let filtered = products;
  if (query) {
    const q = query.toLowerCase();
    // Match the artist through the same `artist || brand` fallback the rest of
    // the codebase uses (product page, product feed, HeroSection): `brand` is
    // empty on every product in the exported catalogue, so matching it alone
    // meant an artist-name search found nothing while the card below still
    // displayed that artist's name.
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.artist || p.brand).toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  } else if (category !== 'All') {
    filtered = filtered.filter(p => p.category === category);
  }
  if (artist) filtered = filtered.filter(p => artistOf(p) === artist);
  if (size) filtered = filtered.filter(p => size in p.prices);

  if (sort === 'featured') return filtered;
  return [...filtered].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'price-low') return (getLowestProductPrices(a).GBP || 0) - (getLowestProductPrices(b).GBP || 0);
    return (getLowestProductPrices(b).GBP || 0) - (getLowestProductPrices(a).GBP || 0);
  });
}
