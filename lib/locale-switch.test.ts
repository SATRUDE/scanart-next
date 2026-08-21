import { describe, it, expect } from 'vitest';
import { currentLocale, localeOptions, twinMissing } from './locale-switch';

describe('the language half of the header control', () => {
  it('offers Norwegian on a page that has a twin', () => {
    const opts = localeOptions('/category/botanical');
    expect(opts.find(o => o.code === 'no')?.href).toBe('/no/category/botanical');
    expect(currentLocale('/category/botanical')).toBe('en');
  });

  it('offers English back from inside the Norwegian tree', () => {
    const opts = localeOptions('/no/collection/kitchen');
    expect(opts.find(o => o.code === 'en')?.href).toBe('/collection/kitchen');
    expect(currentLocale('/no/collection/kitchen')).toBe('no');
  });

  it('marks the page you are already on as current, with nowhere to go', () => {
    const opts = localeOptions('/artists');
    expect(opts.find(o => o.code === 'en')).toMatchObject({ current: true, href: null });
  });

  it('reports NO twin on a product or an article, which is the real gap', () => {
    // 16 products and 18 articles have no Norwegian version. The control must
    // say so rather than appear to work.
    expect(localeOptions('/product/swallow-dive').find(o => o.code === 'no')?.href).toBeNull();
    expect(twinMissing('/product/swallow-dive')).toBe(true);
    expect(localeOptions('/article/what-is-scandinavian-art').find(o => o.code === 'no')?.href).toBeNull();
    expect(twinMissing('/article/what-is-scandinavian-art')).toBe(true);
  });

  it('does not claim a twin is missing when you are simply already on the Norwegian one', () => {
    expect(twinMissing('/no/artists')).toBe(false);
  });

  it('handles the two homepages', () => {
    expect(localeOptions('/').find(o => o.code === 'no')?.href).toBe('/no');
    expect(localeOptions('/no').find(o => o.code === 'en')?.href).toBe('/');
  });
});
