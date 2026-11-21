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

  // One row of three, placed twice: in the buying panel on phones, and as a
  // full row under the product from tablet up (Mark, 18 Nov 2026: "on desktop
  // it's broken and should be a full row and has to come under the accordion.
  // Then on mobile we can have this version").
  const helper = view.slice(view.indexOf('const relatedRow ='), view.indexOf('  return (\n    <div className="page-x'));
  const panel = view.indexOf("relatedRow('related-prints', 'under-basket', 'tab:hidden')");
  const wide = view.indexOf("relatedRow('related-prints-wide', 'below-product', 'hidden tab:block mt-section')");

  it('on phones sits in the buying panel straight after the buying controls and before Details', () => {
    const actions = view.indexOf('<ProductActions ');
    const details = view.indexOf('t.questions.details');
    expect(actions).toBeGreaterThan(0);
    expect(panel).toBeGreaterThan(actions);
    expect(details).toBeGreaterThan(panel);
  });

  it('from tablet up is a full row under the product, after the accordions and before the artist', () => {
    const about = view.indexOf('t.questions.about');
    const artistSection = view.indexOf('aria-labelledby="about-the-artist"');
    const moreLikeThis = view.indexOf('aria-labelledby="more-prints"');
    expect(wide).toBeGreaterThan(about);
    expect(artistSection).toBeGreaterThan(wide);
    expect(moreLikeThis).toBeGreaterThan(wide);
    // Outside the product grid: the grid's closing tags come before it, so the
    // row sits on the page's content edges like "More prints like this".
    expect(view.slice(about, wide)).toMatch(/<\/div>\s*<\/div>\s*<\/div>\s*\n/);
  });

  it('is displayed at exactly one width each: CSS only, no user-agent or client check', () => {
    expect(view.match(/relatedRow\(/g)).toHaveLength(2);
    expect(view).not.toMatch(/useMediaQuery|matchMedia|user-?agent|headers\(\)/i);
    expect(view).not.toContain("'use client'");
  });

  it('reuses one row module and the existing print card for both rows', () => {
    expect(view.match(/<PrintRow\b/g)).toHaveLength(2);
    expect(view).not.toContain('<PrintCard');
    expect(row).toContain('<PrintCard');
  });

  // Mark, 18 Nov 2026: "more like this part so it's not so tiny". The related
  // prints use the same section header and the same row of full-size cards as
  // "More prints like this", with no layout or card variant of their own.
  it('shows the related prints at the same size and with the same header as "More prints like this"', () => {
    expect(helper).toContain('<SectionHeader id={id}');
    expect(helper).toContain('aria-labelledby={id}');
    expect(helper).toContain('className="mt-band"');
    expect(view).not.toMatch(/layout=|fit=/);
    expect(row).not.toMatch(/layout\??:|fit\??:|'three'|compact/);
    expect(read('components/PrintCard.tsx')).not.toContain('compact');
    expect(row).toContain('w-[240px] shrink-0');
    // Three across on desktop, the same grid as "More prints like this".
    expect(row).toContain('tab:grid');
    expect(row).toContain('desk:grid-cols-3');
  });

  // Mark, 18 Nov 2026: "it can be scrolled up and down instead of just left
  // and right". overflow-x: auto alone makes overflow-y auto as well, so the
  // row must close the vertical axis itself and never claim every touch axis.
  it('scrolls sideways only on phones, without taking the page scroll', () => {
    expect(row).toMatch(/overflow-x-auto overflow-y-hidden overscroll-x-contain/);
    expect(row).toContain('snap-x snap-mandatory');
    expect(row).toContain('snap-start');
    expect(row).not.toMatch(/snap-y|snap-both|touch-none|touch-action/);
    expect(row).toContain('className="block"');
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
