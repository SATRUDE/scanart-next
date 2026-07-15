import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllProducts } from '@/lib/products';
import { ProductsGrid } from '@/components/ProductsGrid';
import { BASE_URL } from '@/lib/site';

const PAGE_TITLE = 'Nordic & Scandinavian Art Prints';
const PAGE_DESCRIPTION =
  'Shop Nordic and Scandinavian art prints from talented artists. Curated wall art and original pieces, with worldwide delivery.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/products',
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Awaiting searchParams (a Dynamic API) opts this page into request-time
  // rendering, so ProductsGrid's useSearchParams resolves on the server and
  // the served HTML carries the full product grid instead of the Suspense
  // fallback. Statically prerendered, this page served no product content.
  await searchParams;

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
      <Suspense fallback={<div className="container mx-auto px-8 py-16 text-center text-muted-foreground">Loading products...</div>}>
        <ProductsGrid products={products} categories={categories} />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </>
  );
}
