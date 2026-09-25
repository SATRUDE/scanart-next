import { describe, it, expect } from 'vitest';
import { highlight, searchIndex, type SearchIndex } from './site-search';

const print = (name: string, artist: string, category: string) => ({
  id: name, slug: name.toLowerCase(), name, artist, brand: '', category, image: '', inStock: true, prices: {}, href: `/product/${name.toLowerCase()}`,
});

const index: SearchIndex = {
  prints: [print('Slingshot', 'Simen Wahlqvist', 'Illustrations'), print('Dancer', 'Helene Brox', 'Abstract')],
  artists: [{ slug: 'simen-wahlqvist', name: 'Simen Wahlqvist', line: '', city: 'Oslo', image: '', printCount: 5, href: '/artist/simen-wahlqvist' }],
  stories: [{ slug: 'illustrators', title: 'Scandinavian illustrators', category: 'Guide', tags: [], image: '', imageAlt: '', href: '/article/illustrators' }],
  popular: [],
  productsHref: '/products',
  inspireHref: '/inspire',
};

describe('overlay search', () => {
  // The overlay's "See all" count must equal the /products?q= grid, which
  // matches name, artist and category case-insensitively (ProductsGrid).
  it('matches prints on name, artist and category, as the Prints page does', () => {
    expect(searchIndex(index, 'sling').prints).toHaveLength(1);
    expect(searchIndex(index, 'SIMEN').prints).toHaveLength(1);
    expect(searchIndex(index, 'abstract').prints.map(p => p.name)).toEqual(['Dancer']);
  });

  it('counts artists and stories into the total', () => {
    const r = searchIndex(index, 'illustrat');
    expect(r.prints).toHaveLength(1);
    expect(r.stories).toHaveLength(1);
    expect(r.total).toBe(2);
  });

  it('treats an empty or blank query as no search', () => {
    expect(searchIndex(index, '   ').total).toBe(0);
  });

  it('finds nothing for a word the catalogue does not have', () => {
    expect(searchIndex(index, 'blåbær').total).toBe(0);
  });

  it('splits a label around the typed letters for the highlight', () => {
    expect(highlight('Simen Wahlqvist', 'sim')).toEqual(['', 'Sim', 'en Wahlqvist']);
    expect(highlight('Simen Wahlqvist', 'zzz')).toEqual(['Simen Wahlqvist', '', '']);
  });
});
