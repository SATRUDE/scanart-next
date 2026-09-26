/**
 * Client-side search over the overlay's index (built by lib/search-index.ts on
 * the server). Pure functions, no I/O, so the Header's bundle stays free of
 * anything that reads the catalogue from disk.
 */

type Prices = { [size: string]: { GBP: number; NOK: number; USD: number; DKK: number; SEK: number } };

export interface SearchPrint {
  id: string;
  slug: string;
  name: string;
  artist: string;
  artistId?: string;
  brand: string;
  category: string;
  image: string;
  inStock: boolean;
  prices: Prices;
  href: string;
}

export interface SearchArtist {
  slug: string;
  name: string;
  line: string;
  city: string;
  image: string;
  printCount: number;
  href: string;
}

export interface SearchStory {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  image: string;
  imageAlt: string;
  href: string;
  /**
   * Published artists the story names in its text (full names only), so a
   * search for an artist finds the stories about them. Built on the server
   * from the article itself; never guessed.
   */
  artists?: string[];
}

export interface SearchIndex {
  prints: SearchPrint[];
  artists: SearchArtist[];
  stories: SearchStory[];
  popular: { label: string; href: string }[];
  /** Locale-prefixed /products, the catalogue (the Prints section links to its ?q=). */
  productsHref: string;
  /** Locale-prefixed /search, the results page the form submits to. */
  searchHref: string;
  inspireHref: string;
}

/** The results tabs, on the overlay and the search page (&tab= in the URL). */
export type SearchTab = 'all' | 'prints' | 'artists' | 'stories';
export const SEARCH_TABS: readonly SearchTab[] = ['all', 'prints', 'artists', 'stories'];

/** Fills "{n} results for “{q}”" style templates from the search strings. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

export interface SearchResults {
  prints: SearchPrint[];
  artists: SearchArtist[];
  stories: SearchStory[];
  total: number;
}

/**
 * Lower case and trimmed, nothing cleverer: ProductsGrid matches /products?q=
 * the same way, and the overlay's "See all" count must equal what that grid
 * then shows.
 */
export function normalise(s: string): string {
  return s.toLowerCase().trim();
}

export function searchIndex(index: SearchIndex, query: string): SearchResults {
  const q = normalise(query);
  if (!q) return { prints: [], artists: [], stories: [], total: 0 };
  const has = (s: string) => normalise(s).includes(q);
  // Prints match on name, artist and category: the fields ProductsGrid
  // matches for /products?q=, so "See all" and the Prints page agree.
  const prints = index.prints.filter(p => has(p.name) || has(p.artist) || has(p.category));
  const artists = index.artists.filter(a => has(a.name));
  // Stories also match on the artists they name, so "sim" finds the pieces
  // that write about Simen Wahlqvist as well as his prints and his page.
  const stories = index.stories.filter(s => has(s.title) || has(s.category) || s.tags.some(has) || (s.artists ?? []).some(has));
  return { prints, artists, stories, total: prints.length + artists.length + stories.length };
}

/**
 * Splits a label around the first match of the query, for the typing state's
 * highlight ("Sim" in text-accent, then "en Wahlqvist").
 */
export function highlight(label: string, query: string): [string, string, string] {
  const q = normalise(query);
  const at = q ? label.toLowerCase().indexOf(q) : -1;
  if (at < 0) return [label, '', ''];
  return [label.slice(0, at), label.slice(at, at + q.length), label.slice(at + q.length)];
}
