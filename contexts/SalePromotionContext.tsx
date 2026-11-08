'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { isSalePromotionActive, SALE_CODE } from '@/lib/sale-promotion';

const SalePromotionContext = createContext(false);

/** One live check shared by the announcement and homepage module. Never
 * advertise a switched-off, expired, changed-scope or unreachable code. */
export function SalePromotionProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    async function refresh() {
      if (document.visibilityState === 'hidden') return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const timeout = window.setTimeout(() => request.abort(), 10_000);
      try {
        const response = await fetch('/api/validate-discount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: SALE_CODE }),
          cache: 'no-store',
          signal: request.signal,
        });
        const result = response.ok ? await response.json() : null;
        if (!disposed && controller === request) setActive(isSalePromotionActive(result));
      } catch {
        if (!disposed && controller === request) setActive(false);
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return <SalePromotionContext.Provider value={active}>{children}</SalePromotionContext.Provider>;
}

export function useSalePromotion() {
  return useContext(SalePromotionContext);
}
