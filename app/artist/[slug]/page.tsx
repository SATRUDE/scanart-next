import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { artists, getArtistBySlug, getArtistInitials } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';
import { PrintCard } from '@/components/PrintCard';
import { BASE_URL, OG_IMAGE } from '@/lib/site';

export async function generateStaticParams() {
  // only artists with published work get a page
  const withProducts = [];
  for (const artist of artists) {
    const products = await getProductsByArtist(artist.id);
    if (products.length > 0) withProducts.push({ slug: artist.slug });
  }
  return withProducts;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};

  const desc = artist.bio || `Art prints by ${artist.name} - Scandinavian Art Gallery`;
  return {
    title: artist.name,
    description: desc,
    alternates: {
      canonical: `/artist/${artist.slug}`,
    },
    openGraph: {
      title: artist.name,
      description: desc,
      images: [artist.image || OG_IMAGE],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: artist.name,
      description: desc,
      images: [artist.image || OG_IMAGE],
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);

  if (!artist) {
    notFound();
  }

  const products = await getProductsByArtist(artist.id);
  if (products.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-8 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/artists">Artists</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{artist.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-16">
        <div className="flex items-start gap-6">
          {artist.image ? (
            <div className="h-20 w-20 rounded-full overflow-hidden flex-shrink-0">
              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div aria-hidden="true" className="h-20 w-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-medium text-muted-foreground">{getArtistInitials(artist.name)}</span>
            </div>
          )}
          <div>
            <h1 className="text-3xl text-neutral-900">{artist.name}</h1>
            {artist.location && <p className="text-sm text-muted-foreground mt-1">{artist.location}</p>}
            {artist.bio && (
              <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{artist.bio}</p>
            )}
          </div>
        </div>
      </header>

      <div className="mb-8">
        <h2 className="text-2xl text-neutral-900 mb-2">Prints by {artist.name}</h2>
        <p className="text-muted-foreground">{products.length} {products.length === 1 ? 'print' : 'prints'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <PrintCard product={product} />
          </Link>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: artist.name,
            description: artist.bio,
            // schema.org requires absolute image URLs; artist paths are site-relative
            ...(artist.image ? { image: new URL(artist.image, BASE_URL).toString() } : {}),
            url: `${BASE_URL}/artist/${artist.slug}`,
            jobTitle: 'Artist',
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
              { '@type': 'ListItem', position: 2, name: 'Artists', item: `${BASE_URL}/artists` },
              { '@type': 'ListItem', position: 3, name: artist.name, item: `${BASE_URL}/artist/${artist.slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
