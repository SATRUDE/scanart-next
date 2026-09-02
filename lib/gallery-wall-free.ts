/**
 * Free arrangement of prints on a wall, with magnetism.
 *
 * The row model in gallery-wall-calculator.ts could not express a tall print
 * beside a two-by-two block - that is a column next to a grid, not a row -
 * and any nesting deep enough to express it would be a worse tool than a
 * plain surface. So prints here have coordinates. What keeps the wall tidy is
 * not a structure but a SNAP: a print being moved clicks to its neighbours'
 * edges and centres, and to exactly one gap away from them, and it is never
 * allowed closer than the gap to anything. Nothing between, because a wall
 * that is almost aligned looks worse than one that obviously is not.
 *
 * Coordinates are centimetres in "group space": x to the right, y DOWN, from
 * the group's top-left. The group is then placed on the wall as a whole.
 */
import { PRINT_SIZES, type PrintSizeKey, type WallRow, alignmentOffset } from './gallery-wall-calculator';

export interface FreePrint {
  id: string;
  size: PrintSizeKey;
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Below this, two numbers are the same number. Keeps float drift out of the snaps. */
const EPS = 0.01;

export function rectOf(print: { size: PrintSizeKey; x: number; y: number }): Rect {
  const { width, height } = PRINT_SIZES[print.size];
  return { x: print.x, y: print.y, w: width, h: height };
}

export interface Bounds {
  minX: number;
  minY: number;
  w: number;
  h: number;
}

export function bounds(rects: readonly Rect[]): Bounds {
  if (!rects.length) return { minX: 0, minY: 0, w: 0, h: 0 };
  const minX = Math.min(...rects.map(r => r.x));
  const minY = Math.min(...rects.map(r => r.y));
  const maxX = Math.max(...rects.map(r => r.x + r.w));
  const maxY = Math.max(...rects.map(r => r.y + r.h));
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

/** Shift the group so its top-left is the origin. Positions are relative; only the shape matters. */
export function normalize<T extends { x: number; y: number }>(prints: readonly T[], sizeOf: (p: T) => { w: number; h: number }): T[] {
  if (!prints.length) return [];
  const { minX, minY } = bounds(prints.map(p => ({ x: p.x, y: p.y, ...sizeOf(p) })));
  if (Math.abs(minX) < EPS && Math.abs(minY) < EPS) return [...prints];
  return prints.map(p => ({ ...p, x: p.x - minX, y: p.y - minY }));
}

/**
 * Whether two prints are closer than the gap. Touching at exactly the gap is
 * fine - that is where the snap puts them - so the test is strict.
 */
export function tooClose(a: Rect, b: Rect, gap: number): boolean {
  const g = gap - EPS;
  return a.x < b.x + b.w + g && a.x + a.w + g > b.x && a.y < b.y + b.h + g && a.y + a.h + g > b.y;
}

export function isClear(rect: Rect, others: readonly Rect[], gap: number): boolean {
  return others.every(other => !tooClose(rect, other, gap));
}

/**
 * Every x (and y) a moving print might want to click to, given its
 * neighbours: their edges, one gap beyond their edges, and their centres.
 */
export function snapCandidates(moving: { w: number; h: number }, others: readonly Rect[], gap: number): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const o of others) {
    xs.push(o.x, o.x + o.w - moving.w, o.x + o.w + gap, o.x - gap - moving.w, o.x + o.w / 2 - moving.w / 2);
    ys.push(o.y, o.y + o.h - moving.h, o.y + o.h + gap, o.y - gap - moving.h, o.y + o.h / 2 - moving.h / 2);
  }
  return { xs, ys };
}

const nearest = (value: number, candidates: readonly number[], radius: number): number => {
  let best = value;
  let bestDistance = radius;
  for (const c of candidates) {
    const d = Math.abs(c - value);
    if (d < bestDistance) {
      bestDistance = d;
      best = c;
    }
  }
  return best;
};

/** Snap each axis independently to the nearest candidate within `radius`, like a smart guide. */
export function snap(proposed: Rect, others: readonly Rect[], gap: number, radius: number): Rect {
  const { xs, ys } = snapCandidates(proposed, others, gap);
  return { ...proposed, x: nearest(proposed.x, xs, radius), y: nearest(proposed.y, ys, radius) };
}

/**
 * Where a print being dragged to `proposed` actually goes.
 *
 * Snapped if the snapped place is clear. If it is not - the pointer is over
 * another print - the nearest CLEAR snap position is used, so the print
 * appears to slide around its neighbour rather than through it. Only when
 * nothing within reach is clear does it stay put at `fallback`, the last
 * good place, which is what the placeholder was already showing.
 */
export function resolve(proposed: Rect, others: readonly Rect[], gap: number, radius: number, fallback: Rect): Rect {
  const snapped = snap(proposed, others, gap, radius);
  if (isClear(snapped, others, gap)) return snapped;

  // How far a print will slide to get round a neighbour: about one print, so
  // it clears the one under the pointer but never leaps across a cluster.
  const reach = Math.max(radius * 4, 60);

  const { xs, ys } = snapCandidates(proposed, others, gap);
  const nearestClear = (xOptions: readonly number[], yOptions: readonly number[]): Rect | null => {
    let best: Rect | null = null;
    let bestDistance = Infinity;
    for (const x of xOptions) {
      for (const y of yOptions) {
        const d = Math.hypot(x - proposed.x, y - proposed.y);
        if (d >= bestDistance || d > reach) continue;
        const candidate = { ...proposed, x, y };
        if (isClear(candidate, others, gap)) {
          best = candidate;
          bestDistance = d;
        }
      }
    }
    return best;
  };
  // Snapped on both axes first; a raw pointer axis only when nothing snapped
  // is clear. Otherwise a raw x two centimetres off would beat the snap line
  // beside it on distance, and the print would land visibly out of true.
  const best =
    nearestClear([snapped.x, ...xs], [snapped.y, ...ys]) ??
    nearestClear([proposed.x, snapped.x, ...xs], [proposed.y, snapped.y, ...ys]);
  return best ?? fallback;
}

/**
 * Which of a placed print's edges and centre lines coincide with a
 * neighbour's - what a smart guide draws. Returned as coordinates in group
 * space: vertical guides as x values, horizontal as y values.
 */
export function guidesFor(rect: Rect, others: readonly Rect[]): { xs: number[]; ys: number[] } {
  const xs = new Set<number>();
  const ys = new Set<number>();
  const same = (a: number, b: number) => Math.abs(a - b) < EPS;
  const myX = [rect.x, rect.x + rect.w, rect.x + rect.w / 2];
  const myY = [rect.y, rect.y + rect.h, rect.y + rect.h / 2];
  for (const o of others) {
    for (const ox of [o.x, o.x + o.w, o.x + o.w / 2]) if (myX.some(mx => same(mx, ox))) xs.add(ox);
    for (const oy of [o.y, o.y + o.h, o.y + o.h / 2]) if (myY.some(my => same(my, oy))) ys.add(oy);
  }
  return { xs: [...xs], ys: [...ys] };
}

/**
 * A row arrangement as coordinates: rows centred on each other, prints in a
 * row hung by their alignment. How the presets, and any plan saved by the
 * row-based version, become a free arrangement.
 */
export function fromRows(rows: readonly WallRow[], gap: number): { size: PrintSizeKey; x: number; y: number }[] {
  const rowWidths = rows.map(row => row.reduce((sum, p) => sum + PRINT_SIZES[p.size].width, 0) + gap * Math.max(0, row.length - 1));
  const rowHeights = rows.map(row => row.reduce((tallest, p) => Math.max(tallest, PRINT_SIZES[p.size].height), 0));
  const widest = Math.max(0, ...rowWidths);
  const out: { size: PrintSizeKey; x: number; y: number }[] = [];
  let y = 0;
  rows.forEach((row, ri) => {
    let x = (widest - rowWidths[ri]) / 2;
    for (const print of row) {
      const { offset } = alignmentOffset(print, rowHeights[ri]);
      out.push({ size: print.size, x, y: y + offset });
      x += PRINT_SIZES[print.size].width + gap;
    }
    y += rowHeights[ri] + gap;
  });
  return out;
}

/** Where the group sits on the wall: centred across it, centred on `centreHeight` from the floor. */
export function placeGroup(box: Bounds, wallWidth: number, centreHeight: number): { left: number; topFromFloor: number } {
  return { left: (wallWidth - box.w) / 2, topFromFloor: centreHeight + box.h / 2 };
}

const SIZE_CODE: Record<PrintSizeKey, string> = { '50x70': 'p', '50x50': 's' };
const SIZE_FROM_CODE = Object.fromEntries(Object.entries(SIZE_CODE).map(([k, v]) => [v, k])) as Record<string, PrintSizeKey>;

export interface FreeArrangement {
  wallWidth: number;
  wallHeight?: number;
  gap: number;
  centreHeight: number;
  prints: { size: PrintSizeKey; x: number; y: number }[];
}

/** `w240h0g6c145;p0,0|s56,0` - wall, then each print as size letter and its position. */
export function encodeFree(a: FreeArrangement): string {
  const prints = a.prints.map(p => `${SIZE_CODE[p.size]}${trim(p.x)},${trim(p.y)}`).join('|');
  return `w${a.wallWidth}h${a.wallHeight ?? 0}g${a.gap}c${a.centreHeight};${prints}`;
}

const trim = (n: number) => String(Math.round(n * 10) / 10);

export function decodeFree(text: string): FreeArrangement | null {
  const match = /^w(\d+(?:\.\d+)?)h(\d+(?:\.\d+)?)g(\d+(?:\.\d+)?)c(\d+(?:\.\d+)?);(.*)$/.exec(text.trim());
  if (!match) return null;
  const [, w, h, g, c, body] = match;
  const prints: FreeArrangement['prints'] = [];
  for (const entry of body.split('|')) {
    const m = /^([a-z])(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(entry);
    if (!m) return null;
    const size = SIZE_FROM_CODE[m[1]];
    if (!size) return null;
    prints.push({ size, x: Number(m[2]), y: Number(m[3]) });
  }
  if (!prints.length) return null;
  const wallHeight = Number(h);
  return { wallWidth: Number(w), wallHeight: wallHeight > 0 ? wallHeight : undefined, gap: Number(g), centreHeight: Number(c), prints };
}
