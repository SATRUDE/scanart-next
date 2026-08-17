import { describe, it, expect } from 'vitest';
import { collections } from './collections';
import { getAllProducts } from './products';

// Collections are hand-picked, so the risks are a typo'd slug (a print that
// silently never shows) and a collection so thin the landing looks bare. Both
// are cheap to catch here and awkward to spot on a deployed page.
describe('collections', () => {
  it('every curated slug is a real product', async () => {
    const known = new Set((await getAllProducts()).map(p => p.slug));
    for (const collection of collections) {
      for (const slug of collection.productSlugs) {
        expect(known, `${collection.slug} lists unknown print "${slug}"`).toContain(slug);
      }
    }
  });

  it('carries at least three prints, so no landing reads as padding', () => {
    for (const collection of collections) {
      expect(collection.productSlugs.length, `${collection.slug} is too thin`).toBeGreaterThanOrEqual(3);
    }
  });

  it('lists no print twice within a collection', () => {
    for (const collection of collections) {
      expect(new Set(collection.productSlugs).size).toBe(collection.productSlugs.length);
    }
  });

  it('keeps slugs and chip labels unique', () => {
    expect(new Set(collections.map(c => c.slug)).size).toBe(collections.length);
    expect(new Set(collections.map(c => c.chipLabel)).size).toBe(collections.length);
  });

  it('declares which browse axis each one sits on', () => {
    for (const collection of collections) {
      expect(['subject', 'room']).toContain(collection.axis);
    }
  });
});
