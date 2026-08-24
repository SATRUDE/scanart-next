import type React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
import { ArtistsList, type ArtistWithCount } from '@/components/ArtistsList';
import { artistEditorial } from '@/lib/artist-editorial';
import { BASE_URL, OG_IMAGE, SITE_NAME, OG_LOCALE, TWITTER_SITE } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { metaSnippet } from '@/lib/meta-snippet';

// Ken's editorial paragraphs carry inline links in Markdown form
// ([text](/path)); render them as real <Link>s, everything else as text.
function renderInlineLinks(text: string): React.ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <Link key={i} href={match[2]} className="underline hover:text-neutral-900">
          {match[1]}
        </Link>
      );
    }
    return part;
  });
}

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
  // The bio is body copy and runs to hundreds of characters, so it is trimmed
  // to its opening sentence for the snippet fields. The full bio still reaches
  // the page body and the Person JSON-LD below.
  const snippet = metaSnippet(desc);
  return {
    title: artist.name,
    description: snippet,
    alternates: {
      canonical: `/artist/${artist.slug}`,
      languages: hreflangPair(`/artist/${artist.slug}`),
    },
    openGraph: {
      title: artist.name,
      description: snippet,
      url: `${BASE_URL}/artist/${artist.slug}`,
      siteName: SITE_NAME,
      locale: OG_LOCALE,
      images: [artist.image || OG_IMAGE],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title: artist.name,
      description: snippet,
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

  const editorial = artistEditorial[artist.slug];

  // The other artists with published prints, in data order, for the
  // More-artists section (Stan's direction: the /artists row list reused).
  const otherArtists: ArtistWithCount[] = [];
  for (const other of artists) {
    if (other.id === artist.id) continue;
    const otherProducts = await getProductsByArtist(other.id);
    if (otherProducts.length > 0) otherArtists.push({ ...other, printCount: otherProducts.length });
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
              <Image src={artist.image} alt={artist.name} width={80} height={80} className="w-full h-full object-cover" />
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
        {products.map((product, index) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            {/* first desktop row is above the fold: preload it, lazy-load the rest */}
            <PrintCard product={product} priority={index < 4} />
          </Link>
        ))}
      </div>

      {/* About the work: the About page's editorial split reused (Stan's
          direction, SA Figma 219:162), copy by Ken wired verbatim from
          lib/artist-editorial.ts. */}
      {editorial && (
        <section className="mt-16 lg:mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-2xl text-neutral-900 mb-0">{editorial.heading}</h2>
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">{renderInlineLinks(editorial.para1)}</p>
              <p className="text-lg text-neutral-600 leading-relaxed">{renderInlineLinks(editorial.para2)}</p>
            </div>
          </div>
        </section>
      )}

      {/* More artists: the /artists row treatment reused so the roster reads
          identically site-wide; page-one landers flow into the rest of it. */}
      {otherArtists.length > 0 && (
        <section className="mt-16 lg:mt-24 border-t pt-12 lg:pt-16">
          <div className="flex items-center justify-between gap-6 mb-2">
            <h2 className="text-2xl text-neutral-900">More artists</h2>
            <Link href="/artists" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors whitespace-nowrap">
              View all artists →
            </Link>
          </div>
          <ArtistsList artists={otherArtists} />
        </section>
      )}

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
      {/*
        The prints on this page as a machine-readable list, matching the shape every
        other print-listing route emits (category, collection, /products,
        /scandinavian-wall-art, the /artists hub and /journal). Without it an artist
        page is the one listing template whose items Google has to infer from markup.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Prints by ${artist.name}`,
            description: `Art prints by ${artist.name}, ${artist.location}, at Scandinavian Art Gallery.`,
            url: `${BASE_URL}/artist/${artist.slug}`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: products.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${BASE_URL}/product/${p.slug}`,
                name: p.name,
              })),
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
              { '@type': 'ListItem', position: 2, name: 'Artists', item: `${BASE_URL}/artists` },
              { '@type': 'ListItem', position: 3, name: artist.name, item: `${BASE_URL}/artist/${artist.slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
