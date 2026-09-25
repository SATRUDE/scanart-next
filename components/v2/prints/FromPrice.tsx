'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { CurrencyPrices } from '@/lib/pricing';

/**
 * "from £35" in the page header's meta line. A client leaf only because the
 * price follows the visitor's country picker, as every print tile's does.
 * The prices come from lowestPrices() on the server.
 */
export function FromPrice({ prices, label }: { prices: CurrencyPrices; label: string }) {
  const { formatPrice } = useLanguage();
  return <>{label} {formatPrice(prices)}</>;
}
