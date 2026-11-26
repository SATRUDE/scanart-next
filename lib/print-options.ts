// Per-print options beyond size and frame, set on the print in
// public/notion-data/products.json. Neither is special to one print.
//
// `orientations`: a print offered both upright and on its side, as the same
// paper (Mark, 25 Nov 2026, for Åsa Törnquist's Kopia: "offer both as an
// orientation option on the print"). Each entry carries its own images; the
// first is the default and is what cards, feeds and the sitemap show. The size
// stays the catalogue size ('50x70cm', short side first, as Gelato names it),
// so prices, frames and delivery are unchanged; a landscape print is shown as
// 70 × 50 cm and goes to Gelato as the `_hor` variant of the same product
// (datamachine-reports server/decisions/orders.mjs productUid), on the
// landscape file.
//
// `unframedOnly`: the print is sold without a frame only, for a print whose
// files have no bleed yet (Gelato needs 4 mm each side for a framed print).
// The product page offers None only, and the server refuses a frame.

export type Orientation = 'portrait' | 'landscape';

export interface OrientationOption {
  id: Orientation;
  image: string;
  secondaryImage?: string;
}

export interface PrintOptions {
  orientations?: OrientationOption[];
  unframedOnly?: boolean;
}

const ORIENTATIONS: Orientation[] = ['portrait', 'landscape'];

/** The orientations a print offers, in its own order; empty when it has no choice. */
export function orientationsOf(product: PrintOptions): OrientationOption[] {
  const list = (product.orientations ?? []).filter(o => ORIENTATIONS.includes(o.id) && o.image);
  return list.length > 1 ? list : [];
}

/** The orientation a basket line keeps: one the print offers, or none at all. */
export function lineOrientation(product: PrintOptions, requested?: string | null): Orientation | undefined {
  const offered = orientationsOf(product);
  if (offered.length === 0) return undefined;
  return offered.find(o => o.id === requested)?.id ?? offered[0].id;
}

/** '50x70cm' turned on its side is '70x50cm'; a square or an A size is unchanged in name. */
export function orientedSize(size: string, orientation?: Orientation): string {
  if (orientation !== 'landscape') return size;
  const m = size.match(/^(\d+)x(\d+)cm$/i);
  if (!m) return size;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return `${Math.max(a, b)}x${Math.min(a, b)}cm`;
}

/** Gelato's orientation suffix for a line: `hor` for landscape, else `ver`. */
export function gelatoOrientation(orientation?: Orientation): 'hor' | 'ver' {
  return orientation === 'landscape' ? 'hor' : 'ver';
}

/** Whether a print may be sold in this frame. */
export function offersFrame(product: PrintOptions, frame?: string | null): boolean {
  return !product.unframedOnly || !frame || frame === 'no-frame';
}

/** The image for a basket line: its orientation's own, else the print's. */
export function lineImage(product: PrintOptions & { image: string }, orientation?: Orientation): string {
  return orientationsOf(product).find(o => o.id === orientation)?.image ?? product.image;
}
