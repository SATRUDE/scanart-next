import type { Metadata } from 'next';
import { getAllProducts } from '@/lib/products';
import { ProductsGrid } from '@/components/ProductsGrid';
import { BASE_URL, socialCard } from '@/lib/site';
import { metaTitle } from '@/lib/meta-title';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian catalogue: app/products/page.tsx mirrored, with ProductsGrid
// given locale="no" so every chip, card and empty-state link stays in the /no
// tree, and its labels swapped for lib/i18n/no.ts.
const t = no.products;

export const metadata: Metadata = {
  title: metaTitle(t.meta.title),
  description: t.meta.description,
  alternates: {
    canonical: '/no/products',
    languages: hreflangPair('/products'),
  },
  ...socialCard({
    title: t.meta.title,
    description: t.meta.description,
    path: '/no/products',
    ogLocale: 'nb_NO',
  }),
};

// Statically prerendered, exactly as the English page is: the query is read by
// a leaf behind ProductsGrid's own Suspense boundary, so the catalogue lands in
// the served HTML rather than a fallback.
export default async function NorwegianProductsPage() {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.meta.title,
    description: t.meta.description,
    url: `${BASE_URL}/no/products`,
    inLanguage: 'nb-NO',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE_URL}/no/product/${p.slug}`,
        name: p.name,
      })),
    },
  };

  return (
    <>
      <ProductsGrid
        products={products}
        categories={categories}
        locale="no"
        strings={{
          ...t.grid,
          categoryLabels: no.shared.categoryLabels,
          collectionChips: no.shared.collectionChips,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </>
  );
}
