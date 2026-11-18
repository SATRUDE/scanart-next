import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getShopProducts } from '@/lib/products';
import { collections } from '@/lib/collections';
import { allByArtist, isBuyable, pickRelatedPrints, withoutShown } from './related-prints';

type P = { slug: string; name: string; artistId?: string; category: string; inStock: boolean; published?: boolean; recommendedProducts?: string[] };
const print = (slug: string, over: Partial<P> = {}): P => ({ slug, name: slug.toUpperCase(), artistId: 'a', category: 'Botanical', inStock: true, published: true, ...over });
const slugs = (ps: P[]) => ps.map(p => p.slug);

describe('pickRelatedPrints', () => {
  it('takes three by the same artist first, in catalogue order, never the print itself', () => {
    const shop = [print('cur'), print('a1'), print('x', { artistId: 'b' }), print('a2'), print('a3'), print('a4')];
    expect(slugs(pickRelatedPrints(shop[0], shop, []))).toEqual(['a1', 'a2', 'a3']);
  });

  it('falls back to a collection the print is in, in the collection order', () => {
    const shop = [print('cur'), print('a1'), print('c1', { artistId: 'b' }), print('c2', { artistId: 'c' }), print('c3', { artistId: 'd' })];
    const picked = pickRelatedPrints(shop[0], shop, [{ productSlugs: ['nope'] }, { productSlugs: ['c3', 'cur', 'c2', 'c1'] }]);
    expect(slugs(picked)).toEqual(['a1', 'c3', 'c2']);
  });

  it('then to the print\'s own "More prints like this" picks, then its category', () => {
    const shop = [
      print('cur', { recommendedProducts: ['R1'] }),
      print('r1', { name: 'R1', artistId: 'b', category: 'Photography' }),
      print('k1', { artistId: 'c' }),
      print('k2', { artistId: 'd' }),
      print('other', { artistId: 'e', category: 'Abstract' }),
    ];
    expect(slugs(pickRelatedPrints(shop[0], shop, []))).toEqual(['r1', 'k1', 'k2']);
  });

  it('leaves out out of stock and coming soon prints, and never repeats one', () => {
    const shop = [print('cur'), print('sold', { inStock: false }), print('soon', { published: false }), print('a1'), print('a2')];
    const picked = pickRelatedPrints(shop[0], shop, [{ productSlugs: ['a1', 'a2', 'sold'] }]);
    expect(slugs(picked)).toEqual(['a1', 'a2']);
  });

  it('isBuyable treats a missing published flag as published', () => {
    expect(isBuyable({ inStock: true })).toBe(true);
    expect(isBuyable({ inStock: false, published: true })).toBe(false);
    expect(isBuyable({ inStock: true, published: false })).toBe(false);
  });
});

describe('heading and the lower row', () => {
  it('says "More by" only when all three are the artist\'s', () => {
    expect(allByArtist([print('x'), print('y')], 'a')).toBe(true);
    expect(allByArtist([print('x'), print('y', { artistId: 'b' })], 'a')).toBe(false);
    expect(allByArtist([], 'a')).toBe(false);
    expect(allByArtist([print('x')], undefined)).toBe(false);
  });
  it('drops prints already shown under the button from "More prints like this"', () => {
    expect(slugs(withoutShown([print('a'), print('b'), print('c')], [print('b')]))).toEqual(['a', 'c']);
  });
});

describe('the live catalogue', () => {
  it('gives every product page three buyable prints, none of them itself', async () => {
    const shop = await getShopProducts();
    expect(shop.length).toBeGreaterThan(3);
    for (const p of shop) {
      const picked = pickRelatedPrints(p, shop, collections);
      expect(picked, p.slug).toHaveLength(3);
      expect(picked.map(r => r.slug), p.slug).not.toContain(p.slug);
      expect(new Set(picked.map(r => r.slug)).size, p.slug).toBe(3);
      expect(picked.every(isBuyable), p.slug).toBe(true);
    }
  });
});

// The view and pages need a browser or Next to render, so the placement and
// the reuse are guarded in source, as lib/basket-bar.test.ts does.
describe('wiring', () => {
  const read = (f: string) => readFileSync(path.join(__dirname, '..', f), 'utf8');
  const view = read('components/v2/product/ProductView.tsx');
  const row = read('components/v2/prints/PrintRow.tsx');

  it('sits in the buying panel straight after the buying controls and before Details', () => {
    const actions = view.indexOf('<ProductActions ');
    const related = view.indexOf('aria-labelledby="related-prints"');
    const details = view.indexOf('t.questions.details');
    expect(actions).toBeGreaterThan(0);
    expect(related).toBeGreaterThan(actions);
    expect(details).toBeGreaterThan(related);
  });

  it('reuses one row module and the existing print card for both rows', () => {
    expect(view.match(/<PrintRow\b/g)).toHaveLength(2);
    expect(view).toContain('layout="three"');
    expect(view).not.toContain('<PrintCard');
    expect(row).toContain('<PrintCard');
    expect(row).toContain("variant={three ? 'compact' : 'default'}");
  });

  it('adds no scroll or visibility watcher (sticky controls never come and go)', () => {
    for (const src of [view, row]) {
      expect(src).not.toContain('IntersectionObserver');
      expect(src).not.toMatch(/addEventListener\('scroll'/);
    }
  });

  it('reads the shop once per page and derives the artist prints from it: no extra query', () => {
    for (const page of ['app/(en)/product/[slug]/page.tsx', 'app/(no)/no/product/[slug]/page.tsx']) {
      const src = read(page);
      expect(src, page).toContain('pickRelatedPrints(product, shop, collections)');
      expect(src, page).not.toContain('getProductsByArtist(');
      expect(src, page).toContain('recommended={withoutShown(recommended, related)}');
    }
  });
});
