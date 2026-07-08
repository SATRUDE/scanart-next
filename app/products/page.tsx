import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllProducts } from '@/lib/products';
import { ProductsGrid } from '@/components/ProductsGrid';

export const metadata: Metadata = {
  title: 'All Artwork',
  description: 'Browse our curated collection of Scandinavian and Nordic artwork. Shop wall art, prints, and original pieces from talented Scandinavian artists.',
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

  return (
    <Suspense fallback={<div className="container mx-auto px-8 py-16 text-center text-muted-foreground">Loading products...</div>}>
      <ProductsGrid products={products} categories={categories} />
    </Suspense>
  );
}
