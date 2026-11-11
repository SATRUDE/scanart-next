'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useSalePromotion } from '@/contexts/SalePromotionContext';
import { salePrices, salePromotionStrings } from '@/lib/sale-promotion';
import type { CurrencyPrices } from '@/lib/pricing';

/**
 * A price in the visitor's currency, from the country picker. A client leaf
 * only because the currency is chosen in the browser; the prices themselves
 * come from the catalogue on the server.
 *
 * With `sale`, an unframed price shows the live NORDIC20 saving: the sale
 * price, the full price struck through, and "20% off". Only while the store
 * says the sale is on, so a switched-off code never shows a price checkout
 * would not charge.
 */
export function LocalPrice({ prices, sale = false, locale = 'en' }: { prices: CurrencyPrices; sale?: boolean; locale?: 'en' | 'no' }) {
  const { formatPrice } = useLanguage();
  const saleActive = useSalePromotion();
  if (!sale || !saleActive) return <>{formatPrice(prices)}</>;
  const t = salePromotionStrings[locale];
  return <SaleAmount now={formatPrice(salePrices(prices))} was={formatPrice(prices)} off={t.off} wasLabel={t.was} />;
}

/** Sale price, struck full price and the "20% off" tag, in one line. */
export function SaleAmount({ now, was, off, wasLabel }: { now: string; was: string; off?: string; wasLabel: string }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span>{now}</span>
      <s className="opacity-60">
        <span className="sr-only">{wasLabel} </span>
        {was}
      </s>
      {off && <span className="type-small text-brand">{off}</span>}
    </span>
  );
}
