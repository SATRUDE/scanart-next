// Frame pricing, by size.
//
// It used to be one price whatever the size: 25 GBP / 32 USD / 343 NOK for an
// A3 or an A1 alike. Gelato does not charge like that. Live quotes on
// 2026-08-12 put the frame alone at 141 kr for an A3 and 472 kr for an A1, so
// one price for five sizes overcharged the small end and lost money on the
// large end. Framing an A1 for Oslo earned 277 kr LESS than selling the same
// print rolled.
//
// These cover Gelato's charge for the frame with about 25% on top, rounded to
// something a person would write.
//
// Re-measured after Mark chose 200gsm uncoated over the 250gsm archival
// (2026-08-12). That decision made the rolled print cheaper without moving the
// framed one, so the gap the frame has to cover GREW, and three of the first
// set of prices went underwater. Worth remembering: the frame's price depends
// on the paper, so changing one means re-checking the other.
//
// They deliberately do NOT carry the extra postage a framed parcel costs (a
// framed A1 weighs 2,808g against a rolled print's 125g). Delivery is priced
// separately and is being moved to Gelato's own quote, so loading postage in
// here would charge for it twice.
//
// The costs behind these are on the Costs page in socialagent, quoted live, so
// they can be checked rather than taken on trust. The numbers below are a
// snapshot of 2026-08-12; re-check when Gelato's prices move.

export type FrameSize = 'A3' | 'A2' | '50x50cm' | '50x70cm' | 'A1';

/** Every size the catalogue sells, largest last. */
export const FRAME_SIZES: FrameSize[] = ['A3', 'A2', '50x50cm', '50x70cm', 'A1'];

export interface CurrencyPrices {
  GBP: number;
  USD: number;
  NOK: number;
  DKK: number;
  SEK: number;
}

export interface FrameOption {
  id: string;
  name: string;
  /** What the frame adds, per size. */
  prices: Record<FrameSize, CurrencyPrices>;
}

const NO_CHARGE: Record<FrameSize, CurrencyPrices> = {
  A3: { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0 },
  A2: { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0 },
  '50x50cm': { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0 },
  '50x70cm': { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0 },
  A1: { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0 },
};

/**
 * The three frame colours cost Gelato the same as each other, so they are
 * priced the same. Only the size moves the number.
 *
 * USD 50x50cm is set level with A2 rather than below it: Gelato charges
 * slightly less to frame it, and a price list where a bigger print frames
 * cheaper reads as a mistake. Levelling up covers both.
 */
const FRAMED_PRICES: Record<FrameSize, CurrencyPrices> = {
  A3: { GBP: 18, USD: 32, NOK: 265, DKK: 210, SEK: 265 },
  A2: { GBP: 29, USD: 51, NOK: 420, DKK: 315, SEK: 410 },
  '50x50cm': { GBP: 32, USD: 51, NOK: 475, DKK: 350, SEK: 455 },
  '50x70cm': { GBP: 39, USD: 59, NOK: 600, DKK: 445, SEK: 560 },
  A1: { GBP: 55, USD: 82, NOK: 735, DKK: 575, SEK: 735 },
};

export const frameOptions: FrameOption[] = [
  { id: 'no-frame', name: 'No Frame', prices: NO_CHARGE },
  { id: 'wood', name: 'Wood', prices: FRAMED_PRICES },
  { id: 'black', name: 'Black', prices: FRAMED_PRICES },
  { id: 'white', name: 'White', prices: FRAMED_PRICES },
];

/** The dearest size, used when we do not know which one is being bought. */
const LARGEST: FrameSize = 'A1';

export function isFrameSize(size: string | undefined): size is FrameSize {
  return typeof size === 'string' && (FRAME_SIZES as string[]).includes(size);
}

/**
 * What a frame adds to this print, in this currency.
 *
 * An unknown or missing size falls back to the DEAREST size, never the
 * cheapest and never zero. The old signature took no size at all, so a caller
 * that has not been given one is the exact case that used to undercharge; the
 * fallback errs towards charging too much, which costs a sale at worst, rather
 * than too little, which costs money on every sale.
 */
export const getFramePrice = (
  frameId: string,
  size: string | undefined,
  currency: keyof CurrencyPrices
): number => {
  const frame = frameOptions.find(f => f.id === frameId);
  if (!frame) return 0;
  return frame.prices[isFrameSize(size) ? size : LARGEST][currency];
};

export const getFrameName = (frameId: string): string => {
  const frame = frameOptions.find(f => f.id === frameId);
  return frame ? frame.name : 'No Frame';
};
