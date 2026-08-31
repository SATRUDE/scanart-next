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
import { BASE_URL, OG_IMAGE, SITE_NAME, TWITTER_SITE } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { artistMetaDescription, artistMetaTitle } from '@/lib/artist-meta';
import { no } from '@/lib/i18n/no';

// The Norwegian artist pages: app/artist/[slug]/page.tsx mirrored exactly
// (same params, same components, same classes), with bios, locations and the
// editorial copy swapped for lib/i18n/no.ts. Any artist missing a translation
// falls back to the English data, so the EN/NO pair always exists together.

// Ken's editorial paragraphs carry inline links in Markdown form
// ([text](/path)); render them as real <Link>s, everything else as text.
// Same helper as the English page.
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
  // only artists with published work get a page; same set as the English tree
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

  const copy = no.artists[artist.slug];
  // Same shape as the English twin: the offer leads, the biography distinguishes.
  // The Norwegian wording is the Norwegian homepage's own, not a translation of
  // the English. The full bio still reaches the page body and the Person JSON-LD
  // below.
  const title = artistMetaTitle(artist.name, 'no');
  const snippet = artistMetaDescription(artist.name, copy?.bio || artist.bio, 'no');
  return {
    title,
    description: snippet,
    alternates: {
      canonical: `/no/artist/${artist.slug}`,
      languages: hreflangPair(`/artist/${artist.slug}`),
    },
    openGraph: {
      title,
      description: snippet,
      url: `${BASE_URL}/no/artist/${artist.slug}`,
      siteName: SITE_NAME,
      locale: 'nb_NO',
      images: [artist.image || OG_IMAGE],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title,
      description: snippet,
      images: [artist.image || OG_IMAGE],
    },
  };
}

export default async function NorwegianArtistPage({
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

  const copy = no.artists[artist.slug];
  const bio = copy?.bio || artist.bio;
  const location = copy?.location || artist.location;
  const editorial = no.artistEditorial[artist.slug];

  // The other artists with published prints, in data order, for the
  // More-artists section; bios and locations in Norwegian.
  const otherArtists: ArtistWithCount[] = [];
  for (const other of artists) {
    if (other.id === artist.id) continue;
    const otherProducts = await getProductsByArtist(other.id);
    if (otherProducts.length > 0) {
      const otherCopy = no.artists[other.slug];
      otherArtists.push({
        ...other,
        ...(otherCopy ? { bio: otherCopy.bio, location: otherCopy.location } : {}),
        printCount: otherProducts.length,
      });
    }
  }

  return (
    <div className="container mx-auto px-8 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/no">{no.artistPage.breadcrumbHome}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/no/artists">{no.artistPage.breadcrumbArtists}</Link></BreadcrumbLink>
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
            {location && <p className="text-sm text-muted-foreground mt-1">{location}</p>}
            {bio && (
              <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{bio}</p>
            )}
          </div>
        </div>
      </header>

      <div className="mb-8">
        <h2 className="text-2xl text-neutral-900 mb-2">{no.artistPage.printsBy} {artist.name}</h2>
        <p className="text-muted-foreground">{products.length} {products.length === 1 ? no.shared.printOne : no.shared.printOther}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <Link key={product.id} href={`/no/product/${product.slug}`}>
            {/* first desktop row is above the fold: preload it, lazy-load the rest */}
            <PrintCard
              product={product}
              priority={index < 4}
              categoryLabel={no.shared.categoryLabels[product.category]}
              outOfStockLabel={no.shared.outOfStock}
              locale="no"
            />
          </Link>
        ))}
      </div>

      {/* About the work: the About page's editorial split reused, copy from
          the Norwegian dictionary (lib/i18n/no.ts). */}
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

      {/* More artists: the /no/artists row treatment reused so the roster
          reads identically site-wide. */}
      {otherArtists.length > 0 && (
        <section className="mt-16 lg:mt-24 border-t pt-12 lg:pt-16">
          <div className="flex items-center justify-between gap-6 mb-2">
            <h2 className="text-2xl text-neutral-900">{no.artistPage.moreArtists}</h2>
            <Link href="/no/artists" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors whitespace-nowrap">
              {no.artistPage.viewAllArtists} →
            </Link>
          </div>
          <ArtistsList artists={otherArtists} locale="no" printLabels={{ one: no.shared.printOne, other: no.shared.printOther }} />
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: artist.name,
            description: bio,
            // schema.org requires absolute image URLs; artist paths are site-relative
            ...(artist.image ? { image: new URL(artist.image, BASE_URL).toString() } : {}),
            url: `${BASE_URL}/no/artist/${artist.slug}`,
            jobTitle: no.artistPage.jobTitle,
          }),
        }}
      />
      {/* The prints on this page as a machine-readable list, matching the
          shape the English artist pages emit. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${no.artistPage.printsBy} ${artist.name}`,
            description: `${no.artistPage.metaDescriptionPrefix} ${artist.name}, ${location}, hos Scandinavian Art Gallery.`,
            url: `${BASE_URL}/no/artist/${artist.slug}`,
            inLanguage: 'no',
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
              { '@type': 'ListItem', position: 1, name: no.artistPage.breadcrumbHome, item: `${BASE_URL}/no` },
              { '@type': 'ListItem', position: 2, name: no.artistPage.breadcrumbArtists, item: `${BASE_URL}/no/artists` },
              { '@type': 'ListItem', position: 3, name: artist.name, item: `${BASE_URL}/no/artist/${artist.slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
