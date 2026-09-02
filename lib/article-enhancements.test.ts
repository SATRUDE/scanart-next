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
});

