import { describe, expect, it } from 'vitest';
import { galleryNet, type CostRow } from './order-margin';

// GB, from the store on 2026-10-07 (EUR).
const GB: CostRow[] = [
  { size: '40x60cm', frame: 'no-frame', printCost: 9.43, shipCost: 5.35, shipCostAdditional: 0.5 },
  { size: '40x60cm', frame: 'wood', printCost: 35.71, shipCost: 11.65, shipCostAdditional: 5 },
  { size: 'A1', frame: 'wood', printCost: 60, shipCost: 17.9, shipCostAdditional: 8 },
];
const base = {
  country: 'GB',
  currency: 'GBP',
  perEur: 0.85483,
  gbpPerEur: 0.85483,
  costs: GB,
  discount: null,
  countVat: false,
};

describe('galleryNet', () => {
  it('takes Gelato, the artist 60% of the unframed sale, and the card fee off what the buyer pays', () => {
    const r = galleryNet({
      ...base,
      lines: [{ size: '40x60cm', frame: 'no-frame', quantity: 1, printPrice: 56, framePrice: 0 }],
      shipping: 5.99,
    })!;
    const gelato = (9.43 + 5.35) * 0.85483;
    const artist = 0.6 * (56 + 5.99 - gelato);
    const fee = 61.99 * 0.0325 + 0.2;
    expect(r.revenue).toBe(61.99);
    expect(r.gelato).toBeCloseTo(gelato, 2);
    expect(r.artist).toBeCloseTo(artist, 2);
    expect(r.cardFee).toBeCloseTo(fee, 2);
    expect(r.net).toBeCloseTo(61.99 - gelato - artist - fee, 2);
  });

  it('keeps the frame out of the artist share', () => {
    const rolled = galleryNet({ ...base, lines: [{ size: '40x60cm', frame: 'no-frame', quantity: 1, printPrice: 56, framePrice: 0 }], shipping: 5.99 })!;
    const framed = galleryNet({
      ...base,
      lines: [{ size: '40x60cm', frame: 'wood', quantity: 1, printPrice: 56, framePrice: 39 }],
      shipping: 9.99,
      artistShipping: 5.99,
    })!;
    expect(framed.artist).toBe(rolled.artist);
  });

  it('discounts only rolled lines under an UNFRAMED code', () => {
    const lines = [
      { size: '40x60cm', frame: 'no-frame', quantity: 1, printPrice: 56, framePrice: 0 },
      { size: '40x60cm', frame: 'wood', quantity: 1, printPrice: 56, framePrice: 39 },
    ];
    const r = galleryNet({ ...base, lines, shipping: 10, discount: { percentage: 20, scope: 'UNFRAMED' } })!;
    expect(r.revenue).toBeCloseTo(56 * 0.8 + 95 + 10, 2);
  });

  it('counts VAT inside the price only when asked', () => {
    const lines = [{ size: '40x60cm', frame: 'no-frame', quantity: 1, printPrice: 56, framePrice: 0 }];
    const off = galleryNet({ ...base, lines, shipping: 5.99 })!;
    const on = galleryNet({ ...base, lines, shipping: 5.99, countVat: true })!;
    expect(off.vat).toBe(0);
    expect(on.vat).toBeCloseTo(61.99 / 6, 2);
    expect(on.net).toBeCloseTo(off.net - 61.99 / 6, 1);
  });

  it('adds the 2% conversion fee when the buyer pays in anything but pounds', () => {
    const lines = [{ size: '40x60cm', frame: 'no-frame', quantity: 1, printPrice: 800, framePrice: 0 }];
    const r = galleryNet({ ...base, currency: 'NOK', perEur: 10.9705, lines, shipping: 100 })!;
    expect(r.cardFee).toBeCloseTo(900 * 0.0525 + 0.2 * (10.9705 / 0.85483), 2);
  });

  it('prices a size with no cost row from the dearest row for its frame, and says so', () => {
    const r = galleryNet({ ...base, lines: [{ size: '45x60cm', frame: 'wood', quantity: 1, printPrice: 56, framePrice: 39 }], shipping: 9.99 })!;
    expect(r.estimated).toEqual(['45x60cm']);
    expect(r.gelato).toBeCloseTo((60 + 17.9) * 0.85483, 2);
  });

  it('charges a second print at the additional delivery rate', () => {
    const one = galleryNet({ ...base, lines: [{ size: '40x60cm', frame: 'no-frame', quantity: 1, printPrice: 56, framePrice: 0 }], shipping: 5.99 })!;
    const two = galleryNet({ ...base, lines: [{ size: '40x60cm', frame: 'no-frame', quantity: 2, printPrice: 56, framePrice: 0 }], shipping: 6.99 })!;
    expect(two.gelato - one.gelato).toBeCloseTo((9.43 + 0.5) * 0.85483, 2);
  });

  it('says nothing when there are no costs to judge by', () => {
    expect(galleryNet({ ...base, costs: [], lines: [{ size: 'A3', quantity: 1, printPrice: 42, framePrice: 0 }], shipping: 5.99 })).toBeNull();
  });
});
