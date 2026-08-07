import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { categoryLandings, getCategoryLandingBySlug } from '@/lib/categories';
import { getProductsByCategory } from '@/lib/products';
import { PrintCard } from '@/components/PrintCard';
import { ReadMore } from '@/components/ReadMore';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian category landing pages: app/category/[slug]/page.tsx mirrored
// exactly (same params, same components, same classes), with the copy swapped
// for lib/i18n/no.ts. Falls back to the English landing copy for any category
// added before its translation, so the EN/NO pair always exists together.
function getCopy(slug: string) {
  const landing = getCategoryLandingBySlug(slug);
  if (!landing) return undefined;
  return { landing, copy: no.categories[slug] ?? landing };
}

export async function generateStaticParams() {
  return categoryLandings.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = getCopy(slug);
  if (!found) return {};
  const { landing, copy } = found;

  // Lead print as the social image; socialCard falls back to the site OG image.
  const products = await getProductsByCategory(landing.category);

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/no/category/${slug}`,
      languages: hreflangPair(`/category/${slug}`),
    },
    ...socialCard({
      title: copy.title,
      description: copy.description,
      path: `/no/category/${slug}`,
      image: products[0]?.image,
      ogLocale: 'nb_NO',
    }),
  };
}

export default async function NorwegianCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = getCopy(slug);

  if (!found) {
    notFound();
  }
  const { landing, copy } = found;

  const products = await getProductsByCategory(landing.category);
  if (products.length === 0) {
    notFound();
  }

  const categoryLabel = no.shared.categoryLabels[landing.category];

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
              categoryLabel={categoryLabel}
              outOfStockLabel={no.shared.outOfStock}
            />
          </Link>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl text-neutral-900">{copy.stylingHeading}</h2>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{copy.stylingBody}</p>
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

      <LandingCrossLinks current={{ type: 'category', slug }} strings={no.crossLinks} locale="no" />

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
            url: `${BASE_URL}/no/category/${slug}`,
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
              { '@type': 'ListItem', position: 3, name: copy.heading, item: `${BASE_URL}/no/category/${slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
