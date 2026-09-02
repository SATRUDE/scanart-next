export const PRINT_SIZES = {
  '50x70': { width: 50, height: 70, label: '50 × 70 cm, portrait' },
  '50x50': { width: 50, height: 50, label: '50 × 50 cm, square' },
} as const;

export type PrintSizeKey = keyof typeof PRINT_SIZES;
export type FitStatus = 'fit' | 'tight' | 'exact' | 'no-fit';
export type GapStatus = 'recommended' | 'tight' | 'wide';

export interface GalleryWallInputs {
  wallWidth: number;
  printSize: PrintSizeKey;
  frameCount: number;
  gap: number;
}

export interface GalleryWallResult {
  totalWidth: number;
  sideMargin: number;
  overflow: number;
  fitStatus: FitStatus;
  gapStatus: GapStatus;
}

export function calculateGalleryWall({
  wallWidth,
  printSize,
  frameCount,
  gap,
}: GalleryWallInputs): GalleryWallResult {
  const print = PRINT_SIZES[printSize];
  const totalWidth = print.width * frameCount + gap * Math.max(0, frameCount - 1);
  const remaining = wallWidth - totalWidth;
  const sideMargin = Math.max(0, remaining / 2);
  const overflow = Math.max(0, -remaining);

  let fitStatus: FitStatus = 'fit';
  if (remaining < 0) fitStatus = 'no-fit';
  else if (remaining === 0) fitStatus = 'exact';
  else if (sideMargin < gap) fitStatus = 'tight';

  const gapStatus: GapStatus = gap < 5 ? 'tight' : gap > 8 ? 'wide' : 'recommended';

  return { totalWidth, sideMargin, overflow, fitStatus, gapStatus };
}

export function formatCentimetres(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} cm`;
}
