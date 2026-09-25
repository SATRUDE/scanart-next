'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { CurrencyPrices } from '@/lib/pricing';

/**
 * A price in the visitor's currency, from the country picker. A client leaf
 * only because the currency is chosen in the browser; the prices themselves
 * come from the catalogue on the server.
 */
export function LocalPrice({ prices }: { prices: CurrencyPrices }) {
  const { formatPrice } = useLanguage();
  return <>{formatPrice(prices)}</>;
}
