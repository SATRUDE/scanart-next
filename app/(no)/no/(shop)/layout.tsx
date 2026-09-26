import { getAllProducts } from '@/lib/products';
import { ShopFrame } from '@/components/v2/shop/ShopFrame';
import { shopRoutes } from '@/components/v2/shop/shop-routes';
import { shopStrings } from '@/components/v2/shop/shop-strings';

/**
 * The Norwegian shop: app/(en)/(shop)/layout.tsx mirrored, with the frame
 * given locale="no" so every option, card and empty-state link stays in the
 * /no tree, and its labels swapped for lib/i18n/no.ts.
 */
export default async function NorwegianShopLayout({ children }: { children: React.ReactNode }) {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();
  return (
    <ShopFrame locale="no" routes={await shopRoutes('no')} categories={categories} strings={shopStrings('no')}>
      {children}
    </ShopFrame>
  );
}
