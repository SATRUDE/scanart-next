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
import { priceValidUntil } from '@/lib/price-validity';
import { metaSnippet } from '@/lib/meta-snippet';
import { productImages } from '@/lib/product-image-alt';
import { productImageLd } from '@/lib/licensable-image';
import { FeedbackIntercept } from '@/components/FeedbackIntercept';
import { BASE_URL, SITE_NAME, TWITTER_SITE } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian product page: app/product/[slug]/page.tsx mirrored exactly,
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

  return (
    <div className="container mx-auto px-8 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><TrackedLink event="breadcrumb-click" eventData={{ level: 'home' }} href="/no">{no.shared.home}</TrackedLink></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><TrackedLink event="breadcrumb-click" eventData={{ level: 'products' }} href="/no/products">{t.breadcrumbPrints}</TrackedLink></BreadcrumbLink>
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
            <span>{categoryLabel}</span>
          </div>

          <h1 className="text-3xl text-neutral-900">{product.name}</h1>

          {description && (
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          )}

          <ProductActions product={product} strings={t.actions} />
          <FeedbackIntercept placement="product" />

          {artist && (
            <ArtistSection artist={artist} locale="no" copy={no.artists[artist.slug]} />
          )}
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl text-neutral-900 mb-8">{t.youMayAlsoLike}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommended.map(rec => (
              <TrackedLink key={rec.id} event="related-product-click" eventData={{ from: product.slug, to: rec.slug }} href={`/no/product/${rec.slug}`}>
                <PrintCard product={rec} sizes="(max-width: 768px) 50vw, 25vw" outOfStockLabel={no.shared.outOfStock} locale="no" />
              </TrackedLink>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
