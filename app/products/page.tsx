import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllProducts } from '@/lib/products';
import { ProductsGrid } from '@/components/ProductsGrid';

export const metadata: Metadata = {
  title: 'All Artwork',
  description: 'Browse our curated collection of Scandinavian and Nordic artwork. Shop wall art, prints, and original pieces from talented Scandinavian artists.',
};

export default async function ProductsPage() {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <Suspense fallback={<div className="container mx-auto px-8 py-16 text-center text-muted-foreground">Loading products...</div>}>
      <ProductsGrid products={products} categories={categories} />
    </Suspense>
  );
}
