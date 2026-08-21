import { describe, it, expect } from 'vitest';
import { collections } from './collections';
import { categoryLandings } from './categories';
import { no } from './i18n/no';
import { noPathFor } from './i18n';

// The Norwegian pages fall back to the English copy when a translation is
// missing, which keeps a page from 404ing but fails silently: a mistyped key or
// a landing added without its translation ships an English page on a /no URL,
// which is worse than useless because hreflang then promises Norwegian. These
// tests make that failure loud, and are cheap next to spotting it on a deploy.
describe('Norwegian dictionary', () => {
  it('translates every collection landing', () => {
    for (const c of collections) {
      expect(no.collections[c.slug], `no translation for collection "${c.slug}"`).toBeDefined();
    }
  });

  it('translates every category landing', () => {
    for (const c of categoryLandings) {
      expect(no.categories[c.slug], `no translation for category "${c.slug}"`).toBeDefined();
    }
  });

  it('gives every collection a Norwegian cross-link label', () => {
    for (const c of collections) {
      expect(
        no.crossLinks.collectionLabels[c.slug],
        `no cross-link label for collection "${c.slug}"`
      ).toBeTruthy();
    }
  });

  it('matches the English styling-card count, so no card loses its words', () => {
    for (const c of collections) {
      const copy = no.collections[c.slug];
      if (!copy) continue;
      expect(
        copy.stylingCards?.length ?? 0,
        `styling-card count differs for "${c.slug}"`
      ).toBe(c.stylingCards?.length ?? 0);
    }
  });

  it('carries a styling tip list for every collection', () => {
    for (const c of collections) {
      const copy = no.collections[c.slug];
      if (!copy) continue;
      expect(copy.stylingTips.length, `"${c.slug}" has no Norwegian styling tips`).toBeGreaterThan(0);
    }
  });

  it('uses no em dashes anywhere: the house rule, in both languages', () => {
    const offenders: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (value.includes('—')) offenders.push(path);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, `${path}[${i}]`));
        return;
      }
      if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    walk(no, 'no');
    expect(offenders, `em dashes found at: ${offenders.join(', ')}`).toEqual([]);
  });

  it('maps a collection path to its Norwegian twin', () => {
    expect(noPathFor('/collection/living-room')).toBe('/no/collection/living-room');
    expect(noPathFor('/category/botanical')).toBe('/no/category/botanical');
    // products and articles stay English in phase 1, so they have no twin
    expect(noPathFor('/product/swallow-dive')).toBeNull();
    expect(noPathFor('/article/what-is-scandinavian-art')).toBeNull();
  });
});
