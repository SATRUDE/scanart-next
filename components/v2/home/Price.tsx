'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getLowestProductPrices, type PricedProduct } from '@/lib/pricing';

/**
 * A print's lowest price in the visitor's currency (the country picker). A
 * client leaf so the tiles around it stay server components; the server's
 * HTML carries the GBP price, as PrintCard's does.
 */
export function Price({ product }: { product: PricedProduct }) {
  const { formatPrice } = useLanguage();
  return <>{formatPrice(getLowestProductPrices(product))}</>;
}
