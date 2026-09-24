import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { artists, getArtistInitials } from '@/data/artists';
import { artistEditorial } from '@/lib/artist-editorial';
import { no } from '@/lib/i18n/no';
import { productImages } from '@/lib/product-image-alt';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';
import { catalogueReviewEnabled, getCatalogueReview, type ReviewProduct } from '@/lib/server/catalogue-review';

// No build-time review snapshot can survive a later production environment.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Catalogue review',
  robots: { index: false, follow: false, noarchive: true },
};

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function CatalogueReviewPage({ params, searchParams }: Props) {
  if (!catalogueReviewEnabled()) notFound();
  const [{ path = [] }, query] = await Promise.all([params, searchParams]);
  const locale = query.lang === 'no' ? 'no' : 'en';
  const suffix = locale === 'no' ? '?lang=no' : '';
  const href = (route = '') => `/catalogue-preview${route}${suffix}`;
  const products = await getCatalogueReview();
  const isProduct = path.length === 2 && path[0] === 'product';
  const isArtist = path.length === 2 && path[0] === 'artist';
  if (path.length && !isProduct && !isArtist) notFound();
  const product = isProduct ? products.find(item => item.slug === path[1]) : undefined;
  const artist = isArtist
    ? artists.find(item => item.slug === path[1])
    : product ? artists.find(item => item.id === product.artistId) : undefined;
  const visibleProducts = artist ? products.filter(item => item.artistId === artist.id) : products;
  if ((isProduct && !product) || (isArtist && (!artist || !visibleProducts.length))) notFound();

  const artistCopy = artist && locale === 'no' ? no.artists[artist.slug] : undefined;
  const editorial = artist
    ? (locale === 'no' ? no.artistEditorial[artist.slug] : artistEditorial[artist.slug])
    : undefined;

  const displayName = (item: ReviewProduct) => locale === 'no' ? item.nameNo || item.name : item.name;
  const artworkAlt = (item: ReviewProduct) => locale === 'no' ? item.imageAltNo || item.imageAlt : item.imageAlt;
  const reviewImages = (item: ReviewProduct) => productImages({ ...item, name: displayName(item) }, locale)
    .map((image, index) => index === 0 && artworkAlt(item) ? { ...image, alt: artworkAlt(item)! } : image);

  function inlineLinks(text: string) {
    return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (!match) return part;
      const draftSlug = match[2].match(/^\/(?:no\/)?product\/([^/?#]+)$/)?.[1];
      const target = draftSlug && products.some(item => item.slug === draftSlug)
        ? href(`/product/${draftSlug}`)
        : match[2];
      return <Link key={index} href={target} className="underline">{match[1]}</Link>;
    });
  }

  return (
    <div className="container mx-auto px-8 py-8" lang={locale}>
      <aside className="mb-8 rounded border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-medium">Preview · Not published</p>
        <p className="mt-1">Review the artwork and copy. Full shop pages show proposed prices and frame options; purchasing stays disabled.</p>
        <nav aria-label="Review navigation" className="mt-3 flex flex-wrap gap-4 underline">
          {product && <Link href={`${locale === 'no' ? '/no' : ''}/product/${product.slug}`}>Full product page with prices</Link>}
          {artist && <Link href={`${locale === 'no' ? '/no' : ''}/artist/${artist.slug}`}>Full artist page</Link>}
          {!artist && <Link href={locale === 'no' ? '/no/products' : '/products'}>Full shop with prices</Link>}
          <Link href={href()}>All review prints</Link>
          {artist
            ? <Link href={href(`/artist/${artist.slug}`)}>Artist profile</Link>
            : artists.filter(item => products.some(print => print.artistId === item.id)).map(item => (
              <Link key={item.id} href={href(`/artist/${item.slug}`)}>{item.name}: profile</Link>
            ))}
          <Link href={`/catalogue-preview${path.length ? `/${path.join('/')}` : ''}${locale === 'en' ? '?lang=no' : ''}`}>
            {locale === 'en' ? 'Norsk' : 'English'}
          </Link>
        </nav>
      </aside>

      {product ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImageGalleryWrapper images={reviewImages(product)} productName={displayName(product)} />
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{product.artist} · {product.category}</p>
            <h1 className="text-3xl text-neutral-900">{displayName(product)}</h1>
            {product.reviewNotes && (
              <aside className="space-y-2 rounded border border-amber-200 bg-amber-50 p-4 text-sm">
                <h2 className="font-medium">Review notes</h2>
                {(Array.isArray(product.reviewNotes) ? product.reviewNotes : [product.reviewNotes]).map((note, index) => <p key={index}>{note}</p>)}
              </aside>
            )}
            <p className="text-muted-foreground leading-relaxed">
              {locale === 'no' ? no.productCopy[product.slug]?.description ?? product.description : product.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {product.availableSizes?.length
                ? `Proposed sizes: ${product.availableSizes.join(', ')}. Awaiting review.`
                : product.proposedSizes?.length
                  ? `Proposed sizes: ${product.proposedSizes.join(', ')}. Awaiting confirmation.`
                  : 'Sizes awaiting confirmation.'}
            </p>
            {artist && <Link href={href(`/artist/${artist.slug}`)} className="inline-block underline">{artist.name}</Link>}
          </div>
            {product.sourceImage && product.sourceImage !== product.image && (
              <section className="space-y-3">
                <h2 className="text-lg">Unframed artwork</h2>
                {/* Source dimensions vary. The native image keeps its natural
                    aspect ratio, without cropping or inventing a frame. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.sourceImage} alt={artworkAlt(product) || `${displayName(product)}, original unframed artwork`} className="h-auto w-full" />
                <a href={product.sourceImage} className="inline-block text-sm underline">Open artwork preview</a>
              </section>
            )}
        </div>
      ) : (
        <>
          {artist ? (
            <header className="mb-16 flex items-start gap-6">
              {artist.image ? (
                <Image src={artist.image} alt={artist.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted text-xl" aria-hidden="true">{getArtistInitials(artist.name)}</span>
              )}
              <div>
                <h1 className="text-3xl text-neutral-900">{artist.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{artistCopy?.location ?? artist.location}</p>
                <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">{artistCopy?.bio ?? artist.bio}</p>
                {artist.image && artist.imageCredit && <p className="mt-3 text-xs text-muted-foreground">Portrait: {artist.imageCredit}</p>}
              </div>
            </header>
          ) : <h1 className="mb-8 text-3xl">Prints awaiting review</h1>}
          {visibleProducts.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleProducts.map((item, index) => (
                <Link key={item.slug} href={href(`/product/${item.slug}`)} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50 mb-6">
                    <Image src={item.image} alt={reviewImages(item)[0].alt} fill priority={index < 4} sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform group-hover:scale-[1.02]" />
                  </div>
                  <p className="text-xs text-neutral-500">{item.artist} · {item.category}</p>
                  <h2 className="mt-2 text-sm text-neutral-900">{displayName(item)}</h2>
                  {item.reviewNotes && <p className="mt-2 text-xs text-muted-foreground">Review notes on product page</p>}
                </Link>
              ))}
            </div>
          ) : <p className="text-muted-foreground">There are no prints awaiting review.</p>}
          {editorial && (
            <section className="mt-16 max-w-3xl space-y-4">
              <h2 className="text-2xl">{editorial.heading}</h2>
              <p className="leading-relaxed text-muted-foreground">{inlineLinks(editorial.para1)}</p>
              <p className="leading-relaxed text-muted-foreground">{inlineLinks(editorial.para2)}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
