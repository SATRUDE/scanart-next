import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { collections, getCollectionBySlug } from '@/lib/collections';
import { getAllProducts } from '@/lib/products';
import { PrintCard } from '@/components/PrintCard';
import { ReadMore } from '@/components/ReadMore';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { BASE_URL, socialCard } from '@/lib/site';

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

  // Lead curated print as the social image; socialCard falls back to the site
  // OG image if the slug no longer resolves.
  const all = await getAllProducts();
  const leadImage = collection.productSlugs
    .map(s => all.find(p => p.slug === s))
    .find(Boolean)?.image;

  return {
    title: collection.title,
    description: collection.description,
    alternates: {
      canonical: `/collection/${collection.slug}`,
    },
    ...socialCard({
      title: collection.title,
      description: collection.description,
      path: `/collection/${collection.slug}`,
      image: leadImage,
    }),
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
        <ReadMore className="mt-4 max-w-3xl">
          <p className="text-muted-foreground leading-relaxed">{collection.intro}</p>
          <p className="text-muted-foreground leading-relaxed mt-4">{collection.intro2}</p>
        </ReadMore>
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
        <h2 className="text-2xl text-neutral-900">{collection.stylingHeading}</h2>
        {collection.stylingCards ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {collection.stylingCards.map((card, i) => (
              <div key={i}>
                <div className="relative aspect-[4/3] overflow-hidden rounded bg-neutral-50 mb-4">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top"
                  />
                </div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{card.label}</p>
                <p className="text-sm text-neutral-900 leading-relaxed">{card.tip}</p>
              </div>
            ))}
          </div>
        ) : (
          <ul className="mt-4 space-y-3 max-w-3xl">
            {collection.stylingTips.map((tip, i) => (
              <li key={i} className="text-muted-foreground leading-relaxed">{tip}</li>
            ))}
          </ul>
        )}
        {collection.relatedArticleSlug && (
          <p className="mt-8 text-sm">
            <Link href={`/article/${collection.relatedArticleSlug}`} className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
              Read more: {collection.relatedArticleLabel} →
            </Link>
          </p>
        )}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">Common questions</h2>
        <div className="mt-4 max-w-3xl space-y-6">
          {collection.faqs.map(faq => (
            <div key={faq.question}>
              <h3 className="font-medium text-neutral-900">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <LandingCrossLinks current={{ type: 'collection', slug: collection.slug }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: collection.faqs.map(faq => ({
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
