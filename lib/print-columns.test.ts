import { describe, it, expect } from 'vitest';
import { splitIntoColumns, tileHeightRatio } from './print-columns';

describe('print columns', () => {
  it('reads the tile shape from the print size', () => {
    expect(tileHeightRatio('50x50cm')).toBe(1);
    expect(tileHeightRatio('50x70cm')).toBeCloseTo(1.4);
    expect(tileHeightRatio('A2')).toBeCloseTo(1.4);
    expect(tileHeightRatio(undefined)).toBeCloseTo(1.4);
  });

  it('keeps the list in order, so mobile and the ItemList read the same', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const columns = splitIntoColumns(items, i => (i % 5 === 0 ? 1 : 1.4));
    expect(columns.flat()).toEqual(items);
    expect(columns).toHaveLength(3);
  });

  it('evens out the column heights', () => {
    const items = Array.from({ length: 12 }, () => 1);
    expect(splitIntoColumns(items, x => x).map(c => c.length)).toEqual([4, 4, 4]);
  });

  it('copes with fewer prints than columns', () => {
    expect(splitIntoColumns([1, 2], x => x)).toEqual([[1], [2]]);
    expect(splitIntoColumns([], x => x)).toEqual([]);
  });
});
