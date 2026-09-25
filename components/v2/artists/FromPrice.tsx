'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import type { CurrencyPrices } from '@/lib/pricing';

/**
 * "from £35": the artist's cheapest print in the buyer's own currency, the
 * same way every PrintCard on the page is priced (the picker's country), so
 * the hero line and the grid below it never quote two currencies.
 */
export function FromPrice({ prices, from }: { prices: CurrencyPrices; from: string }) {
  const { formatPrice } = useLanguage();
  return <>{`${from} ${formatPrice(prices)}`}</>;
}
