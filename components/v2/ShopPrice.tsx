'use client';

import { usePathname } from 'next/navigation';
import { useSalePromotion } from '@/contexts/SalePromotionContext';
import { isNoPath } from '@/lib/i18n';
import { formatDisplayPrice, type Currency } from '@/lib/pricing';
import { salePrice, salePromotionStrings } from '@/lib/sale-promotion';
import { SaleAmount } from '@/components/v2/product/LocalPrice';

/**
 * A print's lowest price wherever the shop lists one (cards, search, the
 * homepage, Inspire, artist and category headers). The lowest price is always
 * the smallest unframed print, so while NORDIC20 is live it shows what checkout
 * will charge with the full price struck beside it (Mark, 2026-11-11: "add it
 * to all areas where the price is shown"). Off, it is the plain price.
 *
 * `prefix` puts a word before the amount ("from"); `tag` adds "20% off".
 */
export function ShopPrice({
  amount,
  currency,
  prefix,
  tag = false,
}: {
  amount: number;
  currency: Currency;
  prefix?: string;
  tag?: boolean;
}) {
  const saleActive = useSalePromotion();
  const locale = isNoPath(usePathname() || '/') ? 'no' : 'en';
  const lead = prefix ? `${prefix} ` : '';
  if (!saleActive) return <>{lead}{formatDisplayPrice(amount, currency)}</>;
  const t = salePromotionStrings[locale];
  return (
    <>
      {lead}
      <SaleAmount
        now={formatDisplayPrice(salePrice(amount), currency)}
        was={formatDisplayPrice(amount, currency)}
        off={tag ? t.off : undefined}
        wasLabel={t.was}
      />
    </>
  );
}
