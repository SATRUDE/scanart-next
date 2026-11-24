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

import { PUBLISHED_FRAMES } from './generated-prices';
import { overlayPrices } from './published-overlay';

export type FrameSize = 'A3' | 'A2' | '40x50cm' | '40x60cm' | '50x50cm' | '45x60cm' | '50x70cm' | 'A1';

/** Every size the catalogue sells, ordered by frame supplement, dearest last. */
export const FRAME_SIZES: FrameSize[] = ['A3', 'A2', '40x50cm', '40x60cm', '45x60cm', '50x50cm', '50x70cm', 'A1'];

export interface CurrencyPrices {
  GBP: number;
  USD: number;
  NOK: number;
  DKK: number;
  SEK: number;
  EUR: number;
}

export interface FrameOption {
  id: string;
  name: string;
  /** What the frame adds, per size. */
  prices: Record<FrameSize, CurrencyPrices>;
}

const NO_CHARGE: Record<FrameSize, CurrencyPrices> = {
  A3: { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
  A2: { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
  '40x50cm': { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
  '40x60cm': { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
  '50x50cm': { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
  '45x60cm': { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
  '50x70cm': { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
  A1: { GBP: 0, USD: 0, NOK: 0, DKK: 0, SEK: 0, EUR: 0 },
};

/**
 * The three frame colours cost Gelato the same as each other, so they are
 * priced the same. Only the size moves the number.
 *
 * Mark's margin rule (24 Nov 2026, T-0573): every single-print order keeps at
 * least GBP 10 (or the local equivalent) and 20% of the price ex VAT, after
 * Gelato's cost, the artist's 60%, card fees and VAT as if registered in the
 * buyer's market, and still keeps GBP 5 with 20% off the whole order. The
 * frame money is wholly the gallery's, so the frame carries most of that. GBP
 * prices are Mark's; the other currencies start from the shop's ratios and
 * were raised to the next round number wherever a live Gelato quote and the
 * shop's real delivery charge said they missed. The 40 x 50, 40 x 60 and
 * 45 x 60 formats now have their own supplement (they cost Gelato much less
 * to frame than a 50 x 70), and a size never frames cheaper than the one
 * before it in FRAME_SIZES.
 *
 * EUR (T-0573, 24 Nov 2026), for EU buyers outside Denmark and Sweden, is set
 * the same way as the euro print prices in config/priceCategories.ts: the
 * lowest round number, in fives, that keeps the rule in all 25 of those
 * countries and in the worst case of the highest VAT with the dearest Gelato
 * quote, for every list sold in that size. Same ladder rule.
 */
const COMPILED_FRAMED_PRICES: Record<FrameSize, CurrencyPrices> = {
  A3: { GBP: 20, USD: 35, NOK: 350, DKK: 275, SEK: 350, EUR: 30 },
  A2: { GBP: 40, USD: 70, NOK: 600, DKK: 425, SEK: 550, EUR: 60 },
  '40x50cm': { GBP: 40, USD: 70, NOK: 650, DKK: 450, SEK: 550, EUR: 60 },
  '40x60cm': { GBP: 40, USD: 70, NOK: 650, DKK: 450, SEK: 550, EUR: 60 },
  '45x60cm': { GBP: 40, USD: 70, NOK: 650, DKK: 450, SEK: 550, EUR: 70 },
  '50x50cm': { GBP: 45, USD: 70, NOK: 750, DKK: 500, SEK: 650, EUR: 70 },
  '50x70cm': { GBP: 55, USD: 85, NOK: 900, DKK: 625, SEK: 800, EUR: 95 },
  A1: { GBP: 70, USD: 105, NOK: 1050, DKK: 750, SEK: 950, EUR: 100 },
};

/**
 * The above with anything published from socialagent's Costs page laid over
 * it, size by size. A size never published, or published incomplete, keeps
 * the compiled price: this list stays the floor under a network-written one.
 */
const FRAMED_PRICES: Record<FrameSize, CurrencyPrices> = (() => {
  const merged = { ...COMPILED_FRAMED_PRICES };
  for (const size of FRAME_SIZES) {
    const overlaid = overlayPrices(merged[size], PUBLISHED_FRAMES?.[size]);
    if (overlaid) merged[size] = overlaid;
  }
  return merged;
})();

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
