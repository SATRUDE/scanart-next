import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { collections, getCollectionBySlug } from '@/lib/collections';
import { getAllProducts } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { ShopLanding } from '@/components/v2/shop/ShopLanding';
import { collectionProducts } from '@/components/v2/shop/shop-routes';
import { CollectionStyling } from '@/components/v2/landing/CollectionStyling';
import { collectionPageJsonLd, faqPageJsonLd, landingBreadcrumbJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

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
      // Norwegian twins landed 2026-08-21, so the pair declares itself both ways.
      languages: hreflangPair(`/collection/${collection.slug}`),
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
  const products = collectionProducts(collection, all);

  if (products.length === 0) {
    notFound();
  }
  const artists = await getPublishedArtists();
  const path = `/collection/${collection.slug}`;

  // The header (H1 = collection.heading, both intro paragraphs, the meta line)
  // and the Filter bar come from the shop layout (components/v2/shop/shop-routes.tsx),
  // so they stay put when a visitor moves between the shop's pages.
  return (
    <ShopLanding
      products={products}
      faqHeading="Common questions"
      faqs={collection.faqs}
      crossLinks={{ current: { type: 'collection', slug: collection.slug } }}
      artists={artists}
      jsonLd={[
        faqPageJsonLd(collection.faqs),
        collectionPageJsonLd({ name: collection.title, description: collection.description, path, locale: 'en', products }),
        landingBreadcrumbJsonLd({ locale: 'en', homeName: 'Home', productsName: 'Art Prints', name: collection.heading, path }),
      ]}
    >
      <CollectionStyling
        locale="en"
        slug={collection.slug}
        heading={collection.stylingHeading}
        tips={collection.stylingTips}
        cards={collection.stylingCards}
        plannerLabel={collection.slug === 'living-room' ? 'Plan a gallery wall with these prints' : undefined}
        relatedArticle={
          collection.relatedArticleSlug && collection.relatedArticleLabel
            ? { slug: collection.relatedArticleSlug, label: `Read more: ${collection.relatedArticleLabel}` }
            : undefined
        }
      />
    </ShopLanding>
  );
}
