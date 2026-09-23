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

  it.each(['/products', '/product/swallow-dive', '/inspire', '/journal', '/privacy', '/terms', '/scandinavian-wall-art', '/feedback'])(
    'offers a round trip to Norwegian on %s', path => {
      expect(localeOptions(path).find(o => o.code === 'no')?.href).toBe(`/no${path}`);
      expect(twinMissing(path)).toBe(false);
      expect(localeOptions(`/no${path}`).find(o => o.code === 'en')?.href).toBe(path);
    },
  );

  it.each(['/article/what-is-scandinavian-art', '/gallery-wall-planner', '/nordic-art', '/product/a/nested-path', '/checkout'])(
    'does not offer an unavailable or separately scoped destination on %s', path => {
      expect(localeOptions(path).find(o => o.code === 'no')?.href).toBeNull();
      expect(twinMissing(path)).toBe(true);
    },
  );

  it('does not claim a twin is missing when you are simply already on the Norwegian one', () => {
    expect(twinMissing('/no/artists')).toBe(false);
  });

  it('handles the two homepages', () => {
    expect(localeOptions('/').find(o => o.code === 'no')?.href).toBe('/no');
    expect(localeOptions('/no').find(o => o.code === 'en')?.href).toBe('/');
  });
});
