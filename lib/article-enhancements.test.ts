import { describe, expect, it } from 'vitest';
import { galleryWallCalculatorInsertionIndex } from './article-enhancements';

const blocks = [
  { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Space the pieces like they know each other' }] } },
  { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Keep 5 to 8 cm between frames.' }] } },
  { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Mix sizes' }] } },
];

describe('galleryWallCalculatorInsertionIndex', () => {
  it('places the calculator after the spacing advice in the gallery-wall guide', () => {
    expect(galleryWallCalculatorInsertionIndex(blocks, 'create-an-art-wall')).toBe(1);
  });

  it('does not alter other articles', () => {
    expect(galleryWallCalculatorInsertionIndex(blocks, 'another-article')).toBe(-1);
  });

  it('fails closed if the authored heading changes', () => {
    expect(galleryWallCalculatorInsertionIndex(blocks.slice(1), 'create-an-art-wall')).toBe(-1);
  });

  it.each([
    ['scandinavian-wall-decor-ideas', '2. A gallery wall with breathing room'],
    ['complete-guide-choosing-print-sizes', 'The tape test: try before you buy'],
    ['how-to-style-scandinavian-wall-art-living-room', 'The feature wall'],
  ])('places one teaser after the relevant advice in %s', (slug, heading) => {
    const article = [
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Opening.' }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ plain_text: heading }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Relevant advice.' }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'More advice.' }] } },
    ];
    expect(galleryWallCalculatorInsertionIndex(article, slug)).toBe(2);
  });

  it('does not place a teaser in the next section when advice is absent', () => {
    const article = [blocks[0], blocks[2], blocks[1]];
    expect(galleryWallCalculatorInsertionIndex(article, 'create-an-art-wall')).toBe(-1);
  });

  it('skips a missing slug or a renamed heading', () => {
    expect(galleryWallCalculatorInsertionIndex(blocks)).toBe(-1);
    expect(galleryWallCalculatorInsertionIndex(blocks, 'scandinavian-wall-decor-ideas')).toBe(-1);
  });

});

