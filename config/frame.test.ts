import { describe, it, expect } from 'vitest';
import { FRAME_SIZES, getFramePrice, getFrameName, frameOptions, type FrameSize } from './frame';

// Gelato's charge for the frame alone, quoted live on 2026-08-12. Every price
// in config/frame.ts has to sit above its row here or we are paying people to
// take frames, which is what the single flat price was doing on the big sizes.
const GELATO_FRAME_COST: Record<string, Record<FrameSize, number>> = {
  GBP: { A3: 10.82, A2: 19.85, '50x50cm': 25.01, '50x70cm': 31.09, A1: 39.23 },
  USD: { A3: 22.9, A2: 37.53, '50x50cm': 37.57, '50x70cm': 46.79, A1: 60.44 },
  NOK: { A3: 140.55, A2: 253.9, '50x50cm': 377.14, '50x70cm': 476.99, A1: 472.02 },
  DKK: { A3: 132.63, A2: 224.01, '50x50cm': 279.39, '50x70cm': 354.52, A1: 428.02 },
  SEK: { A3: 179.73, A2: 303.99, '50x50cm': 364.27, '50x70cm': 448.59, A1: 539.61 },
};

const CURRENCIES = ['GBP', 'USD', 'NOK', 'DKK', 'SEK'] as const;
const FRAMED = ['wood', 'black', 'white'];

describe('frame pricing covers what the frame costs', () => {
  it('never sells a frame for less than Gelato charges for it', () => {
    for (const currency of CURRENCIES) {
      for (const size of FRAME_SIZES) {
        const price = getFramePrice('wood', size, currency);
        const cost = GELATO_FRAME_COST[currency][size];
        expect(price, `${currency} ${size}: ${price} against a ${cost} cost`).toBeGreaterThan(cost);
      }
    }
  });

  it('keeps a real margin rather than scraping the cost', () => {
    for (const currency of CURRENCIES) {
      for (const size of FRAME_SIZES) {
        const margin = getFramePrice('wood', size, currency) / GELATO_FRAME_COST[currency][size];
        expect(margin, `${currency} ${size}`).toBeGreaterThan(1.2);
      }
    }
  });
});

describe('the price ladder', () => {
  it('never charges less for a bigger frame', () => {
    for (const currency of CURRENCIES) {
      const prices = FRAME_SIZES.map(size => getFramePrice('wood', size, currency));
      for (let i = 1; i < prices.length; i += 1) {
        expect(prices[i], `${currency} ${FRAME_SIZES[i]}`).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    }
  });

  it('charges the same whichever colour, since Gelato does', () => {
    for (const size of FRAME_SIZES) {
      const prices = FRAMED.map(frame => getFramePrice(frame, size, 'GBP'));
      expect(new Set(prices).size).toBe(1);
    }
  });
});

describe('getFramePrice', () => {
  it('charges nothing for no frame, at every size', () => {
    for (const size of FRAME_SIZES) {
      expect(getFramePrice('no-frame', size, 'GBP')).toBe(0);
    }
  });

  // The old signature had no size at all, so a caller without one is exactly
  // the case that used to undercharge. Erring high costs a sale at worst;
  // erring low costs money on every sale.
  it('falls back to the DEAREST size when the size is missing or unknown', () => {
    const dearest = getFramePrice('wood', 'A1', 'GBP');
    expect(getFramePrice('wood', undefined, 'GBP')).toBe(dearest);
    expect(getFramePrice('wood', '', 'GBP')).toBe(dearest);
    expect(getFramePrice('wood', 'A0', 'GBP')).toBe(dearest);
    expect(getFramePrice('wood', 'not-a-size', 'GBP')).toBe(dearest);
  });

  it('still returns nothing for a frame that does not exist', () => {
    expect(getFramePrice('mahogany', 'A1', 'GBP')).toBe(0);
  });

  it('prices every size the catalogue sells', () => {
    // products.json offers exactly these; a size with no price would fall back
    // to A1 silently and overcharge, so the list has to stay in step.
    expect(FRAME_SIZES).toEqual(['A3', 'A2', '50x50cm', '50x70cm', 'A1']);
    for (const option of frameOptions) {
      for (const size of FRAME_SIZES) {
        expect(option.prices[size], `${option.id} ${size}`).toBeDefined();
      }
    }
  });
});

describe('getFrameName', () => {
  it('names the frames and falls back for anything else', () => {
    expect(getFrameName('wood')).toBe('Wood');
    expect(getFrameName('no-frame')).toBe('No Frame');
    expect(getFrameName('mahogany')).toBe('No Frame');
  });
});
