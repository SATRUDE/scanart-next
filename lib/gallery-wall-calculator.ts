/**
 * Only the sizes the catalogue actually sells.
 *
 * config/frame.ts declares five FRAME_SIZES (A3, A2, 50x50cm, 50x70cm, A1)
 * because the frame price table covers all five, but products.json offers
 * exactly two. Adding A-sizes here would let a reader plan a wall out of
 * prints they cannot buy, which is the same mistake as the open ticket about
 * our print-sizes guide ranking for a range we stopped selling. If the
 * catalogue gains a size, add it here and nowhere else.
 */
export const PRINT_SIZES = {
  '50x70': { width: 50, height: 70, label: '50 × 70 cm, portrait' },
  '50x50': { width: 50, height: 50, label: '50 × 50 cm, square' },
} as const;

export type PrintSizeKey = keyof typeof PRINT_SIZES;
export type FitStatus = 'fit' | 'tight' | 'exact' | 'no-fit';
export type GapStatus = 'recommended' | 'tight' | 'wide';

/**
 * Where a print sits vertically inside its row.
 *
 * Only meaningful for a print shorter than the tallest in its row, and it is
 * how a mixed row gets a clean line: aligning tops or bottoms against a taller
 * neighbour reads as deliberate, where centring everything reads as a shop
 * display. It changes nothing dimensional - the row is still as tall as its
 * tallest print - so the arithmetic ignores it entirely.
 */
export type PrintAlign = 'top' | 'centre' | 'bottom';

/** A print on the wall: what it is, and how it hangs in its row. */
export interface WallPrint {
  size: PrintSizeKey;
  align: PrintAlign;
}

/** One horizontal run of prints. A wall is a stack of these. */
export type WallRow = readonly WallPrint[];

/** Where a print sits: which row, and how far along it. */
export interface PrintPosition {
  row: number;
  index: number;
}

export interface GalleryWallInputs {
  wallWidth: number;
  /**
   * Optional, because plenty of people know how wide their wall is and have
   * never measured its usable height. Height fit is only reported when it is
   * given, rather than inventing a number to compare against.
   */
  wallHeight?: number;
  rows: readonly WallRow[];
  /** Used both between prints and between rows, which is the convention. */
  gap: number;
}

export interface GalleryWallResult {
  /** Width of each row, in order. */
  rowWidths: number[];
  /** Height of each row: its tallest print. */
  rowHeights: number[];
  /** The widest row, which is what the arrangement measures across. */
  totalWidth: number;
  /** Every row plus the gaps between them. */
  totalHeight: number;
  /** Space at each side of the WIDEST row. */
  sideMargin: number;
  overflow: number;
  fitStatus: FitStatus;
  gapStatus: GapStatus;
  /** How far the stack overshoots the wall's height, when one was given. */
  heightOverflow: number;
  /** Whether it is too tall, when a height was given. Null when it was not. */
  fitsHeight: boolean | null;
  /** How many prints are on the wall. */
  printCount: number;
}

export function calculateGalleryWall({
  wallWidth,
  wallHeight,
  rows,
  gap,
}: GalleryWallInputs): GalleryWallResult {
  const rowWidths = rows.map(row => {
    const width = row.reduce((sum, print) => sum + PRINT_SIZES[print.size].width, 0);
    return width + gap * Math.max(0, row.length - 1);
  });
  const rowHeights = rows.map(row =>
    row.reduce((tallest, print) => Math.max(tallest, PRINT_SIZES[print.size].height), 0)
  );

  const totalWidth = rowWidths.length ? Math.max(...rowWidths) : 0;
  const totalHeight =
    rowHeights.reduce((sum, height) => sum + height, 0) +
    gap * Math.max(0, rowHeights.length - 1);

  const remaining = wallWidth - totalWidth;
  const sideMargin = Math.max(0, remaining / 2);
  const overflow = Math.max(0, -remaining);

  let fitStatus: FitStatus = 'fit';
  if (remaining < 0) fitStatus = 'no-fit';
  else if (remaining === 0) fitStatus = 'exact';
  else if (sideMargin < gap) fitStatus = 'tight';

  // A wall that overshoots its height does not fit, whatever the width says.
  const heightOverflow =
    wallHeight === undefined ? 0 : Math.max(0, totalHeight - wallHeight);
  const fitsHeight = wallHeight === undefined ? null : heightOverflow === 0;
  if (fitsHeight === false) fitStatus = 'no-fit';

  const gapStatus: GapStatus = gap < 5 ? 'tight' : gap > 8 ? 'wide' : 'recommended';

  return {
    rowWidths,
    rowHeights,
    totalWidth,
    totalHeight,
    sideMargin,
    overflow,
    fitStatus,
    gapStatus,
    heightOverflow,
    fitsHeight,
    printCount: rows.reduce((count, row) => count + row.length, 0),
  };
}

export function formatCentimetres(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} cm`;
}

/** Drop any row that has been emptied, so a wall never carries a blank band. */
function withoutEmptyRows<T>(rows: T[][]): T[][] {
  return rows.filter(row => row.length > 0);
}

/**
 * Move one print anywhere on the wall: along its row, into another row, or
 * into a row of its own.
 *
 * `to.row` may be -1 for a new row above everything, or rows.length for a new
 * row below, which is how a print gets dragged out into its own band. Any
 * other out-of-range position returns the wall untouched, because dropping
 * into nowhere is something a person does constantly and is not an error.
 *
 * Rows emptied by the move are removed, so dragging the last print out of a
 * row closes the gap rather than leaving a hole.
 */
export function movePrintTo<T>(
  rows: readonly (readonly T[])[],
  from: PrintPosition,
  to: PrintPosition
): T[][] {
  const next: T[][] = rows.map(row => [...row]);

  const fromRow = next[from.row];
  if (
    !Number.isInteger(from.row) ||
    !Number.isInteger(from.index) ||
    !fromRow ||
    from.index < 0 ||
    from.index >= fromRow.length
  ) {
    return next;
  }
  if (!Number.isInteger(to.row) || !Number.isInteger(to.index)) return next;
  // -1 and length are the "make a new row" positions; anything further out is
  // a drop into nowhere.
  if (to.row < -1 || to.row > next.length) return next;
  if (to.index < 0) return next;

  const [moved] = fromRow.splice(from.index, 1);

  if (to.row === -1) {
    next.unshift([moved]);
    return withoutEmptyRows(next);
  }
  if (to.row === next.length) {
    next.push([moved]);
    return withoutEmptyRows(next);
  }

  const target = next[to.row];
  // Clamp rather than refuse: dragging past the end of a row means the end of
  // that row, which is what it looks like it should mean.
  target.splice(Math.min(to.index, target.length), 0, moved);
  return withoutEmptyRows(next);
}

/**
 * How far down its row a print sits, as a fraction of the slack above and
 * below it. 0 hangs its top edge level with the row's top, 1 hangs its bottom
 * edge level with the row's bottom, 0.5 centres it.
 *
 * Returned as a fraction rather than centimetres so the preview and any real
 * hanging guide can each scale it themselves, and so a print that is already
 * the tallest in its row is unambiguously 0 slack rather than a special case.
 */
export function alignmentOffset(
  print: WallPrint,
  rowHeight: number
): { slack: number; offset: number } {
  const slack = Math.max(0, rowHeight - PRINT_SIZES[print.size].height);
  const fraction = print.align === 'top' ? 0 : print.align === 'bottom' ? 1 : 0.5;
  return { slack, offset: slack * fraction };
}

/**
 * Which of the three resting places a vertical drag has landed on.
 *
 * Three, not a free offset. A print can hang level with the top of its row,
 * centred in it, or level with the bottom - and nothing in between, because
 * a wall that is ALMOST aligned looks worse than one that obviously is not,
 * and because those three are the only positions anyone hanging prints is
 * actually aiming for.
 *
 * `slack` is the room the print has to move in, so a drag of a few pixels on
 * a print with 20 cm of slack lands where the same drag on one with 2 cm does:
 * the thresholds are proportions of the space, not absolute distances.
 */
export function alignFromDrag(
  print: WallPrint,
  rowHeight: number,
  dragCm: number
): PrintAlign {
  const slack = Math.max(0, rowHeight - PRINT_SIZES[print.size].height);
  if (slack === 0) return print.align;

  // Where the print's top edge is now, as a fraction of the slack.
  const startFraction = print.align === 'top' ? 0 : print.align === 'bottom' ? 1 : 0.5;
  const proposed = startFraction + dragCm / slack;

  // Nearest of the three, with the boundaries a quarter of the way in so the
  // centre is not a hair-trigger between the two edges.
  if (proposed < 0.25) return 'top';
  if (proposed > 0.75) return 'bottom';
  return 'centre';
}

/**
 * The museum convention: the centre of a group of pictures sits at about eye
 * level, 145 cm from the floor. Where the plan hangs the group unless told
 * otherwise, and the one number a first-time hanger most needs handed to them.
 */
export const EYE_LEVEL_CM = 145;

/** A print placed on the wall, in centimetres from the wall's left edge and from the floor. */
export interface PlacedPrint {
  row: number;
  index: number;
  size: PrintSizeKey;
  width: number;
  height: number;
  /** Left edge, from the left edge of the wall. Negative when the row is wider than the wall. */
  left: number;
  /** Top edge, from the floor. What you measure up to before marking a hook. */
  topFromFloor: number;
}

export interface GalleryWallLayout {
  prints: PlacedPrint[];
  /** Top and bottom edges of the whole group, from the floor. */
  groupTop: number;
  groupBottom: number;
  /** Left edge of each row, from the left edge of the wall. */
  rowLefts: number[];
  /** Top edge of each row, from the floor. */
  rowTops: number[];
}

/**
 * Where every print hangs, as real measurements.
 *
 * The rows are centred on the wall and the group is centred on `centreHeight`
 * from the floor. This is the hanging plan, and it is also what the drawing is
 * projected from, so the two cannot disagree - the picture on screen IS the
 * numbers in the table, scaled.
 */
export function layoutGalleryWall(inputs: GalleryWallInputs, centreHeight: number = EYE_LEVEL_CM): GalleryWallLayout {
  const { rows, gap, wallWidth } = inputs;
  const { rowWidths, rowHeights, totalHeight } = calculateGalleryWall(inputs);
  const groupTop = centreHeight + totalHeight / 2;
  const groupBottom = groupTop - totalHeight;

  const rowLefts = rowWidths.map(width => (wallWidth - width) / 2);
  const rowTops: number[] = [];
  let cursor = groupTop;
  rowHeights.forEach(height => {
    rowTops.push(cursor);
    cursor -= height + gap;
  });

  const prints: PlacedPrint[] = [];
  rows.forEach((row, ri) => {
    let left = rowLefts[ri];
    row.forEach((print, index) => {
      const { width, height } = PRINT_SIZES[print.size];
      const { offset } = alignmentOffset(print, rowHeights[ri]);
      prints.push({ row: ri, index, size: print.size, width, height, left, topFromFloor: rowTops[ri] - offset });
      left += width + gap;
    });
  });

  return { prints, groupTop, groupBottom, rowLefts, rowTops };
}

/** How many of each size the wall needs, for the shopping list. */
export function sizeCounts(rows: readonly WallRow[]): Partial<Record<PrintSizeKey, number>> {
  const counts: Partial<Record<PrintSizeKey, number>> = {};
  for (const row of rows) for (const print of row) counts[print.size] = (counts[print.size] ?? 0) + 1;
  return counts;
}

/**
 * Starting arrangements. Nobody begins from a blank wall - they begin from a
 * shape they have seen and liked - so these are the shapes people actually
 * hang, in the sizes we actually sell.
 */
export const PRESETS: readonly { key: string; label: string; rows: WallRow[] }[] = [
  { key: 'row', label: 'Row of three', rows: [[{ size: '50x70', align: 'centre' }, { size: '50x70', align: 'centre' }, { size: '50x70', align: 'centre' }]] },
  { key: 'grid', label: 'Two by two', rows: [[{ size: '50x70', align: 'centre' }, { size: '50x70', align: 'centre' }], [{ size: '50x70', align: 'centre' }, { size: '50x70', align: 'centre' }]] },
  { key: 'pyramid', label: 'Pyramid', rows: [[{ size: '50x70', align: 'centre' }, { size: '50x50', align: 'centre' }, { size: '50x70', align: 'centre' }], [{ size: '50x50', align: 'centre' }, { size: '50x50', align: 'centre' }]] },
  { key: 'salon', label: 'Salon', rows: [[{ size: '50x50', align: 'bottom' }, { size: '50x70', align: 'centre' }, { size: '50x50', align: 'bottom' }], [{ size: '50x70', align: 'centre' }, { size: '50x50', align: 'top' }, { size: '50x70', align: 'centre' }]] },
];

export interface Arrangement {
  wallWidth: number;
  wallHeight?: number;
  gap: number;
  centreHeight: number;
  rows: WallRow[];
}

const SIZE_CODE: Record<PrintSizeKey, string> = { '50x70': 'p', '50x50': 's' };
const ALIGN_CODE: Record<PrintAlign, string> = { top: 't', centre: 'c', bottom: 'b' };

/**
 * The whole plan as a short string, for the URL hash.
 *
 * `w240h0g6c145;pc,sc,pc|sc,sc` - wall, gap, centre, then rows of
 * size+align letters. Short enough to read out, stable enough to bookmark:
 * reload and the wall you were working on is still there, send the link and
 * so is theirs.
 */
export function encodeArrangement(a: Arrangement): string {
  const rows = a.rows.map(row => row.map(p => SIZE_CODE[p.size] + ALIGN_CODE[p.align]).join(',')).join('|');
  return `w${a.wallWidth}h${a.wallHeight ?? 0}g${a.gap}c${a.centreHeight};${rows}`;
}

export function decodeArrangement(text: string): Arrangement | null {
  const match = /^w(\d+(?:\.\d+)?)h(\d+(?:\.\d+)?)g(\d+(?:\.\d+)?)c(\d+(?:\.\d+)?);(.*)$/.exec(text.trim());
  if (!match) return null;
  const [, w, h, g, c, body] = match;
  const sizes = Object.fromEntries(Object.entries(SIZE_CODE).map(([k, v]) => [v, k])) as Record<string, PrintSizeKey>;
  const aligns = Object.fromEntries(Object.entries(ALIGN_CODE).map(([k, v]) => [v, k])) as Record<string, PrintAlign>;
  const rows: WallRow[] = [];
  for (const rowText of body.split('|')) {
    if (!rowText) continue;
    const row: WallPrint[] = [];
    for (const code of rowText.split(',')) {
      const size = sizes[code[0]];
      const align = aligns[code[1]];
      if (!size || !align) return null;
      row.push({ size, align });
    }
    rows.push(row);
  }
  if (!rows.length) return null;
  const wallHeight = Number(h);
  return { wallWidth: Number(w), wallHeight: wallHeight > 0 ? wallHeight : undefined, gap: Number(g), centreHeight: Number(c), rows };
}
