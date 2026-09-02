import { describe, expect, it } from 'vitest';
import {
  PRINT_SIZES,
  calculateGalleryWall,
  formatCentimetres,
  movePrintTo,
  type PrintSizeKey,
} from './gallery-wall-calculator';

const row = (size: PrintSizeKey, count: number): PrintSizeKey[] =>
  Array.from({ length: count }, () => size);

describe('a single row', () => {
  it('calculates the default arrangement and equal side margins', () => {
    const r = calculateGalleryWall({ wallWidth: 240, rows: [row('50x70', 3)], gap: 6 });
    expect(r).toMatchObject({ totalWidth: 162, sideMargin: 39, overflow: 0, fitStatus: 'fit', gapStatus: 'recommended' });
    expect(r.rowHeights).toEqual([70]);
    expect(r.totalHeight).toBe(70);
  });

  it('marks an arrangement that exactly fills the wall', () => {
    expect(calculateGalleryWall({ wallWidth: 162, rows: [row('50x70', 3)], gap: 6 }).fitStatus).toBe('exact');
  });

  it('reports a tight fit separately from one that does not fit', () => {
    expect(calculateGalleryWall({ wallWidth: 170, rows: [row('50x70', 3)], gap: 9 }).fitStatus).toBe('tight');
    expect(calculateGalleryWall({ wallWidth: 150, rows: [row('50x70', 3)], gap: 6 }))
      .toMatchObject({ fitStatus: 'no-fit', overflow: 12, sideMargin: 0 });
  });

  it('identifies gaps outside the article recommendation', () => {
    expect(calculateGalleryWall({ wallWidth: 240, rows: [row('50x50', 2)], gap: 4 }).gapStatus).toBe('tight');
    expect(calculateGalleryWall({ wallWidth: 240, rows: [row('50x50', 2)], gap: 9 }).gapStatus).toBe('wide');
  });

  it('takes the row height from the tallest print', () => {
    expect(calculateGalleryWall({ wallWidth: 240, rows: [['50x50', '50x70', '50x50']], gap: 6 }).rowHeights).toEqual([70]);
  });

  it('formats whole and half centimetres without false precision', () => {
    expect(formatCentimetres(39)).toBe('39 cm');
    expect(formatCentimetres(12.5)).toBe('12.5 cm');
  });
});

describe('a wall of several rows', () => {
  const twoRows: PrintSizeKey[][] = [['50x70', '50x50'], ['50x50', '50x50', '50x50']];

  it('measures across the WIDEST row, not the first or the total', () => {
    const r = calculateGalleryWall({ wallWidth: 240, rows: twoRows, gap: 6 });
    expect(r.rowWidths).toEqual([106, 162]);
    expect(r.totalWidth).toBe(162);
  });

  it('stacks the row heights and charges a gap between rows', () => {
    // 70 + 50 with one 6 cm gap between the bands.
    expect(calculateGalleryWall({ wallWidth: 240, rows: twoRows, gap: 6 }).totalHeight).toBe(126);
  });

  it('charges no vertical gap for a single row', () => {
    expect(calculateGalleryWall({ wallWidth: 240, rows: [['50x70']], gap: 6 }).totalHeight).toBe(70);
  });

  it('centres the side margin on the widest row', () => {
    expect(calculateGalleryWall({ wallWidth: 240, rows: twoRows, gap: 6 }).sideMargin).toBe(39);
  });

  it('counts every print on the wall', () => {
    expect(calculateGalleryWall({ wallWidth: 240, rows: twoRows, gap: 6 }).printCount).toBe(5);
  });

  it('reports height fit only when a wall height was given', () => {
    const without = calculateGalleryWall({ wallWidth: 240, rows: twoRows, gap: 6 });
    expect(without.fitsHeight).toBeNull();
    expect(without.heightOverflow).toBe(0);

    const roomy = calculateGalleryWall({ wallWidth: 240, wallHeight: 200, rows: twoRows, gap: 6 });
    expect(roomy.fitsHeight).toBe(true);
  });

  it('fails the fit when it is too TALL even though the width is fine', () => {
    // The trap this guards: a wall can be comfortably within its width and
    // still not go on the wall.
    const tooTall = calculateGalleryWall({ wallWidth: 240, wallHeight: 100, rows: twoRows, gap: 6 });
    expect(tooTall).toMatchObject({ fitStatus: 'no-fit', heightOverflow: 26, fitsHeight: false });
    expect(tooTall.overflow).toBe(0);
  });

  it('handles an empty wall without dividing by anything', () => {
    expect(calculateGalleryWall({ wallWidth: 240, rows: [], gap: 6 }))
      .toMatchObject({ totalWidth: 0, totalHeight: 0, printCount: 0, fitStatus: 'fit' });
  });
});

describe('movePrintTo', () => {
  const wall: PrintSizeKey[][] = [['50x70', '50x50'], ['50x50', '50x70']];

  it('moves a print along its own row', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 0, index: 1 }))
      .toEqual([['50x50', '50x70'], ['50x50', '50x70']]);
  });

  it('moves a print into another row, at the position dropped', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 1, index: 1 }))
      .toEqual([['50x50'], ['50x50', '50x70', '50x70']]);
  });

  it('makes a new row above when dropped past the top', () => {
    expect(movePrintTo(wall, { row: 1, index: 1 }, { row: -1, index: 0 }))
      .toEqual([['50x70'], ['50x70', '50x50'], ['50x50']]);
  });

  it('makes a new row below when dropped past the bottom', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 2, index: 0 }))
      .toEqual([['50x50'], ['50x50', '50x70'], ['50x70']]);
  });

  it('closes a row emptied by the move rather than leaving a band', () => {
    const single: PrintSizeKey[][] = [['50x70'], ['50x50']];
    expect(movePrintTo(single, { row: 0, index: 0 }, { row: 1, index: 0 }))
      .toEqual([['50x70', '50x50']]);
  });

  it('clamps a drop past the end of a row to the end of that row', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 1, index: 99 }))
      .toEqual([['50x50'], ['50x50', '50x70', '50x70']]);
  });

  it('never mutates the wall it was given', () => {
    const original: PrintSizeKey[][] = [['50x70', '50x50']];
    movePrintTo(original, { row: 0, index: 0 }, { row: 0, index: 1 });
    expect(original).toEqual([['50x70', '50x50']]);
  });

  it('returns the wall untouched for a drop that goes nowhere', () => {
    for (const to of [{ row: -2, index: 0 }, { row: 5, index: 0 }, { row: 0, index: -1 }]) {
      expect(movePrintTo(wall, { row: 0, index: 0 }, to)).toEqual(wall.map(r => [...r]));
    }
    for (const from of [{ row: 9, index: 0 }, { row: 0, index: 9 }, { row: 0, index: -1 }]) {
      expect(movePrintTo(wall, from, { row: 1, index: 0 })).toEqual(wall.map(r => [...r]));
    }
  });

  it('leaves the arithmetic alone when a print only changes place in its row', () => {
    const before = calculateGalleryWall({ wallWidth: 240, rows: wall, gap: 6 });
    const after = calculateGalleryWall({ wallWidth: 240, rows: movePrintTo(wall, { row: 0, index: 0 }, { row: 0, index: 1 }), gap: 6 });
    expect(after).toEqual(before);
  });

  it('DOES change the arithmetic when a print changes row, which is the point', () => {
    const before = calculateGalleryWall({ wallWidth: 240, rows: wall, gap: 6 });
    const after = calculateGalleryWall({ wallWidth: 240, rows: movePrintTo(wall, { row: 0, index: 0 }, { row: 1, index: 0 }), gap: 6 });
    expect(after.rowWidths).not.toEqual(before.rowWidths);
    expect(after.printCount).toBe(before.printCount);
  });
});

describe('PRINT_SIZES', () => {
  it('offers only the sizes the catalogue actually sells', () => {
    expect(Object.keys(PRINT_SIZES).sort()).toEqual(['50x50', '50x70']);
  });
});
