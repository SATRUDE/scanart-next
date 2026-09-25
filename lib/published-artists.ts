import { artists, type Artist } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';

export type PublishedArtist = Artist & { printCount: number };

/**
 * Artists with at least one published print, most prints first; ties keep
 * the roster order. Only these get a page, so only these are linked
 * (Explore the shop, the homepage, "More artists").
 */
export async function getPublishedArtists(): Promise<PublishedArtist[]> {
  const out: PublishedArtist[] = [];
  for (const artist of artists) {
    const products = await getProductsByArtist(artist.id);
    if (products.length > 0) out.push({ ...artist, printCount: products.length });
  }
  return out.sort((a, b) => b.printCount - a.printCount);
}
