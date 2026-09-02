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

/**
 * The same arrangement with a different gap.
 *
 * Positions are free coordinates, so the gap is not stored anywhere - it is
 * only visible as the spaces between prints. To change it, the relations are
 * read back off the geometry: which print sits exactly one gap from which,
 * which edges and centres line up. The first print (top-left) stays put and
 * every other one is placed from the relations to prints already placed,
 * nearest gap-neighbour first, then an alignment. A print with no relation
 * to anything keeps its coordinates. On a snapped wall every relation is
 * exact, so a preset re-spaced this way equals the preset built at the new
 * gap; on a wall someone has pulled about, the tidy parts follow and the
 * loose parts stay where they were.
 */
export function respace<T extends { x: number; y: number }>(
  prints: readonly T[],
  sizeOf: (p: T) => { w: number; h: number },
  oldGap: number,
  newGap: number
): T[] {
  if (prints.length < 2 || Math.abs(oldGap - newGap) < EPS) return [...prints];
  const rects = prints.map(p => ({ ...p, ...sizeOf(p) }));
  const same = (a: number, b: number) => Math.abs(a - b) < 0.05;
  const overlapY = (a: Rect, b: Rect) => a.y < b.y + b.h && a.y + a.h > b.y;
  const overlapX = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x;

  const order = rects.map((_, i) => i).sort((a, b) => rects[a].y - rects[b].y || rects[a].x - rects[b].x);
  const next: ({ x: number; y: number } | null)[] = rects.map(() => null);
  next[order[0]] = { x: rects[order[0]].x, y: rects[order[0]].y };

  /** New x for print i from a placed neighbour, or null if no relation. */
  const solveX = (i: number): number | null => {
    const p = rects[i];
    const placed = rects.map((r, j) => ({ r, j })).filter(({ j }) => j !== i && next[j]);
    // Nearest gap-neighbour to the left, then to the right.
    const lefts = placed.filter(({ r }) => overlapY(p, r) && same(p.x - (r.x + r.w), oldGap)).sort((a, b) => b.r.x - a.r.x);
    if (lefts.length) return next[lefts[0].j]!.x + lefts[0].r.w + newGap;
    const rights = placed.filter(({ r }) => overlapY(p, r) && same(r.x - (p.x + p.w), oldGap)).sort((a, b) => a.r.x - b.r.x);
    if (rights.length) return next[rights[0].j]!.x - newGap - p.w;
    // Then an alignment with a print above or below: left edge, right edge, centre.
    const stacked = placed.filter(({ r }) => overlapX(p, r) && !overlapY(p, r));
    for (const { r, j } of stacked) {
      if (same(p.x, r.x)) return next[j]!.x;
      if (same(p.x + p.w, r.x + r.w)) return next[j]!.x + r.w - p.w;
      if (same(p.x + p.w / 2, r.x + r.w / 2)) return next[j]!.x + r.w / 2 - p.w / 2;
    }
    return null;
  };

  const solveY = (i: number): number | null => {
    const p = rects[i];
    const placed = rects.map((r, j) => ({ r, j })).filter(({ j }) => j !== i && next[j]);
    const aboves = placed.filter(({ r }) => overlapX(p, r) && same(p.y - (r.y + r.h), oldGap)).sort((a, b) => b.r.y - a.r.y);
    if (aboves.length) return next[aboves[0].j]!.y + aboves[0].r.h + newGap;
    const belows = placed.filter(({ r }) => overlapX(p, r) && same(r.y - (p.y + p.h), oldGap)).sort((a, b) => a.r.y - b.r.y);
    if (belows.length) return next[belows[0].j]!.y - newGap - p.h;
    const beside = placed.filter(({ r }) => overlapY(p, r) && !overlapX(p, r));
    for (const { r, j } of beside) {
      if (same(p.y, r.y)) return next[j]!.y;
      if (same(p.y + p.h, r.y + r.h)) return next[j]!.y + r.h - p.h;
      if (same(p.y + p.h / 2, r.y + r.h / 2)) return next[j]!.y + r.h / 2 - p.h / 2;
    }
    return null;
  };

  /**
   * A run of prints joined by gaps along x (each overlapping its neighbour in
   * y). Rows are runs; so is the pair of squares under a pyramid. A run's
   * centre is what such a pair lines up with: the centre of the row above,
   * which is a relation between two groups, not between two prints.
   */
  const runX = (start: number): number[] => {
    const seen = new Set<number>([start]);
    const queue = [start];
    while (queue.length) {
      const i = queue.pop()!;
      rects.forEach((r, j) => {
        if (seen.has(j)) return;
        const p = rects[i];
        if (overlapY(p, r) && (same(r.x - (p.x + p.w), oldGap) || same(p.x - (r.x + r.w), oldGap))) {
          seen.add(j);
          queue.push(j);
        }
      });
    }
    return [...seen];
  };
  const runCentreOld = (run: number[]) => {
    const lo = Math.min(...run.map(i => rects[i].x));
    const hi = Math.max(...run.map(i => rects[i].x + rects[i].w));
    return { lo, hi, centre: (lo + hi) / 2 };
  };
  const runCentreNew = (run: number[]) => {
    const placed = run.filter(i => next[i]);
    if (!placed.length) return null;
    const lo = Math.min(...placed.map(i => next[i]!.x));
    const hi = Math.max(...placed.map(i => next[i]!.x + rects[i].w));
    return (lo + hi) / 2;
  };

  /** Place, by group centring, one run that nothing else could place. */
  const placeRunByCentre = (): boolean => {
    for (const i of order) {
      if (next[i]) continue;
      const run = runX(i);
      if (run.some(j => next[j])) continue;
      const { lo, hi, centre } = runCentreOld(run);
      const newWidth = hi - lo + (run.length - 1) * (newGap - oldGap);
      const placedRuns = new Map<string, number[]>();
      rects.forEach((_, j) => {
        if (!next[j]) return;
        const other = runX(j);
        placedRuns.set(other.sort().join(','), other);
      });
      for (const other of placedRuns.values()) {
        if (!same(runCentreOld(other).centre, centre)) continue;
        const target = runCentreNew(other);
        if (target === null) continue;
        const leftmost = run.reduce((a, b) => (rects[a].x <= rects[b].x ? a : b));
        next[leftmost] = { x: target - newWidth / 2, y: solveY(leftmost) ?? rects[leftmost].y };
        return true;
      }
    }
    return false;
  };

  // Place whatever can be placed from what is already placed - both axes,
  // or it waits - until nothing more can be. When that stalls, place one run
  // by group centring and go again. Whatever is left keeps its coordinates,
  // taking any single axis it can.
  for (;;) {
    let progressed = false;
    for (const i of order) {
      if (next[i]) continue;
      const x = solveX(i);
      const y = solveY(i);
      if (x === null || y === null) continue;
      next[i] = { x, y };
      progressed = true;
    }
    if (progressed) continue;
    if (placeRunByCentre()) continue;
    break;
  }
  for (const i of order) {
    if (next[i]) continue;
    next[i] = { x: solveX(i) ?? rects[i].x, y: solveY(i) ?? rects[i].y };
  }

  return prints.map((p, i) => (next[i] ? { ...p, x: next[i]!.x, y: next[i]!.y } : { ...p }));
}
