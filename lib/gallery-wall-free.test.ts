import { describe, it, expect } from 'vitest';
import { bounds, decodeFree, encodeFree, fromRows, guidesFor, isClear, normalize, placeGroup, rectOf, resolve, respace, snap, tooClose, type Rect } from './gallery-wall-free';
import { PRESETS } from './gallery-wall-calculator';

const r = (x: number, y: number, w = 50, h = 70): Rect => ({ x, y, w, h });

describe('free arrangement: closeness', () => {
  it('allows prints exactly one gap apart, and refuses closer', () => {
    expect(tooClose(r(0, 0), r(56, 0), 6)).toBe(false);
    expect(tooClose(r(0, 0), r(55, 0), 6)).toBe(true);
    expect(tooClose(r(0, 0), r(0, 76), 6)).toBe(false);
    expect(tooClose(r(0, 0), r(0, 75), 6)).toBe(true);
  });

  it('does not mind prints that are close on one axis but apart on the other', () => {
    // Side by side but in different rows: x overlaps entirely, y is a gap away.
    expect(tooClose(r(0, 0), r(10, 76), 6)).toBe(false);
  });

  it('isClear checks against everyone', () => {
    expect(isClear(r(112, 0), [r(0, 0), r(56, 0)], 6)).toBe(true);
    expect(isClear(r(100, 0), [r(0, 0), r(56, 0)], 6)).toBe(false);
  });
});

describe('free arrangement: snapping', () => {
  const others = [r(0, 0)];

  it('clicks to one gap beside a neighbour', () => {
    expect(snap(r(53, 2), others, 6, 10)).toEqual(r(56, 0));
  });

  it('clicks to a neighbour\'s centre line', () => {
    // 50x50 under a 50x70: centred horizontally, one gap below.
    expect(snap(r(2, 78, 50, 50), others, 6, 10)).toEqual(r(0, 76, 50, 50));
  });

  it('clicks to a bottom edge', () => {
    // A short print beside a tall one, bottoms level: y = 70 - 50.
    expect(snap(r(57, 17, 50, 50), others, 6, 10)).toEqual(r(56, 20, 50, 50));
  });

  it('leaves a print alone outside the radius', () => {
    expect(snap(r(200, 200), others, 6, 10)).toEqual(r(200, 200));
  });

  it('snaps each axis independently', () => {
    expect(snap(r(53, 200), others, 6, 10)).toEqual(r(56, 200));
  });
});

describe('free arrangement: resolve', () => {
  const others = [r(0, 0), r(56, 0)];

  it('returns the snapped place when it is clear', () => {
    expect(resolve(r(110, 1), others, 6, 10, r(300, 0))).toEqual(r(112, 0));
  });

  it('slides around a neighbour instead of through it', () => {
    // Pointer puts the print squarely over the second one: the nearest clear
    // snap is one gap to its right.
    const placed = resolve(r(60, 0), others, 6, 10, r(300, 0));
    expect(isClear(placed, others, 6)).toBe(true);
    expect(placed).toEqual(r(112, 0));
  });

  it('falls back to the last good place when nothing near is clear', () => {
    const crowded = [r(0, 0), r(56, 0), r(0, 76), r(56, 76), r(0, -76), r(56, -76)];
    const placed = resolve(r(28, 38), crowded, 6, 4, r(300, 300));
    expect(placed).toEqual(r(300, 300));
  });
});

describe('free arrangement: guides', () => {
  it('reports coinciding edges and centres', () => {
    const g = guidesFor(r(56, 0), [r(0, 0)]);
    expect(g.ys).toEqual(expect.arrayContaining([0, 70, 35]));
    expect(g.xs).toEqual([]);
  });
});

describe('free arrangement: rows in, coordinates out', () => {
  it('centres narrower rows under wider ones and hangs by alignment', () => {
    const out = fromRows([[{ size: '50x70', align: 'centre' }, { size: '50x50', align: 'bottom' }], [{ size: '50x50', align: 'centre' }]], 6);
    expect(out).toEqual([
      { size: '50x70', x: 0, y: 0 },
      { size: '50x50', x: 56, y: 20 },
      { size: '50x50', x: 28, y: 76 },
    ]);
  });

  it('converts every preset into a clear arrangement', () => {
    for (const preset of PRESETS) {
      const prints = fromRows(preset.rows, 6);
      const rects = prints.map(rectOf);
      rects.forEach((rect, i) => expect(isClear(rect, rects.filter((_, j) => j !== i), 6), preset.key).toBe(true));
    }
  });
});

describe('free arrangement: group placement', () => {
  it('normalizes to the origin and centres on the wall', () => {
    const prints = normalize([{ x: 10, y: 20, size: '50x70' as const }, { x: 66, y: 20, size: '50x70' as const }], p => ({ w: 50, h: PRESETS && p.size === '50x70' ? 70 : 50 }));
    expect(prints.map(p => [p.x, p.y])).toEqual([[0, 0], [56, 0]]);
    const box = bounds(prints.map(rectOf));
    expect(box).toEqual({ minX: 0, minY: 0, w: 106, h: 70 });
    expect(placeGroup(box, 240, 145)).toEqual({ left: 67, topFromFloor: 180 });
  });
});

describe('free arrangement in the URL', () => {
  it('round-trips', () => {
    const a = { wallWidth: 240, wallHeight: 260, gap: 6, centreHeight: 145, prints: [{ size: '50x70' as const, x: 0, y: 0 }, { size: '50x50' as const, x: 56, y: 20.5 }] };
    expect(encodeFree(a)).toBe('w240h260g6c145;p0,0|s56,20.5');
    expect(decodeFree(encodeFree(a))).toEqual(a);
  });

  it('rejects rubbish', () => {
    expect(decodeFree('w240h0g6c145;')).toBeNull();
    expect(decodeFree('w240h0g6c145;q0,0')).toBeNull();
    expect(decodeFree('w240h0g6c145;p0')).toBeNull();
  });
});

describe('free arrangement: resolve prefers snapped axes', () => {
  it('lands on the snap line beside the obstacle, not on the raw pointer x', () => {
    // Pointer slightly right of a print that sits at x=56. The nearest clear
    // spot is one gap to its right, and it must take that snapped x exactly -
    // never the pointer's raw 58 carried along.
    const others = [{ x: 0, y: 0, w: 50, h: 70 }, { x: 56, y: 0, w: 50, h: 50 }];
    const placed = resolve({ x: 58, y: 0, w: 50, h: 50 }, others, 6, 10, { x: 300, y: 300, w: 50, h: 50 });
    expect(placed).toEqual({ x: 112, y: 0, w: 50, h: 50 });

    // With that spot taken, the clear spot above must still be on the line.
    const crowded = [...others, { x: 112, y: 0, w: 50, h: 50 }];
    const above = resolve({ x: 58, y: 0, w: 50, h: 50 }, crowded, 6, 10, { x: 300, y: 300, w: 50, h: 50 });
    expect(above).toEqual({ x: 56, y: -56, w: 50, h: 50 });
  });
});

describe('free arrangement: respacing to a new gap', () => {
  const size = (p: { size: '50x70' | '50x50' }) => ({ w: 50, h: p.size === '50x70' ? 70 : 50 });

  it('re-spaces every preset exactly as if it had been built at the new gap', () => {
    for (const preset of PRESETS) {
      const at6 = fromRows(preset.rows, 6);
      const at10 = fromRows(preset.rows, 10);
      const respaced = normalize(respace(at6, size, 6, 10), size);
      expect(respaced.map(p => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]), preset.key)
        .toEqual(normalize(at10, size).map(p => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]));
    }
  });

  it('follows a column beside a two-by-two block', () => {
    // Tall print left; squares at (56,0) (112,0) (56,56) (112,56), gap 6.
    const wall = [
      { size: '50x70' as const, x: 0, y: 0 },
      { size: '50x50' as const, x: 56, y: 0 },
      { size: '50x50' as const, x: 112, y: 0 },
      { size: '50x50' as const, x: 56, y: 56 },
      { size: '50x50' as const, x: 112, y: 56 },
    ];
    const out = respace(wall, size, 6, 8);
    expect(out.map(p => [p.x, p.y])).toEqual([[0, 0], [58, 0], [116, 0], [58, 58], [116, 58]]);
  });

  it('leaves a print that relates to nothing where it was', () => {
    const wall = [
      { size: '50x70' as const, x: 0, y: 0 },
      { size: '50x50' as const, x: 56, y: 0 },
      { size: '50x50' as const, x: 300, y: 300 },
    ];
    const out = respace(wall, size, 6, 12);
    expect(out[1]).toMatchObject({ x: 62, y: 0 });
    expect(out[2]).toMatchObject({ x: 300, y: 300 });
  });

  it('is a no-op for an unchanged gap', () => {
    const wall = [{ size: '50x70' as const, x: 0, y: 0 }, { size: '50x50' as const, x: 56, y: 0 }];
    expect(respace(wall, size, 6, 6)).toEqual(wall);
  });
});
