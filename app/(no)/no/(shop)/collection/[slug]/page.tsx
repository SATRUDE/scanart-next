import type { Metadata } from 'next';
import { metaTitle } from '@/lib/meta-title';
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
import { no } from '@/lib/i18n/no';

// The Norwegian collection landing pages (phase 2, 2026-08-21):
// app/(en)/(shop)/collection/[slug]/page.tsx mirrored exactly (same params, same
// template), with the copy swapped for lib/i18n/no.ts.
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
  const products = collectionProducts(collection, all);

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
  const artists = await getPublishedArtists();
  const path = `/no/collection/${slug}`;
  const articleLabel = copy.relatedArticleLabel ?? collection.relatedArticleLabel;

  // The header and the Filter bar come from the shop layout
  // (app/(no)/no/(shop)/layout.tsx), in Norwegian, with the same fallback.
  return (
    <ShopLanding
      locale="no"
      products={products}
      faqHeading={no.shared.commonQuestions}
      faqs={copy.faqs}
      crossLinks={{ current: { type: 'collection', slug }, strings: no.crossLinks }}
      artists={artists}
      jsonLd={[
        faqPageJsonLd(copy.faqs, 'no'),
        // ItemList and breadcrumb now stay inside /no (docs/v2-seo.md, "Fixed
        // along the way"): they pointed at /product and /products until V2.
        collectionPageJsonLd({ name: copy.title, description: copy.description, path, locale: 'no', inLanguage: 'no', products }),
        landingBreadcrumbJsonLd({ locale: 'no', homeName: no.shared.home, productsName: no.crossLinks.allPrints, name: copy.heading, path }),
      ]}
    >
      <CollectionStyling
        locale="no"
        slug={collection.slug}
        heading={copy.stylingHeading}
        tips={copy.stylingTips}
        cards={stylingCards}
        // The arrow is the link's own now (TextLink), so the copy's trailing one goes.
        plannerLabel={collection.slug === 'living-room' ? no.shared.galleryWallPlanner.replace(/\s*→$/, '') : undefined}
        relatedArticle={
          collection.relatedArticleSlug && articleLabel
            ? { slug: collection.relatedArticleSlug, label: `${no.shared.readMoreArticle}: ${articleLabel}` }
            : undefined
        }
      />
    </ShopLanding>
  );
}
