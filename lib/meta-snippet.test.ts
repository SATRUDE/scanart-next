import { describe, expect, it } from 'vitest';

import { META_SNIPPET_MAX_LENGTH, clipToLength, metaSnippet } from './meta-snippet';
import productsData from '../public/notion-data/products.json';
import articlesData from '../public/notion-data/articles.json';

describe('metaSnippet', () => {
  it('takes the first sentence when the copy runs on', () => {
    // The real case: Renate Thor's bio is 712 characters, so the live meta
    // description was cut about a fifth of the way in, mid-sentence.
    const bio =
      'Renate Thor is a Trondheim-born, Oslo-based illustrator, artist and graphic artist. ' +
      'She is known for playful artworks and illustrations with bold colours and compositions. ' +
      'She is driven by the process of her craft.';
    expect(metaSnippet(bio)).toBe(
      'Renate Thor is a Trondheim-born, Oslo-based illustrator, artist and graphic artist.'
    );
  });

  it('leaves a bio that is already one short sentence exactly as it is', () => {
    // Three of the five artists have bios like this. Trimming must not make a
    // thin description thinner.
    const bio = 'Helene Brox is an artist and illustrator based in Oslo, Norway.';
    expect(metaSnippet(bio)).toBe(bio);
  });

  it('handles Norwegian copy the same way', () => {
    const bio =
      'Renate Thor er en illustratør, kunstner og grafiker født i Trondheim og bosatt i Oslo. ' +
      'Hun er kjent for lekne kunstverk og illustrasjoner med djerve farger.';
    expect(metaSnippet(bio)).toBe(
      'Renate Thor er en illustratør, kunstner og grafiker født i Trondheim og bosatt i Oslo.'
    );
  });

  it('never emits more than the cap, even from a single long sentence', () => {
    const runOn = `${'word '.repeat(80).trim()}.`;
    const result = metaSnippet(runOn);
    expect(result.length).toBeLessThanOrEqual(META_SNIPPET_MAX_LENGTH);
    expect(result.endsWith('…')).toBe(true);
  });

  it('cuts a long sentence at a word boundary, not through a word', () => {
    const runOn = `${'alpha bravo charlie delta '.repeat(10).trim()}.`;
    const result = metaSnippet(runOn);
    // Everything before the ellipsis is whole words from the source.
    const body = result.slice(0, -1);
    expect(runOn.startsWith(body)).toBe(true);
    expect(body.endsWith(' ')).toBe(false);
  });

  it('collapses stray whitespace so the tag is a single clean line', () => {
    expect(metaSnippet('  Two   spaces\nand a newline.  More text here. ')).toBe(
      'Two spaces and a newline.'
    );
  });

  it('returns an empty string for empty or blank copy', () => {
    expect(metaSnippet('')).toBe('');
    expect(metaSnippet('   \n  ')).toBe('');
  });

  it('respects an explicit shorter cap', () => {
    const result = metaSnippet('The quick brown fox jumps over the lazy dog and keeps going.', 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith('…')).toBe(true);
  });

  it('matches the inline logic the product page used, for every catalogue description', () => {
    // The product page is being moved onto this helper, so its output must not
    // move. This asserts the refactor is a no-op against the real catalogue.
    const products = productsData as unknown as { description?: string }[];
    const descriptions = products.map(p => p.description).filter((d): d is string => Boolean(d));
    expect(descriptions.length).toBeGreaterThan(0);

    for (const desc of descriptions) {
      const previous = desc.includes('. ') ? `${desc.split('. ')[0]}.` : desc;
      expect(metaSnippet(desc)).toBe(previous);
    }
  });
});

describe('clipToLength', () => {
  it('leaves copy that already fits exactly as it is', () => {
    const excerpt =
      'Five Nordic photography books that look north, from Arctic light to the quiet of a Finnish forest.';
    expect(excerpt.length).toBeLessThanOrEqual(META_SNIPPET_MAX_LENGTH);
    expect(clipToLength(excerpt)).toBe(excerpt);
  });

  it('cuts an over-long excerpt at a word boundary and marks the cut', () => {
    const result = clipToLength('The quick brown fox jumps over the lazy dog and keeps going.', 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toContain('  ');
    // Never mid-word: everything before the ellipsis is whole words.
    expect('The quick brown fox jumps over the lazy dog and keeps going.').toContain(
      result.slice(0, -1)
    );
  });

  it('keeps the teaser where metaSnippet would have thrown most of it away', () => {
    // The reason articles do not use metaSnippet: an excerpt opening on a hook
    // rather than a summary loses the substance to the first-sentence rule.
    const excerpt =
      'Say abstract art and most people picture mid-century New York. The Nordic version arrived by ' +
      'a different route, through landscape and folk pattern, and it looks different for it.';
    expect(metaSnippet(excerpt).length).toBeLessThan(70);
    expect(clipToLength(excerpt).length).toBeGreaterThan(140);
  });

  it('brings every journal excerpt inside the snippet slot', () => {
    const excerpts = (articlesData as { excerpt: string }[]).map(a => a.excerpt);
    expect(excerpts.length).toBeGreaterThan(0);
    for (const excerpt of excerpts) {
      expect(clipToLength(excerpt).length).toBeLessThanOrEqual(META_SNIPPET_MAX_LENGTH);
    }
  });

  it('normalises whitespace and handles blank copy', () => {
    expect(clipToLength('  two   words  ')).toBe('two words');
    expect(clipToLength('   ')).toBe('');
  });
});
