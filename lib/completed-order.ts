import type { CompletedOrder } from '@/components/OrderComplete';

/**
 * The order the confirmation page shows, handed over from checkout.
 *
 * sessionStorage, not localStorage: it belongs to this tab and this visit,
 * and is gone when the tab closes, so a later visitor on a shared computer
 * never sees someone else's name and address. Every access is wrapped: a
 * private window or blocked storage throws, and checkout then shows the
 * confirmation in place instead.
 */
const KEY = 'sa-completed-order';

export function saveCompletedOrder(order: CompletedOrder): boolean {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(order));
    return true;
  } catch {
    return false;
  }
}

/** The stored JSON, or null. A string, so it is a stable useSyncExternalStore snapshot. */
export function readCompletedOrderJson(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseCompletedOrder(json: string | null): CompletedOrder | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as CompletedOrder;
    return Array.isArray(o?.lines) && o.totals ? o : null;
  } catch {
    return null;
  }
}
