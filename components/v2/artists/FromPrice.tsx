'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { amountIn, type CurrencyPrices } from '@/lib/pricing';
import { ShopPrice } from '@/components/v2/ShopPrice';

/**
 * "from £35": the artist's cheapest print in the buyer's own currency, the
 * same way every PrintCard on the page is priced (the picker's country), so
 * the hero line and the grid below it never quote two currencies.
 */
export function FromPrice({ prices, euro, from }: { prices: CurrencyPrices; euro?: Record<string, number>; from: string }) {
  const { selectedCountry, euroCountry } = useLanguage();
  const currency = selectedCountry.currency;
  return <ShopPrice amount={amountIn(prices, currency, euroCountry, euro)} currency={currency} prefix={from} />;
}
