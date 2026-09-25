import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categoryLandings, getCategoryLandingBySlug } from '@/lib/categories';
import { getProductsByCategory } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { ContentSection, ContentBody } from '@/components/v2/ui';
import { LandingTemplate } from '@/components/v2/landing/LandingTemplate';
import { collectionPageJsonLd, faqPageJsonLd, landingBreadcrumbJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

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
      languages: hreflangPair(`/category/${category.slug}`),
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
  const artists = await getPublishedArtists();
  const path = `/category/${category.slug}`;

  return (
    <LandingTemplate
      heading={category.heading}
      intro={[category.intro, category.intro2]}
      breadcrumb={[{ label: 'Prints', href: '/products' }, { label: category.heading }]}
      products={products}
      countLabel={`${products.length} ${products.length === 1 ? 'print' : 'prints'}`}
      fromLabel="from"
      printsHeading="Prints"
      faqHeading="Common questions"
      faqs={category.faqs}
      crossLinks={{ current: { type: 'category', slug: category.slug } }}
      artists={artists}
      jsonLd={[
        faqPageJsonLd(category.faqs),
        collectionPageJsonLd({ name: category.title, description: category.description, path, locale: 'en', products }),
        landingBreadcrumbJsonLd({ locale: 'en', homeName: 'Home', productsName: 'Art Prints', name: category.heading, path }),
      ]}
    >
      <ContentSection id="styling" title={category.stylingHeading} className="mt-section">
        <ContentBody>
          <p>{category.stylingBody}</p>
        </ContentBody>
      </ContentSection>
    </LandingTemplate>
  );
}
