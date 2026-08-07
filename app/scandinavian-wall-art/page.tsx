import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { wallArtLanding } from '@/lib/wall-art';
import { getAllProducts } from '@/lib/products';
import { PrintCard } from '@/components/PrintCard';
import { ReadMore } from '@/components/ReadMore';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { BASE_URL, socialCard } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const products = await getAllProducts();

  return {
    // Absolute: the layout's "| Scandinavian Art Gallery" template would push
    // this past Google's ~60-char display cut and truncate the UK modifier the
    // page targets ('nordic wall art uk' is the cluster's best position).
    title: { absolute: wallArtLanding.title },
    description: wallArtLanding.description,
    alternates: {
      canonical: '/scandinavian-wall-art',
    },
    ...socialCard({
      title: wallArtLanding.title,
      description: wallArtLanding.description,
      path: '/scandinavian-wall-art',
      image: products[0]?.image,
    }),
  };
}

export default async function ScandinavianWallArtPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-8 py-8">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to products
      </Link>

      <header className="mb-16">
        <h1 className="text-3xl text-neutral-900">{wallArtLanding.heading}</h1>
        <ReadMore className="mt-4 max-w-3xl">
          <p className="text-muted-foreground leading-relaxed">{wallArtLanding.intro}</p>
          <p className="text-muted-foreground leading-relaxed mt-4">{wallArtLanding.intro2}</p>
        </ReadMore>
      </header>

      <div className="mb-8">
        <p className="text-muted-foreground">{products.length} {products.length === 1 ? 'print' : 'prints'}</p>
      </div>

      {/* Section heading for the grid (sr-only): keeps the heading order h1 -> h2 -> card h3 */}
      <h2 className="sr-only">Prints</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            {/* first desktop row is above the fold: preload it, lazy-load the rest */}
            <PrintCard product={product} priority={index < 4} />
          </Link>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{wallArtLanding.stylingHeading}</h2>
        {/* Rendered as JSX rather than a config string so the room mentions can
            carry real internal links to the collection landings. Copy by Ken. */}
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">
          Which print goes first depends on the room. In the living room, let one confident piece anchor
          the sofa wall and build outwards from it; our{' '}
          <Link href="/collection/living-room" className="underline hover:text-neutral-900">living room collection</Link>{' '}
          gathers the prints with that kind of presence. The bedroom rewards softer choices, muted botanicals
          and quiet abstracts you are happy to wake up to, and there is a{' '}
          <Link href="/collection/bedroom" className="underline hover:text-neutral-900">bedroom edit</Link>{' '}
          for exactly that. The home office suits the characterful end of the catalogue, a wry illustration
          or a graphic abstract hung in your eyeline from the desk, collected on the{' '}
          <Link href="/collection/home-office" className="underline hover:text-neutral-900">home office page</Link>.
          Wherever a piece hangs, centre it at roughly 145 to 150 cm from the floor, and when you group
          prints, keep the frame choice consistent so the wall reads as one decision.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">Common questions</h2>
        <div className="mt-4 max-w-3xl space-y-6">
          {wallArtLanding.faqs.map(faq => (
            <div key={faq.question}>
              <h3 className="font-medium text-neutral-900">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <LandingCrossLinks current={{ type: 'wall-art', slug: 'scandinavian-wall-art' }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: wallArtLanding.faqs.map(faq => ({
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
            name: wallArtLanding.title,
            description: wallArtLanding.description,
            url: `${BASE_URL}/scandinavian-wall-art`,
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
              { '@type': 'ListItem', position: 3, name: wallArtLanding.heading, item: `${BASE_URL}/scandinavian-wall-art` },
            ],
          }),
        }}
      />
    </div>
  );
}
