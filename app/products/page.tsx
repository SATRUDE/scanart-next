import type { Metadata } from 'next';
import { getAllProducts } from '@/lib/products';
import { ProductsGrid } from '@/components/ProductsGrid';
import { BASE_URL, socialCard } from '@/lib/site';
import { metaTitle } from '@/lib/meta-title';

const PAGE_TITLE = 'Nordic & Scandinavian Art Prints: A Curated Collection';
const PAGE_DESCRIPTION =
  'A curated collection of Scandinavian and Nordic art prints by independent Norwegian artists. Framed or unframed, with worldwide delivery.';

export const metadata: Metadata = {
  // 54 characters of its own, so the layout's brand suffix pushed the rendered
  // title to 81 and Google cut it. metaTitle drops the suffix here.
  title: metaTitle(PAGE_TITLE),
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/products',
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/products' }),
};

// Statically prerendered. This page used to await the searchParams prop (a
// Dynamic API) so that ProductsGrid's useSearchParams resolved on the server
// and the served HTML carried the catalogue rather than a Suspense fallback.
// The cost was that /products alone was rendered per request and served
// `Cache-Control: private, no-store`, so it never hit the CDN. The query is
// now read by a leaf component behind its own Suspense boundary inside
// ProductsGrid, which is what useSearchParams wants: only that leaf is
// client-rendered, and the grid above it prerenders into the static HTML.
export default async function ProductsPage() {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();

  // Structured data for the core "art prints" landing: CollectionPage plus an
  // ItemList enumerating the full catalogue, matching the sibling listing pages
  // (/collection, /artists, /journal). Rendered here in the server component so
  // it lands in the served HTML even though the grid itself is a client component.
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${BASE_URL}/products`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}/product/${p.slug}`,
        name: p.name,
      })),
    },
  };

  return (
    <>
      <ProductsGrid products={products} categories={categories} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </>
  );
}
