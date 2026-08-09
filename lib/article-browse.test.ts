import { describe, expect, it } from 'vitest';

import { getBrowseLinksForArticle, browseLinkTargets } from '@/lib/article-browse';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';

// Every destination the map is allowed to point at. A "Keep browsing" link
// that 404s would be worse than no link at all, and a typo in a slug is the
// easy way to get one.
const validHrefs = new Set<string>([
  '/products',
  '/artists',
  '/scandinavian-wall-art',
  ...categoryLandings.map(c => `/category/${c.slug}`),
  ...collections.map(c => `/collection/${c.slug}`),
]);

describe('browse links', () => {
  it('only ever points at a landing page that exists', () => {
    for (const [slug, links] of Object.entries(browseLinkTargets)) {
      for (const link of links) {
        expect(validHrefs, `${slug} links to ${link.href}`).toContain(link.href);
      }
    }
  });

  it('gives every mapped article a described, non-empty anchor', () => {
    for (const [slug, links] of Object.entries(browseLinkTargets)) {
      expect(links.length, `${slug} has no links`).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.label.trim(), `${slug} has a blank label`).not.toBe('');
      }
    }
  });

  it('never repeats the same destination within one article', () => {
    for (const [slug, links] of Object.entries(browseLinkTargets)) {
      const hrefs = links.map(l => l.href);
      expect(new Set(hrefs).size, `${slug} repeats a destination`).toBe(hrefs.length);
    }
  });

  it('covers the three articles that were rendering no block', () => {
    for (const slug of [
      'what-is-scandinavian-art',
      'create-an-art-wall',
      'scandinavian-wall-decor-ideas',
    ]) {
      expect(getBrowseLinksForArticle(slug).length, `${slug} has no browse links`).toBeGreaterThan(0);
    }
  });

  it('returns nothing for an article with no curated entry', () => {
    expect(getBrowseLinksForArticle('an-article-that-does-not-exist')).toEqual([]);
  });
});
