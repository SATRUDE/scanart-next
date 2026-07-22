import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { categoryLandings, getCategoryLandingBySlug } from '@/lib/categories';
import { getProductsByCategory } from '@/lib/products';
import { PrintCard } from '@/components/PrintCard';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { BASE_URL, socialCard } from '@/lib/site';

export async function generateStaticParams() {
  return categoryLandings.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryLandingBySlug(slug);
  if (!category) return {};

  // Lead print as the social image; socialCard falls back to the site OG image.
  const products = await getProductsByCategory(category.category);

  return {
    title: category.title,
    description: category.description,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    ...socialCard({
      title: category.title,
      description: category.description,
      path: `/category/${category.slug}`,
      image: products[0]?.image,
    }),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryLandingBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(category.category);
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
        <h1 className="text-3xl text-neutral-900">{category.heading}</h1>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{category.intro}</p>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{category.intro2}</p>
      </header>

      <div className="mb-8">
        <p className="text-muted-foreground">{products.length} {products.length === 1 ? 'print' : 'prints'}</p>
      </div>

      {/* Section heading for the grid (sr-only): keeps the heading order h1 -> h2 -> card h3 */}
      <h2 className="sr-only">Prints</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <PrintCard product={product} />
          </Link>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{category.stylingHeading}</h2>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{category.stylingBody}</p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">Common questions</h2>
        <div className="mt-4 max-w-3xl space-y-6">
          {category.faqs.map(faq => (
            <div key={faq.question}>
              <h3 className="font-medium text-neutral-900">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <LandingCrossLinks current={{ type: 'category', slug: category.slug }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: category.faqs.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category.title,
            description: category.description,
            url: `${BASE_URL}/category/${category.slug}`,
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
              { '@type': 'ListItem', position: 3, name: category.heading, item: `${BASE_URL}/category/${category.slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
