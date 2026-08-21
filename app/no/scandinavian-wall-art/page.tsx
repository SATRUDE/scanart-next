import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllProducts } from '@/lib/products';
import { PrintCard } from '@/components/PrintCard';
import { ReadMore } from '@/components/ReadMore';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian wall-art landing: app/scandinavian-wall-art/page.tsx mirrored,
// with copy from lib/i18n/no.ts. The slug stays English on purpose (Mark's
// standing rule) while the copy targets what a Norwegian actually searches for.
const t = no.wallArt;

export async function generateMetadata(): Promise<Metadata> {
  const products = await getAllProducts();

  return {
    // Absolute, as on the English page: the layout's brand suffix would push
    // this past Google's ~60-char display cut.
    title: { absolute: t.title },
    description: t.description,
    alternates: {
      canonical: '/no/scandinavian-wall-art',
      languages: hreflangPair('/scandinavian-wall-art'),
    },
    ...socialCard({
      title: t.title,
      description: t.description,
      path: '/no/scandinavian-wall-art',
      image: products[0]?.image,
      ogLocale: 'nb_NO',
    }),
  };
}

export default async function NorwegianWallArtPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-8 py-8">
      <Link href="/no/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t.backToProducts}
      </Link>

      <header className="mb-16">
        <h1 className="text-3xl text-neutral-900">{t.heading}</h1>
        <ReadMore className="mt-4 max-w-3xl" moreLabel={no.shared.readMore} lessLabel={no.shared.readLess}>
          <p className="text-muted-foreground leading-relaxed">{t.intro}</p>
          <p className="text-muted-foreground leading-relaxed mt-4">{t.intro2}</p>
        </ReadMore>
      </header>

      <div className="mb-8">
        <p className="text-muted-foreground">{products.length} {t.printsSuffix}</p>
      </div>

      {/* sr-only section heading, keeping the order h1 -> h2 -> card h3 */}
      <h2 className="sr-only">{t.printsSrHeading}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <Link key={product.id} href={`/no/product/${product.slug}`}>
            {/* first desktop row is above the fold: preload it, lazy-load the rest */}
            <PrintCard product={product} priority={index < 4} outOfStockLabel={no.shared.outOfStock} />
          </Link>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{t.framedHeading}</h2>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{t.framedBody}</p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{t.stylingHeading}</h2>
        {/* JSX rather than one config string so the room mentions carry real
            internal links to the Norwegian collection landings. */}
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">
          {t.styling.p1}
          <Link href="/no/collection/living-room" className="underline hover:text-neutral-900">{t.styling.livingRoomLink}</Link>
          {t.styling.p2}
          <Link href="/no/collection/bedroom" className="underline hover:text-neutral-900">{t.styling.bedroomLink}</Link>
          {t.styling.p3}
          <Link href="/no/collection/home-office" className="underline hover:text-neutral-900">{t.styling.homeOfficeLink}</Link>
          {t.styling.p4}
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{t.commonQuestions}</h2>
        <div className="mt-4 max-w-3xl space-y-6">
          {t.faqs.map(faq => (
            <div key={faq.question}>
              <h3 className="font-medium text-neutral-900">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <LandingCrossLinks
        current={{ type: 'wall-art', slug: 'scandinavian-wall-art' }}
        strings={no.crossLinks}
        locale="no"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: 'nb-NO',
            mainEntity: t.faqs.map(faq => ({
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
            name: t.title,
            description: t.description,
            url: `${BASE_URL}/no/scandinavian-wall-art`,
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
              { '@type': 'ListItem', position: 1, name: no.shared.home, item: `${BASE_URL}/no` },
              { '@type': 'ListItem', position: 2, name: t.breadcrumbPrints, item: `${BASE_URL}/no/products` },
              { '@type': 'ListItem', position: 3, name: t.heading, item: `${BASE_URL}/no/scandinavian-wall-art` },
            ],
          }),
        }}
      />
    </div>
  );
}
