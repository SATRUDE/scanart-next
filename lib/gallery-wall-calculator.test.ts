import { describe, expect, it } from 'vitest';
import {
  PRINT_SIZES,
  calculateGalleryWall,
  formatCentimetres,
  type PrintSizeKey,
} from './gallery-wall-calculator';

/** The old single-size case, expressed in the new model. */
const same = (size: PrintSizeKey, count: number): PrintSizeKey[] =>
  Array.from({ length: count }, () => size);

describe('calculateGalleryWall', () => {
  it('calculates the default arrangement and equal side margins', () => {
    expect(calculateGalleryWall({ wallWidth: 240, prints: same('50x70', 3), gap: 6 }))
      .toEqual({ totalWidth: 162, sideMargin: 39, overflow: 0, fitStatus: 'fit', gapStatus: 'recommended', rowHeight: 70 });
  });

  it('marks an arrangement that exactly fills the wall', () => {
    expect(calculateGalleryWall({ wallWidth: 162, prints: same('50x70', 3), gap: 6 }).fitStatus)
      .toBe('exact');
  });

  it('reports a tight fit separately from an arrangement that does not fit', () => {
    expect(calculateGalleryWall({ wallWidth: 170, prints: same('50x70', 3), gap: 9 }).fitStatus)
      .toBe('tight');
    expect(calculateGalleryWall({ wallWidth: 150, prints: same('50x70', 3), gap: 6 }))
      .toMatchObject({ fitStatus: 'no-fit', overflow: 12, sideMargin: 0 });
  });

  it('identifies gaps outside the article recommendation', () => {
    expect(calculateGalleryWall({ wallWidth: 240, prints: same('50x50', 2), gap: 4 }).gapStatus)
      .toBe('tight');
    expect(calculateGalleryWall({ wallWidth: 240, prints: same('50x50', 2), gap: 9 }).gapStatus)
      .toBe('wide');
  });

  it('formats whole and half centimetres without false precision', () => {
    expect(formatCentimetres(39)).toBe('39 cm');
    expect(formatCentimetres(12.5)).toBe('12.5 cm');
  });
});

describe('a wall of mixed sizes', () => {
  it('sums each print’s own width rather than multiplying one size', () => {
    // Both sold sizes are 50 wide, so width alone cannot prove the change
    // works. This is the arithmetic that must hold whatever the widths are.
    const mixed = calculateGalleryWall({
      wallWidth: 240,
      prints: ['50x70', '50x50', '50x70'],
      gap: 6,
    });
    expect(mixed.totalWidth).toBe(162);
    expect(mixed.sideMargin).toBe(39);
  });

  it('takes the row height from the TALLEST print, not the first or the last', () => {
    // The real consequence of mixing sizes: what the group clears on the wall.
    expect(calculateGalleryWall({ wallWidth: 240, prints: ['50x50', '50x70', '50x50'], gap: 6 }).rowHeight).toBe(70);
    expect(calculateGalleryWall({ wallWidth: 240, prints: ['50x70', '50x50'], gap: 6 }).rowHeight).toBe(70);
    expect(calculateGalleryWall({ wallWidth: 240, prints: ['50x50', '50x50'], gap: 6 }).rowHeight).toBe(50);
  });

  it('is unaffected by the order the prints are hung in', () => {
    const a = calculateGalleryWall({ wallWidth: 240, prints: ['50x70', '50x50', '50x50'], gap: 6 });
    const b = calculateGalleryWall({ wallWidth: 240, prints: ['50x50', '50x50', '50x70'], gap: 6 });
    expect(a).toEqual(b);
  });

  it('charges a gap for every join and none at the ends', () => {
    const one = calculateGalleryWall({ wallWidth: 240, prints: ['50x70'], gap: 6 });
    expect(one.totalWidth).toBe(50);
    const two = calculateGalleryWall({ wallWidth: 240, prints: ['50x70', '50x50'], gap: 6 });
    expect(two.totalWidth).toBe(106);
  });

  it('handles an empty wall without dividing by anything', () => {
    expect(calculateGalleryWall({ wallWidth: 240, prints: [], gap: 6 }))
      .toMatchObject({ totalWidth: 0, rowHeight: 0, overflow: 0, fitStatus: 'fit' });
  });

  it('still catches a mixed row that overflows', () => {
    const tooMany = calculateGalleryWall({
      wallWidth: 150,
      prints: ['50x70', '50x50', '50x70'],
      gap: 6,
    });
    expect(tooMany).toMatchObject({ fitStatus: 'no-fit', overflow: 12, sideMargin: 0 });
  });
});

describe('PRINT_SIZES', () => {
  it('offers only the sizes the catalogue actually sells', () => {
    // config/frame.ts declares five FRAME_SIZES because the frame price table
    // covers all five, but products.json offers exactly two. Listing a size
    // here that cannot be bought would plan a wall out of prints that do not
    // exist. If this fails, check the catalogue before changing the number.
    expect(Object.keys(PRINT_SIZES).sort()).toEqual(['50x50', '50x70']);
  });

  it('describes each size in the units a person hangs prints in', () => {
    expect(PRINT_SIZES['50x70']).toMatchObject({ width: 50, height: 70 });
    expect(PRINT_SIZES['50x50']).toMatchObject({ width: 50, height: 50 });
  });
});
