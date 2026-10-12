import { describe, expect, it, vi } from 'vitest';
import { assertOrderIsSafe, UnsafeOrderError, zeroProblems } from './order-guard';
import type { ComputedOrder } from './order';
import type { CostRow } from './order-margin';

const COSTS: CostRow[] = [
  { size: '40x60cm', frame: 'no-frame', printCost: 9.43, shipCost: 5.35, shipCostAdditional: 0.5 },
  { size: '40x60cm', frame: 'wood', printCost: 35.71, shipCost: 11.65, shipCostAdditional: 5 },
];
const loadCosts = async () => ({ costs: COSTS, perEur: 0.85483, gbpPerEur: 0.85483 });
const deliver = async () => ({ amount: 5.99 });

function order(over: Partial<ComputedOrder> = {}): ComputedOrder {
  return {
    amount: 104.99,
    subtotal: 95,
    shipping: 9.99,
    shippingSource: 'set-by-hand',
    discount: null,
    discountAmount: 0,
    items: [],
    lines: [{ size: '40x60cm', frame: 'wood', quantity: 1, printPrice: 56, framePrice: 39 }],
    ...over,
  };
}

describe('zeroProblems', () => {
  it('flags a line with no price, a frame with no price, and free delivery', () => {
    expect(
      zeroProblems({
        shipping: 0,
        lines: [
          { size: 'A3', frame: 'no-frame', quantity: 1, printPrice: 0, framePrice: 0 },
          { size: 'A2', frame: 'wood', quantity: 1, printPrice: 56, framePrice: 0 },
        ],
      })
    ).toEqual(['no price for A3', 'no frame price for A2, wood frame', 'delivery came to zero']);
  });

  it('passes a normal order', () => {
    expect(zeroProblems(order())).toEqual([]);
  });
});

describe('assertOrderIsSafe', () => {
  it('takes a framed Patrik 40x60 to the UK at today\'s prices', async () => {
    const alert = vi.fn(async () => {});
    const r = await assertOrderIsSafe(order(), 'GB', 'GBP', { loadCosts, deliver, alert });
    expect(r.margin!.net).toBeGreaterThan(0);
    expect(alert).not.toHaveBeenCalled();
  });

  it('refuses and alerts when delivery comes to zero, before reading any costs', async () => {
    const alert = vi.fn(async () => {});
    const load = vi.fn(loadCosts);
    await expect(
      assertOrderIsSafe(order({ shipping: 0, amount: 95 }), 'GB', 'GBP', { loadCosts: load, deliver, alert })
    ).rejects.toBeInstanceOf(UnsafeOrderError);
    expect(load).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('REFUSED'));
  });

  it('refuses an order that would lose money, with a message the buyer can act on', async () => {
    const alert = vi.fn(async () => {});
    const cheap = order({ amount: 44.99, subtotal: 35, lines: [{ size: '40x60cm', frame: 'wood', quantity: 1, printPrice: 20, framePrice: 15 }] });
    const err = await assertOrderIsSafe(cheap, 'GB', 'GBP', { loadCosts, deliver, alert }).catch(e => e);
    expect(err).toBeInstanceOf(UnsafeOrderError);
    expect(err.message).toMatch(/Nothing has been charged/);
    expect(err.margin.net).toBeLessThan(0);
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('gallery net'));
  });

  it('takes the order but alerts when costs cannot be read', async () => {
    const alert = vi.fn(async () => {});
    const r = await assertOrderIsSafe(order(), 'GB', 'GBP', { loadCosts: async () => null, deliver, alert });
    expect(r.margin).toBeNull();
    expect(r.unjudged).toBe('costs unreadable');
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('NOT checked'));
  });

  it('still refuses when the Slack alert itself fails', async () => {
    const alert = vi.fn(async () => {
      throw new Error('slack down');
    });
    await expect(
      assertOrderIsSafe(order({ shipping: 0 }), 'GB', 'GBP', { loadCosts, deliver, alert })
    ).rejects.toBeInstanceOf(UnsafeOrderError);
  });
});
