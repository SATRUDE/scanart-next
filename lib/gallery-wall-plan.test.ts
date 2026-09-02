import { describe, it, expect } from 'vitest';
import {
  layoutGalleryWall,
  sizeCounts,
  PRESETS,
  PRINT_SIZES,
  encodeArrangement,
  decodeArrangement,
  EYE_LEVEL_CM,
  type WallRow,
} from './gallery-wall-calculator';

const p = (size: '50x70' | '50x50', align: 'top' | 'centre' | 'bottom' = 'centre') => ({ size, align });

describe('layoutGalleryWall: the hanging plan', () => {
  it('centres each row on the wall and the group at eye level', () => {
    const rows: WallRow[] = [[p('50x70'), p('50x70'), p('50x70')]];
    const layout = layoutGalleryWall({ wallWidth: 240, rows, gap: 6 });
    // 162 wide on 240: 39 each side. 70 tall centred on 145: top at 180.
    expect(layout.rowLefts).toEqual([39]);
    expect(layout.groupTop).toBe(180);
    expect(layout.groupBottom).toBe(110);
    expect(layout.prints.map(x => x.left)).toEqual([39, 95, 151]);
    expect(layout.prints.every(x => x.topFromFloor === 180)).toBe(true);
  });

  it('stacks rows downward from the group top with the gap between', () => {
    const rows: WallRow[] = [[p('50x70')], [p('50x50')]];
    const layout = layoutGalleryWall({ wallWidth: 200, rows, gap: 6 });
    // 70 + 6 + 50 = 126 tall, centred on 145: top 208, row 2 top 208-76 = 132.
    expect(layout.rowTops).toEqual([208, 132]);
    expect(layout.groupBottom).toBe(82);
  });

  it('hangs a short print by its alignment inside a taller row', () => {
    const rows: WallRow[] = [[p('50x70'), p('50x50', 'top')], [p('50x70'), p('50x50', 'bottom')]];
    const layout = layoutGalleryWall({ wallWidth: 200, rows, gap: 6 });
    const [, topAligned, , bottomAligned] = layout.prints;
    expect(topAligned.topFromFloor).toBe(layout.rowTops[0]);
    expect(bottomAligned.topFromFloor).toBe(layout.rowTops[1] - 20);
  });

  it('lets a row wider than the wall start left of it, so the drawing shows the overflow', () => {
    const rows: WallRow[] = [[p('50x70'), p('50x70'), p('50x70'), p('50x70')]];
    const layout = layoutGalleryWall({ wallWidth: 200, rows, gap: 6 });
    expect(layout.rowLefts[0]).toBeLessThan(0);
  });

  it('honours a custom centre height', () => {
    const layout = layoutGalleryWall({ wallWidth: 200, rows: [[p('50x50')]], gap: 6 }, 120);
    expect(layout.groupTop).toBe(145);
    expect(EYE_LEVEL_CM).toBe(145);
  });
});

describe('presets', () => {
  it('use only sizes the catalogue sells', () => {
    for (const preset of PRESETS) {
      for (const row of preset.rows) for (const print of row) expect(PRINT_SIZES[print.size]).toBeDefined();
    }
  });

  it('all fit a 240 cm wall, which is the default', () => {
    for (const preset of PRESETS) {
      const layout = layoutGalleryWall({ wallWidth: 240, rows: preset.rows, gap: 6 });
      expect(Math.min(...layout.rowLefts), preset.key).toBeGreaterThanOrEqual(0);
    }
  });

  it('have unique keys', () => {
    expect(new Set(PRESETS.map(x => x.key)).size).toBe(PRESETS.length);
  });
});

describe('sizeCounts', () => {
  it('counts what to buy', () => {
    expect(sizeCounts([[p('50x70'), p('50x50'), p('50x70')], [p('50x50')]])).toEqual({ '50x70': 2, '50x50': 2 });
  });
});

describe('arrangement in the URL', () => {
  it('round-trips every field', () => {
    const a = { wallWidth: 240, wallHeight: 260, gap: 6, centreHeight: 145, rows: [[p('50x70'), p('50x50', 'top')], [p('50x50', 'bottom')]] };
    expect(decodeArrangement(encodeArrangement(a))).toEqual(a);
  });

  it('treats a zero height as none', () => {
    const a = { wallWidth: 240, gap: 6, centreHeight: 145, rows: [[p('50x70')]] };
    expect(encodeArrangement(a)).toBe('w240h0g6c145;pc');
    expect(decodeArrangement(encodeArrangement(a))).toEqual(a);
  });

  it('keeps decimals', () => {
    const a = { wallWidth: 237.5, gap: 5.5, centreHeight: 150, rows: [[p('50x70')]] };
    expect(decodeArrangement(encodeArrangement(a))).toEqual(a);
  });

  it('rejects rubbish rather than guessing', () => {
    expect(decodeArrangement('')).toBeNull();
    expect(decodeArrangement('w240h0g6c145;')).toBeNull();
    expect(decodeArrangement('w240h0g6c145;xq')).toBeNull();
    expect(decodeArrangement('hello')).toBeNull();
  });
});
