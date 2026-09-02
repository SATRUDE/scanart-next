import { describe, expect, it } from 'vitest';
import { calculateGalleryWall, formatCentimetres } from './gallery-wall-calculator';

describe('calculateGalleryWall', () => {
  it('calculates the default arrangement and equal side margins', () => {
    expect(calculateGalleryWall({ wallWidth: 240, printSize: '50x70', frameCount: 3, gap: 6 }))
      .toEqual({ totalWidth: 162, sideMargin: 39, overflow: 0, fitStatus: 'fit', gapStatus: 'recommended' });
  });

  it('marks an arrangement that exactly fills the wall', () => {
    expect(calculateGalleryWall({ wallWidth: 162, printSize: '50x70', frameCount: 3, gap: 6 }).fitStatus)
      .toBe('exact');
  });

  it('reports a tight fit separately from an arrangement that does not fit', () => {
    expect(calculateGalleryWall({ wallWidth: 170, printSize: '50x70', frameCount: 3, gap: 9 }).fitStatus)
      .toBe('tight');
    expect(calculateGalleryWall({ wallWidth: 150, printSize: '50x70', frameCount: 3, gap: 6 }))
      .toMatchObject({ fitStatus: 'no-fit', overflow: 12, sideMargin: 0 });
  });

  it('identifies gaps outside the article recommendation', () => {
    expect(calculateGalleryWall({ wallWidth: 240, printSize: '50x50', frameCount: 2, gap: 4 }).gapStatus)
      .toBe('tight');
    expect(calculateGalleryWall({ wallWidth: 240, printSize: '50x50', frameCount: 2, gap: 9 }).gapStatus)
      .toBe('wide');
  });

  it('formats whole and half centimetres without false precision', () => {
    expect(formatCentimetres(39)).toBe('39 cm');
    expect(formatCentimetres(12.5)).toBe('12.5 cm');
  });
});
