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
import { BASE_URL, SITE_NAME, OG_LOCALE, TWITTER_SITE } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { getPublishedArtists } from '@/lib/published-artists';
import { artistStatements } from '@/lib/artist-statements';
import { productPageEn } from '@/lib/product-page-copy';
import { getProductVideo } from '@/config/product-videos';
import { ProductView } from '@/components/v2/product/ProductView';
import { getDeliveryGuide } from '@/lib/server/delivery-guide';
import { artistFactsFor } from '@/components/v2/product/artist-facts';

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map(p => ({ slug: p.slug }));
}

// Ken's worked examples, one per artist (Studio row, 2026-08-13): a visual
// hook up to ~90 chars, then the fixed buying close. All verified under 155
// characters. The remaining products fall back to their art-led first
// sentence until their strings are written.
const BUYER_DESCRIPTIONS: Record<string, string> = {
  'swallow-dive':
    'Cobalt birds dive edge to edge over warm cream, all the movement carried by shape alone. Buy Swallow Dive framed in wood, black or white, or unframed.',
  'morgenstrekk':
    "The day's first full-body stretch, drawn in a handful of lines. Buy Morgenstrekk framed in wood, black or white, or unframed, printed to order.",
  'eltsjoen':
    'A Nordic lake redrawn as dense coloured-pencil pattern, stroke by stroke. Buy Eltsjoen framed in wood, black or white, or unframed, printed to order.',
  'hummer-og-vin':
    'Lobster, lemons and red wine on a crowded summer table, painted mid-conversation. Buy Hummer og Vin framed in wood, black or white, or unframed.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const desc = product.description || `${product.name} by ${product.artist || product.brand} - Scandinavian Art Gallery`;
  // The catalogue descriptions are written so their first sentence stands
  // alone under ~155 chars as the search/social snippet; the full copy stays
  // on the page body and in the Product JSON-LD. Google truncates a full-length
  // meta description mid-word, so emit only that first sentence here.
  const snippet = metaSnippet(desc);
  // The buying queries say "framed" and the old titles never did (Ken's
  // buyer-language pass, 2026-08-13). Absolute, dropping the layout's
  // "| Scandinavian Art Gallery" suffix: the longest name+artist combination
  // in the catalogue lands at 58 characters, inside Google's ~60-char cut,
  // and the suffix would push every one of them over. "Scandinavian" is
  // carried by the description so both query families are served.
  const buyerTitle = `${product.name} by ${product.artist || product.brand} | Framed Nordic Art Print`;
  // Five hand-written buyer descriptions, one per artist as worked examples;
  // the rest keep their art-led first sentence until the remaining fifteen
  // are written (offered on Ken's row).
  const buyerDescription = BUYER_DESCRIPTIONS[product.slug] ?? snippet;
  return {
    title: { absolute: buyerTitle },
    description: buyerDescription,
    alternates: {
      canonical: `/product/${product.slug}`,
      languages: hreflangPair(`/product/${product.slug}`),
    },
    // Next merges metadata shallowly, so a page that sets its own openGraph/
    // twitter must restate the layout's site-wide fields or they drop (see
    // lib/site.ts). og:type is intentionally omitted here: it is emitted as a
    // product og:type via a direct <meta> in the page body below.
    openGraph: {
      title: buyerTitle,
      description: buyerDescription,
      url: `${BASE_URL}/product/${product.slug}`,
      siteName: SITE_NAME,
      locale: OG_LOCALE,
      images: [product.image],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title: buyerTitle,
      description: buyerDescription,
      images: [product.image],
    },
  };
}

export default async function ProductPage({
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

  // Gallery images, each with alt text describing the work rather than its
  // place in the gallery; these are the images the image sitemap submits.
  const images = productImages(product);
  const listingDetails = productListingDetails(product, 'en');

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

  // Delivery "from" prices, from the store checkout charges from.
  const deliveryGuide = await getDeliveryGuide();

  return (
    <>
      <ProductView
        deliveryGuide={deliveryGuide}
        locale="en"
        product={product}
        images={images}
        video={getProductVideo(product.slug)}
        description={product.description}
        listingSummary={listingDetails?.summary}
        categoryLabel={product.category}
        categoryLink={landing ? { href: `/category/${landing.slug}`, label: landing.heading } : undefined}
        artist={artist ?? null}
        artistStatement={artist ? artistStatements[artist.slug] : undefined}
        artistFacts={artistFactsFor(artistProducts)}
        recommended={recommended}
        exploreArtists={exploreArtists}
        strings={productPageEn}
      />

      {/* Product Open Graph tags for rich pins and link unfurls. Next's typed
          Metadata API has no product og:type and its `other` field emits
          name= rather than the property= that Open Graph needs, so these are
          rendered directly and React hoists them into <head>. Values mirror
          the Offer JSON-LD below (lowest price in GBP, the catalogue currency). */}
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
            description: product.description,
            // The print as an ImageObject carrying its licence metadata, plus
            // the scene shot as a plain URL. Absolute either way: schema.org
            // requires it and catalogue paths are site-relative.
            image: productImageLd(product, `/product/${product.slug}`),
            // brand is empty across the exported catalogue; the artist is the
            // meaningful maker for an art print, expressed as brand + creator
            brand: { '@type': 'Brand', name: product.artist || product.brand },
            creator: { '@type': 'Person', name: product.artist || product.brand },
            offers: {
              '@type': 'Offer',
              url: `${BASE_URL}/product/${product.slug}`,
              availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              priceCurrency: 'GBP',
              price: getLowestProductPrices(product).GBP,
              // A rolling one-year horizon from the build, not the end of the
              // build's calendar year. Product pages are statically generated,
              // so whatever is written here is frozen into the HTML until the
              // next deploy: a calendar-year expression built in December left
              // every offer claiming a date days away, and a quiet new year
              // with no deploy in it would have put all twenty into the past.
              // Google reads a lapsed priceValidUntil as a stale offer, which
              // is a merchant-listing eligibility risk on exactly the pages we
              // are trying to get into Shopping free listings. A year ahead
              // can never lapse between deploys, and the site rebuilds several
              // times a week, so in practice it stays a year out.
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
              { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
              { '@type': 'ListItem', position: 2, name: 'Art Prints', item: `${BASE_URL}/products` },
              { '@type': 'ListItem', position: 3, name: product.name, item: `${BASE_URL}/product/${product.slug}` },
            ],
          }),
        }}
      />
    </>
  );
}
