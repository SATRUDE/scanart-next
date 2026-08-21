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
import { BASE_URL, SITE_NAME, OG_LOCALE, TWITTER_SITE } from '@/lib/site';

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
    </div>
  );
}
