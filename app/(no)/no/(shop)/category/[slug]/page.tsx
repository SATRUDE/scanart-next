import type { Metadata } from 'next';
import { metaTitle } from '@/lib/meta-title';
import { notFound } from 'next/navigation';
import { categoryLandings, getCategoryLandingBySlug } from '@/lib/categories';
import { getProductsByCategory } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { ContentSection, ContentBody } from '@/components/v2/ui';
import { ShopLanding } from '@/components/v2/shop/ShopLanding';
import { collectionPageJsonLd, faqPageJsonLd, landingBreadcrumbJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian category landing pages: app/(en)/(shop)/category/[slug]/page.tsx
// mirrored exactly (same params, same template), with the copy swapped for
// lib/i18n/no.ts. Falls back to the English landing copy for any category
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
    // The Norwegian category titles are the longest in the /no tree, and
    // "Illustrasjoner og morsomme plakater" plus the layout's brand suffix ran
    // to 62 characters. metaTitle keeps the suffix on the ones with room.
    title: metaTitle(copy.title),
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
  const artists = await getPublishedArtists();
  const path = `/no/category/${slug}`;

  // The header and the Filter bar come from the shop layout
  // (app/(no)/no/(shop)/layout.tsx), in Norwegian, with the same fallback.
  return (
    <ShopLanding
      locale="no"
      products={products}
      faqHeading={no.shared.commonQuestions}
      faqs={copy.faqs}
      crossLinks={{ current: { type: 'category', slug }, strings: no.crossLinks }}
      artists={artists}
      jsonLd={[
        faqPageJsonLd(copy.faqs, 'no'),
        // ItemList and breadcrumb now stay inside /no (docs/v2-seo.md, "Fixed
        // along the way"): they pointed at /product and /products until V2.
        collectionPageJsonLd({ name: copy.title, description: copy.description, path, locale: 'no', inLanguage: 'no', products }),
        landingBreadcrumbJsonLd({ locale: 'no', homeName: no.shared.home, productsName: no.crossLinks.allPrints, name: copy.heading, path }),
      ]}
    >
      <ContentSection id="styling" title={copy.stylingHeading} className="mt-section">
        <ContentBody>
          <p>{copy.stylingBody}</p>
        </ContentBody>
      </ContentSection>
    </ShopLanding>
  );
}
