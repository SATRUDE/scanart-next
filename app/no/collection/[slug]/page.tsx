import type { Metadata } from 'next';
import { metaTitle } from '@/lib/meta-title';
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
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian collection landing pages (phase 2, 2026-08-21):
// app/collection/[slug]/page.tsx mirrored exactly (same params, same
// components, same classes), with the copy swapped for lib/i18n/no.ts.
//
// Only the COPY is translated. productSlugs, the styling-card images and the
// related-article slug all still come from lib/collections.ts, so the curation
// cannot drift between the two languages: add a print to a collection once and
// both pages pick it up.
//
// Falls back to the English collection copy for any collection added before its
// translation, so the EN/NO pair always exists together rather than 404ing.
function getCopy(slug: string) {
  const collection = getCollectionBySlug(slug);
  if (!collection) return undefined;
  return { collection, copy: no.collections[slug] ?? collection };
}

export async function generateStaticParams() {
  return collections.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = getCopy(slug);
  if (!found) return {};
  const { collection, copy } = found;

  // Lead curated print as the social image; socialCard falls back to the site
  // OG image if the slug no longer resolves.
  const all = await getAllProducts();
  const leadImage = collection.productSlugs
    .map(s => all.find(p => p.slug === s))
    .find(Boolean)?.image;

  return {
    // metaTitle keeps the brand suffix only where the title has room for it;
    // "Skandinavisk veggkunst til hjemmekontoret" is long enough to lose it.
    title: metaTitle(copy.title),
    description: copy.description,
    alternates: {
      canonical: `/no/collection/${slug}`,
      languages: hreflangPair(`/collection/${slug}`),
    },
    ...socialCard({
      title: copy.title,
      description: copy.description,
      path: `/no/collection/${slug}`,
      image: leadImage,
      ogLocale: 'nb_NO',
    }),
  };
}

export default async function NorwegianCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = getCopy(slug);

  if (!found) {
    notFound();
  }
  const { collection, copy } = found;

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

  // Styling cards carry their images from the English config and their words
  // from the Norwegian one; fall back to the English cards if a translation
  // has no cards of its own.
  const stylingCards = collection.stylingCards?.map((card, i) => ({
    image: card.image,
    label: copy.stylingCards?.[i]?.label ?? card.label,
    tip: copy.stylingCards?.[i]?.tip ?? card.tip,
    alt: copy.stylingCards?.[i]?.alt ?? card.alt,
  }));

  return (
    <div className="container mx-auto px-8 py-8">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {no.shared.backToProducts}
      </Link>

      <header className="mb-16">
        <h1 className="text-3xl text-neutral-900">{copy.heading}</h1>
        <ReadMore className="mt-4 max-w-3xl" moreLabel={no.shared.readMore} lessLabel={no.shared.readLess}>
          <p className="text-muted-foreground leading-relaxed">{copy.intro}</p>
          <p className="text-muted-foreground leading-relaxed mt-4">{copy.intro2}</p>
        </ReadMore>
      </header>

      <div className="mb-8">
        <p className="text-muted-foreground">{products.length} {products.length === 1 ? no.shared.printOne : no.shared.printOther}</p>
      </div>

      {/* Section heading for the grid (sr-only): keeps the heading order h1 -> h2 -> card h3 */}
      <h2 className="sr-only">{no.shared.printsSrHeading}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            {/* first desktop row is above the fold: preload it, lazy-load the rest */}
            <PrintCard
              product={product}
              priority={index < 4}
              categoryLabel={no.shared.categoryLabels[product.category]}
              outOfStockLabel={no.shared.outOfStock}
            />
          </Link>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{copy.stylingHeading}</h2>
        {stylingCards ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {stylingCards.map((card, i) => (
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
            {copy.stylingTips.map((tip, i) => (
              <li key={i} className="text-muted-foreground leading-relaxed">{tip}</li>
            ))}
          </ul>
        )}
        {collection.relatedArticleSlug && (
          <p className="mt-8 text-sm">
            <Link href={`/article/${collection.relatedArticleSlug}`} className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
              {no.shared.readMoreArticle}: {copy.relatedArticleLabel ?? collection.relatedArticleLabel} →
            </Link>
          </p>
        )}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{no.shared.commonQuestions}</h2>
        <div className="mt-4 max-w-3xl space-y-6">
          {copy.faqs.map(faq => (
            <div key={faq.question}>
              <h3 className="font-medium text-neutral-900">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <LandingCrossLinks current={{ type: 'collection', slug }} strings={no.crossLinks} locale="no" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: 'no',
            mainEntity: copy.faqs.map(faq => ({
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
            name: copy.title,
            description: copy.description,
            url: `${BASE_URL}/no/collection/${slug}`,
            inLanguage: 'no',
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
              { '@type': 'ListItem', position: 1, name: no.shared.home, item: `${BASE_URL}/no` },
              { '@type': 'ListItem', position: 2, name: no.crossLinks.allPrints, item: `${BASE_URL}/products` },
              { '@type': 'ListItem', position: 3, name: copy.heading, item: `${BASE_URL}/no/collection/${slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
