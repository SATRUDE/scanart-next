import { describe, it, expect } from 'vitest';
import { selectRelatedArticles } from './related-articles';
import type { Article } from './articles';

// The shape of the journal on 2026-09-08, reduced: a hand-cross-linked book
// series, and a new Guide that names three of them and is named by none.
function art(slug: string, over: Partial<Article> = {}): Article {
  return {
    id: slug,
    title: slug,
    slug,
    excerpt: '',
    category: 'Guide',
    featured: false,
    image: '',
    author: '',
    tags: [],
    relatedArticles: [],
    selectedArtworkIds: [],
    published: true,
    created_time: '2026-07-01T00:00:00.000Z',
    last_edited_time: '2026-07-01T00:00:00.000Z',
    ...over,
  };
}

const books = art('nordic-art-and-design-books', { relatedArticles: ['nordic-artist-monographs', 'what-is-scandinavian-art'] });
const monographs = art('nordic-artist-monographs', { relatedArticles: ['nordic-art-and-design-books', 'what-is-scandinavian-art'] });
const whatIs = art('what-is-scandinavian-art', { category: 'About', relatedArticles: ['nordic-art-and-design-books'] });
const illustrators = art('scandinavian-illustrators', {
  relatedArticles: ['what-is-scandinavian-art', 'nordic-artist-monographs', 'nordic-art-and-design-books'],
  published_time: '2026-08-31T00:00:00.000Z',
});
const botanical = art('nordic-botanical-prints', {
  relatedArticles: ['what-is-scandinavian-art'],
  published_time: '2026-09-02T00:00:00.000Z',
});
const oslo = art('art-in-oslo-july-2026', { category: 'Exhibitions', created_time: '2026-07-20T00:00:00.000Z' });
const draft = art('bedroom-wall-art-ideas', { published: false, relatedArticles: ['nordic-art-and-design-books'] });

const all = [books, monographs, whatIs, illustrators, botanical, oslo, draft];
const slugs = (xs: Article[]) => xs.map(a => a.slug);

describe('selectRelatedArticles', () => {
  it('keeps the curated list first, in the author\'s order', () => {
    expect(slugs(selectRelatedArticles(illustrators, all)).slice(0, 3)).toEqual([
      'what-is-scandinavian-art',
      'nordic-artist-monographs',
      'nordic-art-and-design-books',
    ]);
  });

  it('links back to every published article that names this one, newest first', () => {
    // what-is-scandinavian-art is named by books, monographs, illustrators, botanical
    // and the unpublished draft. Its own list is just books.
    expect(slugs(selectRelatedArticles(whatIs, all))).toEqual([
      'nordic-art-and-design-books', // curated
      'nordic-botanical-prints',     // reciprocal, published 2 Sep
      'scandinavian-illustrators',   // reciprocal, published 31 Aug
      'nordic-artist-monographs',    // reciprocal, created 1 Jul
    ]);
  });

  it('so a new article is reachable from the pieces it names', () => {
    for (const older of [books, monographs, whatIs]) {
      expect(slugs(selectRelatedArticles(older, all))).toContain('scandinavian-illustrators');
    }
  });

  it('never includes the article itself, a draft, or a duplicate', () => {
    for (const a of all.filter(a => a.published)) {
      const out = slugs(selectRelatedArticles(a, all));
      expect(out).not.toContain(a.slug);
      expect(out).not.toContain('bedroom-wall-art-ideas');
      expect(new Set(out).size).toBe(out.length);
    }
  });

  it('fills to the minimum from the same category first, newest first, then anything', () => {
    // oslo names nobody and nobody names it.
    const out = slugs(selectRelatedArticles(oslo, all));
    expect(out).toHaveLength(3);
    // No other Exhibitions piece exists, so the fill is the newest Guides/About.
    expect(out).toEqual(['nordic-botanical-prints', 'scandinavian-illustrators', 'nordic-art-and-design-books']);
  });

  it('does not pad a list that already meets the minimum', () => {
    const out = selectRelatedArticles(illustrators, all);
    // Curated 3 + nobody names illustrators yet = exactly 3, no fill.
    expect(out).toHaveLength(3);
  });

  it('shows the whole curated list but stops adding reciprocal links at the cap', () => {
    const hub = art('hub', { relatedArticles: ['a', 'b'] });
    const fans = Array.from({ length: 12 }, (_, i) =>
      art(`fan-${i}`, { relatedArticles: ['hub'], created_time: `2026-08-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` }),
    );
    const out = slugs(selectRelatedArticles(hub, [hub, art('a'), art('b'), ...fans]));
    expect(out.slice(0, 2)).toEqual(['a', 'b']);
    expect(out).toHaveLength(9);
    expect(out[2]).toBe('fan-11'); // newest reciprocal first
    const wide = art('wide', { relatedArticles: Array.from({ length: 11 }, (_, i) => `fan-${i}`) });
    expect(selectRelatedArticles(wide, [wide, ...fans])).toHaveLength(11); // curated never truncated
  });

  it('tolerates a curated slug that no longer exists', () => {
    const stale = art('stale', { relatedArticles: ['gone-away', 'nordic-art-and-design-books'] });
    expect(slugs(selectRelatedArticles(stale, [...all, stale]))).toContain('nordic-art-and-design-books');
    expect(slugs(selectRelatedArticles(stale, [...all, stale]))).not.toContain('gone-away');
  });
});
