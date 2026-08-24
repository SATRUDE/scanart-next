import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { nordicArtLanding } from '@/lib/nordic-art';
import { getAllProducts } from '@/lib/products';
import { artists } from '@/data/artists';
import { PrintCard } from '@/components/PrintCard';
import { ReadMore } from '@/components/ReadMore';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { BASE_URL, socialCard } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const products = await getAllProducts();

  return {
    // Absolute for the same reason as /scandinavian-wall-art: the layout's
    // "| Scandinavian Art Gallery" suffix would truncate the query the page
    // targets past Google's ~60-char display cut.
    title: { absolute: nordicArtLanding.title },
    description: nordicArtLanding.description,
    alternates: {
      canonical: '/nordic-art',
    },
    ...socialCard({
      title: nordicArtLanding.title,
      description: nordicArtLanding.description,
      path: '/nordic-art',
      image: products[0]?.image,
    }),
  };
}

export default async function NordicArtPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-8 py-8">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to products
      </Link>

      <header className="mb-16">
        <h1 className="text-3xl text-neutral-900">{nordicArtLanding.heading}</h1>
        <ReadMore className="mt-4 max-w-3xl">
          <p className="text-muted-foreground leading-relaxed">{nordicArtLanding.intro}</p>
          <p className="text-muted-foreground leading-relaxed mt-4">{nordicArtLanding.intro2}</p>
        </ReadMore>
      </header>

      <div className="mb-8">
        <p className="text-muted-foreground">{products.length} {products.length === 1 ? 'print' : 'prints'}</p>
      </div>

      <h2 className="sr-only">Prints</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <PrintCard product={product} priority={index < 4} />
          </Link>
        ))}
      </div>

      {/* Where /scandinavian-wall-art routes by room, this page routes by
          artist: the query family is about the art itself, and the artist
          pages are the site's best-ranking documents, so they get the links. */}
      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">The artists</h2>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">
          Every print here comes from one of the gallery&apos;s artists, each with their own page of
          work and background:{' '}
          {artists.map((artist, i) => (
            <span key={artist.slug}>
              <Link href={`/artist/${artist.slug}`} className="underline hover:text-neutral-900">{artist.name}</Link>
              {i < artists.length - 2 ? ', ' : i === artists.length - 2 ? ' and ' : '.'}
            </span>
          ))}
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{nordicArtLanding.framedHeading}</h2>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{nordicArtLanding.framedBody}</p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">Common questions</h2>
        <div className="mt-4 max-w-3xl space-y-6">
          {nordicArtLanding.faqs.map(faq => (
            <div key={faq.question}>
              <h3 className="font-medium text-neutral-900">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <LandingCrossLinks current={{ type: 'nordic-art', slug: 'nordic-art' }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: nordicArtLanding.faqs.map(faq => ({
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
            name: nordicArtLanding.title,
            description: nordicArtLanding.description,
            url: `${BASE_URL}/nordic-art`,
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
              { '@type': 'ListItem', position: 3, name: nordicArtLanding.heading, item: `${BASE_URL}/nordic-art` },
            ],
          }),
        }}
      />
    </div>
  );
}
