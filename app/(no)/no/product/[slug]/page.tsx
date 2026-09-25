import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProducts, getProductBySlug, getRecommendedProducts, getProductsByArtist } from '@/lib/products';
import { getArtistById } from '@/data/artists';
import { getLowestProductPrices } from '@/lib/pricing';
import { priceValidUntil } from '@/lib/price-validity';
import { metaSnippet } from '@/lib/meta-snippet';
import { productListingDetails } from '@/lib/product-listing-details';
import { productImages } from '@/lib/product-image-alt';
import { productImageLd } from '@/lib/licensable-image';
import { BASE_URL, SITE_NAME, TWITTER_SITE } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { getPublishedArtists } from '@/lib/published-artists';
import { getProductVideo } from '@/config/product-videos';
import { ProductView } from '@/components/v2/product/ProductView';
import { artistFactsFor } from '@/components/v2/product/artist-facts';

// The Norwegian product page: app/(en)/product/[slug]/page.tsx mirrored exactly,
// with the catalogue copy taken from lib/i18n/no.ts and every link, canonical
// and JSON-LD URL kept inside the /no tree. Prices, sizes, frames and the
// cart are shared with the English page: nothing about the purchase changes,
// only the language it is described in.
const t = no.productPage;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const copy = no.productCopy[slug];
  const artistName = product.artist || product.brand;
  const desc = copy?.description || `${product.name} ${t.by} ${artistName} - Scandinavian Art Gallery`;
  // Same rule as the English page: emit only the first sentence, because
  // Google truncates a full-length meta description mid-word.
  const snippet = metaSnippet(desc);
  const buyerTitle = `${product.name} ${t.by} ${artistName} | ${t.titleSuffix}`;
  const buyerDescription = copy?.buyerDescription ?? snippet;

  return {
    title: { absolute: buyerTitle },
    description: buyerDescription,
    alternates: {
      canonical: `/no/product/${slug}`,
      languages: hreflangPair(`/product/${slug}`),
    },
    openGraph: {
      title: buyerTitle,
      description: buyerDescription,
      url: `${BASE_URL}/no/product/${slug}`,
      siteName: SITE_NAME,
      locale: 'nb_NO',
      images: [{ url: new URL(product.image, BASE_URL).toString() }],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title: buyerTitle,
      description: buyerDescription,
      images: [new URL(product.image, BASE_URL).toString()],
    },
  };
}

export default async function NorwegianProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const artist = product.artistId ? getArtistById(product.artistId) : null;
  const recommended = product.recommendedProducts?.length
    ? await getRecommendedProducts(product.recommendedProducts)
    : [];

  const images = productImages(product, 'no');
  const listingDetails = productListingDetails(product, 'no');
  const description = no.productCopy[slug]?.description ?? product.description;
  const categoryLabel = no.shared.categoryLabels[product.category] ?? product.category;

  // 14-day right to cancel; made to order, so nothing is sent back and the
  // refund is issued on request (data/help.ts, "Returns & refunds").
  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: ['GB', 'NO', 'US', 'DK', 'SE'],
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnFees: 'https://schema.org/FreeReturn',
  };

  const landing = getCategoryLandingByCategory(product.category);
  const artistProducts = artist ? await getProductsByArtist(artist.id) : [];
  const exploreArtists = (await getPublishedArtists()).map(a => ({ slug: a.slug, name: a.name }));
  const artistCopy = artist ? no.artists[artist.slug] : undefined;

  return (
    <>
      <ProductView
        locale="no"
        product={product}
        images={images}
        video={getProductVideo(product.slug)}
        description={description}
        listingSummary={listingDetails?.summary}
        categoryLabel={categoryLabel}
        categoryLink={
          landing
            ? { href: `/no/category/${landing.slug}`, label: (no.crossLinks.categoryLabels as Record<string, string>)[landing.slug] ?? landing.heading }
            : undefined
        }
        artist={artist ? { ...artist, location: artistCopy?.location ?? artist.location, bio: artistCopy?.bio ?? artist.bio } : null}
        artistStatement={artist ? no.artistStatements[artist.slug] : undefined}
        artistFacts={artistFactsFor(artistProducts)}
        recommended={recommended}
        exploreArtists={exploreArtists}
        strings={t.page}
        galleryStrings={t.gallery}
        actionsStrings={t.actions}
        crossLinksStrings={no.crossLinks}
        outOfStockLabel={no.shared.outOfStock}
      />

      {/* Product Open Graph tags, rendered directly because Next's typed
          Metadata API has no product og:type and its `other` field emits
          name= rather than property=. Values mirror the Offer JSON-LD below
          (lowest price in GBP, the catalogue currency). */}
      <meta property="og:type" content="product" />
      <meta property="og:price:amount" content={String(getLowestProductPrices(product).GBP)} />
      <meta property="og:price:currency" content="GBP" />
      <meta property="product:price:amount" content={String(getLowestProductPrices(product).GBP)} />
      <meta property="product:price:currency" content="GBP" />
      <meta
        property="product:availability"
        content={product.inStock ? 'in stock' : 'out of stock'}
      />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            ...(listingDetails ? { size: listingDetails.size, color: listingDetails.colour, material: listingDetails.material } : {}),
            description,
            inLanguage: 'nb-NO',
            // Same licence metadata as the English twin, with the acquire link
            // kept inside the /no tree so a Norwegian image result lands on the
            // Norwegian page.
            image: productImageLd(product, `/no/product/${product.slug}`, 'no'),
            brand: { '@type': 'Brand', name: product.artist || product.brand },
            creator: { '@type': 'Person', name: product.artist || product.brand },
            offers: {
              '@type': 'Offer',
              url: `${BASE_URL}/no/product/${product.slug}`,
              availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              priceCurrency: 'GBP',
              price: getLowestProductPrices(product).GBP,
              priceValidUntil: priceValidUntil(),
              itemCondition: 'https://schema.org/NewCondition',
              hasMerchantReturnPolicy: returnPolicy,
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
              { '@type': 'ListItem', position: 3, name: product.name, item: `${BASE_URL}/no/product/${product.slug}` },
            ],
          }),
        }}
      />
    </>
  );
}
