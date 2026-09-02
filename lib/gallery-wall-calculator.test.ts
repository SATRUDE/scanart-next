import { describe, expect, it } from 'vitest';
import {
  PRINT_SIZES,
  alignFromDrag,
  alignmentOffset,
  calculateGalleryWall,
  formatCentimetres,
  movePrintTo,
  type PrintAlign,
  type PrintSizeKey,
  type WallPrint,
} from './gallery-wall-calculator';

/** A print, centred unless the test cares. */
const p = (size: PrintSizeKey, align: PrintAlign = 'centre'): WallPrint => ({ size, align });
const row = (size: PrintSizeKey, count: number): WallPrint[] =>
  Array.from({ length: count }, () => p(size));

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
    expect(calculateGalleryWall({ wallWidth: 240, rows: [[p('50x50'), p('50x70'), p('50x50')]], gap: 6 }).rowHeights).toEqual([70]);
  });

  it('formats whole and half centimetres without false precision', () => {
    expect(formatCentimetres(39)).toBe('39 cm');
    expect(formatCentimetres(12.5)).toBe('12.5 cm');
  });
});

describe('a wall of several rows', () => {
  const twoRows: WallPrint[][] = [[p('50x70'), p('50x50')], [p('50x50'), p('50x50'), p('50x50')]];

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
    expect(calculateGalleryWall({ wallWidth: 240, rows: [[p('50x70')]], gap: 6 }).totalHeight).toBe(70);
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
  const wall: WallPrint[][] = [[p('50x70'), p('50x50')], [p('50x50'), p('50x70')]];

  it('moves a print along its own row', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 0, index: 1 }))
      .toEqual([[p('50x50'), p('50x70')], [p('50x50'), p('50x70')]]);
  });

  it('moves a print into another row, at the position dropped', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 1, index: 1 }))
      .toEqual([[p('50x50')], [p('50x50'), p('50x70'), p('50x70')]]);
  });

  it('makes a new row above when dropped past the top', () => {
    expect(movePrintTo(wall, { row: 1, index: 1 }, { row: -1, index: 0 }))
      .toEqual([[p('50x70')], [p('50x70'), p('50x50')], [p('50x50')]]);
  });

  it('makes a new row below when dropped past the bottom', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 2, index: 0 }))
      .toEqual([[p('50x50')], [p('50x50'), p('50x70')], [p('50x70')]]);
  });

  it('closes a row emptied by the move rather than leaving a band', () => {
    const single: WallPrint[][] = [[p('50x70')], [p('50x50')]];
    expect(movePrintTo(single, { row: 0, index: 0 }, { row: 1, index: 0 }))
      .toEqual([[p('50x70'), p('50x50')]]);
  });

  it('clamps a drop past the end of a row to the end of that row', () => {
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 1, index: 99 }))
      .toEqual([[p('50x50')], [p('50x50'), p('50x70'), p('50x70')]]);
  });

  it('never mutates the wall it was given', () => {
    const original: WallPrint[][] = [[p('50x70'), p('50x50')]];
    movePrintTo(original, { row: 0, index: 0 }, { row: 0, index: 1 });
    expect(original).toEqual([[p('50x70'), p('50x50')]]);
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

describe('alignmentOffset', () => {
  const tall = 70;

  it('gives a print that already fills its row no slack at all', () => {
    // The tallest print in a row cannot be aligned anywhere, and that is not
    // a special case to handle elsewhere - it falls out as zero slack.
    expect(alignmentOffset(p('50x70', 'top'), tall)).toEqual({ slack: 0, offset: 0 });
    expect(alignmentOffset(p('50x70', 'bottom'), tall)).toEqual({ slack: 0, offset: 0 });
  });

  it('hangs a top-aligned print flush with the top of its row', () => {
    expect(alignmentOffset(p('50x50', 'top'), tall)).toEqual({ slack: 20, offset: 0 });
  });

  it('hangs a bottom-aligned print flush with the bottom of its row', () => {
    // The whole 20 cm of slack goes above it, so its bottom edge lines up
    // with the taller print beside it.
    expect(alignmentOffset(p('50x50', 'bottom'), tall)).toEqual({ slack: 20, offset: 20 });
  });

  it('centres by default, splitting the slack', () => {
    expect(alignmentOffset(p('50x50', 'centre'), tall)).toEqual({ slack: 20, offset: 10 });
  });

  it('never returns negative slack for a print taller than the row it is given', () => {
    expect(alignmentOffset(p('50x70', 'centre'), 50)).toEqual({ slack: 0, offset: 0 });
  });
});

describe('alignment and the arithmetic', () => {
  it('changes nothing dimensional, which is why it is safe to fiddle with', () => {
    const centred: WallPrint[][] = [[p('50x70'), p('50x50', 'centre')]];
    const topped: WallPrint[][] = [[p('50x70'), p('50x50', 'top')]];
    const a = calculateGalleryWall({ wallWidth: 240, rows: centred, gap: 6 });
    const b = calculateGalleryWall({ wallWidth: 240, rows: topped, gap: 6 });
    expect(b).toEqual(a);
  });

  it('survives a move, so a print keeps how it hangs when it changes row', () => {
    const wall: WallPrint[][] = [[p('50x50', 'bottom')], [p('50x70')]];
    expect(movePrintTo(wall, { row: 0, index: 0 }, { row: 1, index: 1 }))
      .toEqual([[p('50x70'), p('50x50', 'bottom')]]);
  });
});

describe('alignFromDrag', () => {
  const square = p('50x50');           // 20 cm of slack in a 70 cm row
  const tall = p('50x70');             // no slack at all

  it('snaps to the top when dragged up from centre', () => {
    expect(alignFromDrag(p('50x50', 'centre'), 70, -8)).toBe('top');
  });

  it('snaps to the bottom when dragged down from centre', () => {
    expect(alignFromDrag(p('50x50', 'centre'), 70, 8)).toBe('bottom');
  });

  it('stays centred for a small drag, so a twitch does not move it', () => {
    expect(alignFromDrag(square, 70, 1)).toBe('centre');
    expect(alignFromDrag(square, 70, -1)).toBe('centre');
  });

  it('lands on the centre coming from an edge, rather than jumping past it', () => {
    // The point of the quarter boundaries: dragging a top-aligned print down
    // reaches centre before it reaches bottom.
    expect(alignFromDrag(p('50x50', 'top'), 70, 10)).toBe('centre');
    expect(alignFromDrag(p('50x50', 'bottom'), 70, -10)).toBe('centre');
  });

  it('reaches the far edge on a long drag', () => {
    expect(alignFromDrag(p('50x50', 'top'), 70, 20)).toBe('bottom');
    expect(alignFromDrag(p('50x50', 'bottom'), 70, -20)).toBe('top');
  });

  it('never moves a print that has no slack, whatever the drag', () => {
    // The tallest print in its row sets the line; it has nowhere to go.
    for (const dragCm of [-40, -5, 0, 5, 40]) {
      expect(alignFromDrag(tall, 70, dragCm)).toBe('centre');
    }
    expect(alignFromDrag(p('50x70', 'top'), 70, 30)).toBe('top');
  });

  it('scales with the slack, not with absolute centimetres', () => {
    // The same 6 cm drag: decisive on a print with little room, not on one
    // with plenty. Otherwise a drag feels different per print size.
    expect(alignFromDrag(p('50x50', 'centre'), 58, 6)).toBe('bottom');
    expect(alignFromDrag(p('50x50', 'centre'), 200, 6)).toBe('centre');
  });
});
