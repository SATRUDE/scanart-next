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

export interface GalleryWallInputs {
  wallWidth: number;
  /**
   * One entry per print, left to right, each with its own size. A real
   * gallery wall mixes sizes; a single size repeated is the special case, not
   * the model. Order matters only for the preview, since the arithmetic is
   * commutative.
   */
  prints: readonly PrintSizeKey[];
  gap: number;
}

export interface GalleryWallResult {
  totalWidth: number;
  sideMargin: number;
  overflow: number;
  fitStatus: FitStatus;
  gapStatus: GapStatus;
  /**
   * The tallest print in the row, which is what the arrangement's height
   * reads as. Trivial when every print matched; worth stating once they do
   * not, because it is what decides whether the group clears a sofa or a
   * radiator.
   */
  rowHeight: number;
}

export function calculateGalleryWall({
  wallWidth,
  prints,
  gap,
}: GalleryWallInputs): GalleryWallResult {
  const sizes = prints.map(key => PRINT_SIZES[key]);
  const printsWidth = sizes.reduce((sum, print) => sum + print.width, 0);
  const totalWidth = printsWidth + gap * Math.max(0, sizes.length - 1);
  const rowHeight = sizes.reduce((tallest, print) => Math.max(tallest, print.height), 0);
  const remaining = wallWidth - totalWidth;
  const sideMargin = Math.max(0, remaining / 2);
  const overflow = Math.max(0, -remaining);

  let fitStatus: FitStatus = 'fit';
  if (remaining < 0) fitStatus = 'no-fit';
  else if (remaining === 0) fitStatus = 'exact';
  else if (sideMargin < gap) fitStatus = 'tight';

  const gapStatus: GapStatus = gap < 5 ? 'tight' : gap > 8 ? 'wide' : 'recommended';

  return { totalWidth, sideMargin, overflow, fitStatus, gapStatus, rowHeight };
}

export function formatCentimetres(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} cm`;
}
