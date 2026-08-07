import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TrackedLink } from '@/components/TrackedLink';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getAllProducts, getProductBySlug, getRecommendedProducts } from '@/lib/products';
import { getArtistById } from '@/data/artists';
import { ProductActions } from '@/components/ProductActions';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';
import { ArtistSection } from '@/components/ArtistSection';
import { PrintCard } from '@/components/PrintCard';
import { getLowestProductPrices } from '@/lib/pricing';
import { BASE_URL, SITE_NAME, OG_LOCALE, TWITTER_SITE } from '@/lib/site';
import { shippingRates } from '@/config/shipping';

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

  const desc = product.description || `${product.name} by ${product.artist || product.brand} - Scandinavian Art Gallery`;
  // The catalogue descriptions are written so their first sentence stands
  // alone under ~155 chars as the search/social snippet; the full copy stays
  // on the page body and in the Product JSON-LD. Google truncates a full-length
  // meta description mid-word, so emit only that first sentence here.
  const snippet = desc.includes('. ') ? `${desc.split('. ')[0]}.` : desc;
  return {
    title: product.name,
    description: snippet,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    // Next merges metadata shallowly, so a page that sets its own openGraph/
    // twitter must restate the layout's site-wide fields or they drop (see
    // lib/site.ts). og:type is intentionally omitted here: it is emitted as a
    // product og:type via a direct <meta> in the page body below.
    openGraph: {
      title: product.name,
      description: snippet,
      url: `${BASE_URL}/product/${product.slug}`,
      siteName: SITE_NAME,
      locale: OG_LOCALE,
      images: [product.image],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title: product.name,
      description: snippet,
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

  const images = [product.image];
  if (product.secondaryImage && product.secondaryImage.trim() !== '' && product.secondaryImage !== product.image) {
    images.push(product.secondaryImage);
  }

  // Merchant-listing structured-data fields, built entirely from repo data:
  // shipping from config/shipping.ts, returns from the 14-day made-to-order
  // policy in data/help.ts. A few representative destinations (Google reads
  // shippingDetails that way), priced in GBP to match the Offer's priceCurrency.
  // These are an eligibility signal for richer product results, not a ranking lever.
  const shippingDetails = shippingRates
    .filter(r => ['GB', 'NO', 'US'].includes(r.countryCode))
    .map(r => {
      const days = (r.estimatedDays || '').match(/(\d+)\s*-\s*(\d+)/);
      const detail: Record<string, unknown> = {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: r.costs.GBP, currency: 'GBP' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: r.countryCode },
      };
      if (days) {
        detail.deliveryTime = {
          '@type': 'ShippingDeliveryTime',
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: Number(days[1]),
            maxValue: Number(days[2]),
            unitCode: 'DAY',
          },
        };
      }
      return detail;
    });

  // 14-day right to cancel; made to order, so nothing is sent back and the
  // refund is issued on request (data/help.ts, "Returns & refunds").
  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: ['GB', 'NO', 'US', 'DK', 'SE'],
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnFees: 'https://schema.org/FreeReturn',
  };

  return (
    <div className="container mx-auto px-8 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><TrackedLink event="breadcrumb-click" eventData={{ level: 'home' }} href="/">Home</TrackedLink></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><TrackedLink event="breadcrumb-click" eventData={{ level: 'products' }} href="/products">Art Prints</TrackedLink></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductImageGalleryWrapper images={images} productName={product.name} />

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{product.artist || product.brand}</span>
            <span>&bull;</span>
            <span>{product.category}</span>
          </div>

          <h1 className="text-3xl text-neutral-900">{product.name}</h1>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <ProductActions product={product} />

          {artist && <ArtistSection artist={artist} />}
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl text-neutral-900 mb-8">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommended.map(rec => (
              <TrackedLink key={rec.id} event="related-product-click" eventData={{ from: product.slug, to: rec.slug }} href={`/product/${rec.slug}`}>
                <PrintCard product={rec} sizes="(max-width: 768px) 50vw, 25vw" />
              </TrackedLink>
            ))}
          </div>
        </div>
      )}

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
            description: product.description,
            // schema.org requires absolute image URLs; catalogue paths are site-relative
            image: new URL(product.image, BASE_URL).toString(),
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
              // prices hold season-long; the horizon renews with each build
              priceValidUntil: `${new Date().getFullYear()}-12-31`,
              itemCondition: 'https://schema.org/NewCondition',
              shippingDetails,
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
    </div>
  );
}
