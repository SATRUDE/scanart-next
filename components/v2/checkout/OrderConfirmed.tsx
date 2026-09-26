'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { OrderComplete } from '@/components/OrderComplete';
import { parseCompletedOrder, readCompletedOrderJson } from '@/lib/completed-order';
import type { CheckoutStrings } from '@/lib/i18n';

const subscribeNever = () => () => {};

/**
 * /order-confirmed: the order checkout just placed, with the full header and
 * footer (Figma: Order confirmed · desktop 279:4648, mobile 279:4761).
 * Opened with no order in this tab (a bookmark, a shared link), it goes to
 * the prints rather than thanking someone for nothing.
 */
export function OrderConfirmed({ t, locale }: { t: CheckoutStrings; locale: 'en' | 'no' }) {
  const router = useRouter();
  const productsHref = locale === 'no' ? '/no/products' : '/products';
  // undefined on the server and the first paint; then the stored JSON or null.
  const json = useSyncExternalStore<string | null | undefined>(subscribeNever, readCompletedOrderJson, () => undefined);
  const order = useMemo(() => (json === undefined ? undefined : parseCompletedOrder(json)), [json]);

  useEffect(() => {
    if (order === null) router.replace(productsHref);
  }, [order, router, productsHref]);

  if (!order) return <div className="min-h-[60vh]" />;
  return <OrderComplete t={t} order={order} productsHref={productsHref} />;
}
