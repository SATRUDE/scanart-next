import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { collections, getCollectionBySlug } from '@/lib/collections';
import { getAllProducts } from '@/lib/products';
import { PrintCard } from '@/components/PrintCard';
import { BASE_URL } from '@/lib/site';

export async function generateStaticParams() {
  return collections.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) return {};

  return {
    title: collection.title,
    description: collection.description,
    alternates: {
      canonical: `/collection/${collection.slug}`,
    },
    openGraph: {
      title: collection.title,
      description: collection.description,
      type: 'website',
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  // Resolve the curated slug list to products, preserving the configured order
  // and silently dropping any slug that no longer exists in the catalogue.
  const all = await getAllProducts();
  const bySlug = new Map(all.map(p => [p.slug, p]));
  const products = collection.productSlugs
    .map(s => bySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (products.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-8 py-8">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to products
      </Link>

      <header className="mb-16">
        <h1 className="text-3xl text-neutral-900">{collection.heading}</h1>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{collection.intro}</p>
      </header>

      <div className="mb-8">
        <p className="text-muted-foreground">{products.length} {products.length === 1 ? 'print' : 'prints'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <PrintCard product={product} />
          </Link>
        ))}
      </div>

      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl text-neutral-900">{collection.stylingHeading}</h2>
        <ul className="mt-4 space-y-3">
          {collection.stylingTips.map((tip, i) => (
            <li key={i} className="text-muted-foreground leading-relaxed">{tip}</li>
          ))}
        </ul>
        {collection.relatedArticleSlug && (
          <p className="mt-6 text-sm">
            <Link href={`/article/${collection.relatedArticleSlug}`} className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
              Read more: {collection.relatedArticleLabel} →
            </Link>
          </p>
        )}
      </section>

      <nav className="mt-16 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">All prints</Link>
        <Link href="/category/botanical" className="hover:text-foreground">Botanical prints</Link>
        <Link href="/category/abstract" className="hover:text-foreground">Abstract prints</Link>
        <Link href="/artists" className="hover:text-foreground">Meet the artists</Link>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: collection.title,
            description: collection.description,
            url: `${BASE_URL}/collection/${collection.slug}`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: products.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${BASE_URL}/product/${p.slug}`,
                name: p.name,
              })),
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
              { '@type': 'ListItem', position: 2, name: 'Art Prints', item: `${BASE_URL}/products` },
              { '@type': 'ListItem', position: 3, name: collection.heading, item: `${BASE_URL}/collection/${collection.slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
