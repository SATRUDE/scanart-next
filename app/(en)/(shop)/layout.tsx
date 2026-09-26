import { getAllProducts } from '@/lib/products';
import { ShopFrame } from '@/components/v2/shop/ShopFrame';
import { shopRoutes } from '@/components/v2/shop/shop-routes';
import { shopStrings } from '@/components/v2/shop/shop-strings';

/**
 * The shop: /products, /category/[slug] and /collection/[slug], grouped so
 * they share this layout without the group changing any URL. The layout holds
 * the page header and the Filter bar, which therefore stay mounted between
 * these pages, and each page renders its grid and its own content below.
 * ShopFrame explains why (Mark: the options should feel like one page).
 *
 * Every URL is still its own statically rendered page: its metadata,
 * canonical, hreflang, JSON-LD and copy come from its page.tsx, and the header
 * for its path is in its served HTML.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();
  return (
    <ShopFrame locale="en" routes={await shopRoutes('en')} categories={categories} strings={shopStrings('en')}>
      {children}
    </ShopFrame>
  );
}
