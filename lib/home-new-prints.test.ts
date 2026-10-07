import { describe, it, expect } from 'vitest';
import { artists } from '@/data/artists';
import { getHomeData, newestArtistSlugs } from './home';

describe('homepage New prints', () => {
  const roster = [
    { id: '1', slug: 'a' }, { id: '2', slug: 'b' }, { id: '3', slug: 'c' }, { id: '4', slug: 'd' }, { id: '5', slug: 'e' },
  ];
  const products = [
    { slug: 'a1', artistId: '1' }, { slug: 'b1', artistId: '2' }, { slug: 'b2', artistId: '2' },
    { slug: 'c1', artistId: '3' }, { slug: 'd1', artistId: '4' }, { slug: 'd2', artistId: '4' },
  ];
  const created = { a1: '2026-01-01', b1: '2026-02-01', b2: '2026-09-01', c1: '2026-03-01', d1: '2026-03-01', d2: '2026-03-02' };

  it('takes the three artists who arrived most recently, newest first', () => {
    // b arrived on its FIRST print (2026-02-01), so a later extra print does not bump it;
    // c and d tie on a date, and d is later in the roster.
    expect(newestArtistSlugs(roster, products, created)).toEqual(['d', 'c', 'b']);
  });

  it('rotates in a newly added artist and drops the oldest', () => {
    const next = [...products, { slug: 'e1', artistId: '5' }];
    expect(newestArtistSlugs(roster, next, { ...created, e1: '2026-10-01' })).toEqual(['e', 'd', 'c']);
  });

  it('skips an artist with no prints', () => {
    expect(newestArtistSlugs(roster, products, created, 5)).not.toContain('e');
  });

  it('shows one print per artist, each artist once', async () => {
    const { newPrints } = await getHomeData();
    expect(newPrints).toHaveLength(3);
    const owners = newPrints.map(t => artists.find(a => a.id === t.product.artistId)?.slug);
    expect(new Set(owners).size).toBe(3);
    expect(owners).toEqual(['emma-iben', 'patrik-wennerlund', 'markus-naarttijarvi']);
  });
});
