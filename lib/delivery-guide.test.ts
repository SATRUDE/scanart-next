import { describe, it, expect } from 'vitest';
import { deliveryGuideLine, formatDeliveryPrice, withAnswer, worldwideFrom, type DeliveryGuide } from './delivery-guide';
import { basketStrings } from './i18n';

// The shape of the store's from-prices on 2026-09-26 (lib/server/delivery-guide.ts).
const guide: DeliveryGuide = {
  GB: { GBP: 5.99, NOK: 80, USD: 8.5, DKK: 55, SEK: 80 },
  NO: { GBP: 8, NOK: 100, USD: 11, DKK: 70, SEK: 100 },
  SE: { GBP: 7, NOK: 90, USD: 9.5, DKK: 60, SEK: 90 },
  DK: { GBP: 8, NOK: 100, USD: 10.5, DKK: 70, SEK: 100 },
  US: { GBP: 4.5, NOK: 55, USD: 6, DKK: 40, SEK: 55 },
  ELSEWHERE: { GBP: 4.5, NOK: 55, USD: 6, DKK: 40, SEK: 55 },
};

describe('delivery guide', () => {
  it('writes prices the way the copy does', () => {
    expect(formatDeliveryPrice(5.99, 'GBP')).toBe('£5.99');
    expect(formatDeliveryPrice(4.5, 'GBP')).toBe('£4.50');
    expect(formatDeliveryPrice(6, 'USD')).toBe('$6');
    expect(formatDeliveryPrice(100, 'NOK')).toBe('100 kr');
    expect(formatDeliveryPrice(4.5, 'GBP', 'no')).toBe('£4,50');
  });

  it('joins destinations that cost the same, cheapest first, rest of world last', () => {
    const { regions, and } = basketStrings.en;
    expect(deliveryGuideLine(guide, 'GBP', regions, and)).toBe(
      'United States £4.50, UK £5.99, Sweden £7, Norway and Denmark £8, rest of world £4.50'
    );
  });

  it('takes the cheapest destination outside the UK for "worldwide from"', () => {
    expect(worldwideFrom(guide, 'GBP')).toBe(4.5);
    expect(worldwideFrom(guide, 'NOK')).toBe(55);
  });

  it('swaps one answer and leaves the rest alone', () => {
    const groups = [{ category: 'x', items: [{ q: 'a', a: '1' }, { q: 'b', a: '2' }] }];
    expect(withAnswer(groups, 'b', '3')[0].items).toEqual([{ q: 'a', a: '1' }, { q: 'b', a: '3' }]);
    expect(groups[0].items[1].a).toBe('2');
  });
});
