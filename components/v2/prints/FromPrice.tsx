'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { amountIn, type CurrencyPrices } from '@/lib/pricing';
import { ShopPrice } from '@/components/v2/ShopPrice';

/**
 * "from £35" in the page header's meta line. A client leaf only because the
 * price follows the visitor's country picker, as every print tile's does.
 * The prices come from lowestPrices() on the server.
 */
export function FromPrice({ prices, euro, label }: { prices: CurrencyPrices; euro?: Record<string, number>; label: string }) {
  const { selectedCountry, euroCountry } = useLanguage();
  const currency = selectedCountry.currency;
  return <ShopPrice amount={amountIn(prices, currency, euroCountry, euro)} currency={currency} prefix={label} />;
}
