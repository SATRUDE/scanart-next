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

/** One horizontal run of prints. A wall is a stack of these. */
export type WallRow = readonly PrintSizeKey[];

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
    const width = row.reduce((sum, key) => sum + PRINT_SIZES[key].width, 0);
    return width + gap * Math.max(0, row.length - 1);
  });
  const rowHeights = rows.map(row =>
    row.reduce((tallest, key) => Math.max(tallest, PRINT_SIZES[key].height), 0)
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
function withoutEmptyRows(rows: PrintSizeKey[][]): PrintSizeKey[][] {
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
export function movePrintTo(
  rows: readonly WallRow[],
  from: PrintPosition,
  to: PrintPosition
): PrintSizeKey[][] {
  const next: PrintSizeKey[][] = rows.map(row => [...row]);

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
