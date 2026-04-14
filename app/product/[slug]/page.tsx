import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllProducts, getProductBySlug, getRecommendedProducts } from '@/lib/products';
import { getArtistById } from '@/data/artists';
import { ProductActions } from '@/components/ProductActions';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';
import { SmartImage } from '@/components/SmartImage';
import { getLowestProductPrices } from '@/lib/pricing';

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
  return {
    title: product.name,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      images: [product.image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: desc,
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

  return (
    <div className="container mx-auto px-8 py-8">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to products
      </Link>

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
        </div>
      </div>

      {artist && (
        <div className="mt-16 pt-8 border-t">
          <div className="flex items-start gap-4">
            {artist.image && (
              <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h3 className="font-medium">{artist.name}</h3>
              {artist.location && <p className="text-sm text-muted-foreground">{artist.location}</p>}
              {artist.bio && <p className="text-sm text-muted-foreground mt-2">{artist.bio}</p>}
            </div>
          </div>
        </div>
      )}

      {recommended.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl text-neutral-900 mb-8">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommended.map(rec => (
              <Link key={rec.id} href={`/product/${rec.slug}`} className="group">
                <div className="aspect-[3/4] overflow-hidden bg-neutral-50 mb-4 rounded">
                  <SmartImage src={rec.image} alt={rec.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                </div>
                <h3 className="text-sm text-neutral-900">{rec.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.image,
            brand: { '@type': 'Brand', name: product.brand },
            offers: {
              '@type': 'Offer',
              availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              priceCurrency: 'GBP',
              price: getLowestProductPrices(product).GBP,
            },
          }),
        }}
      />
    </div>
  );
}
