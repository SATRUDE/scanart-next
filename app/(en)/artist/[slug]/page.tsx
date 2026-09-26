import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { artists, getArtistBySlug } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { artistEditorial } from '@/lib/artist-editorial';
import { BASE_URL, OG_IMAGE, SITE_NAME, OG_LOCALE, TWITTER_SITE } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { artistMetaDescription, artistMetaTitle } from '@/lib/artist-meta';
import { ArtistProfile } from '@/components/v2/artists/ArtistProfile';
import { hasCity } from '@/components/v2/artists/ArtistMap';
import {
  cityOf,
  firstName,
  formatsLine,
  framingLine,
  heroSceneFor,
  lowestPrices,
  portraitFor,
  scenePhrase,
  sizeLabel,
} from '@/components/v2/artists/artist-data';

const prints = (n: number) => `${n} ${n === 1 ? 'print' : 'prints'}`;

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

  // Both fields lead on the offer rather than on the biography. We rank on page
  // one for these artists' own names and took no clicks from it in August,
  // because "Sia Siamos | Scandinavian Art Gallery" promises nothing that the
  // artist's own site and Instagram, both above us, do not already give. The
  // one thing we have is that the prints are for sale here. The full bio still
  // reaches the page body and the Person JSON-LD below.
  const title = artistMetaTitle(artist.name);
  const snippet = artistMetaDescription(artist.name, artist.bio);
  return {
    title,
    description: snippet,
    alternates: {
      canonical: `/artist/${artist.slug}`,
      languages: hreflangPair(`/artist/${artist.slug}`),
    },
    openGraph: {
      title,
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
      title,
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
  const published = await getPublishedArtists();

  // The other artists with published prints, in data order, for the
  // More-artists section (the /artists cards reused).
  const more = artists.flatMap(other => {
    const pub = published.find(a => a.id === other.id);
    if (!pub || pub.id === artist.id) return [];
    const { src, initials } = portraitFor(pub);
    return [{
      slug: pub.slug,
      name: pub.name,
      portrait: src,
      initials,
      about: pub.bio,
      city: cityOf(pub.location),
      prints: prints(pub.printCount),
    }];
  });

  const lowest = lowestPrices(products);
  const hero = heroSceneFor(artist.slug, products);
  const city = cityOf(artist.location);
  const words = { and: 'and', for: 'for' };
  const facts = [
    { label: 'Based in', value: artist.location },
    { label: 'Formats', value: formatsLine(products, words) },
    { label: 'In the shop', value: prints(products.length) },
    { label: 'Framing', value: framingLine('Unframed, or', 'or') },
  ].filter(f => f.value);
  const portrait = portraitFor(artist);

  return (
    <>
      <ArtistProfile
        locale="en"
        slug={artist.slug}
        name={artist.name}
        bio={artist.bio}
        location={artist.location}
        portrait={portrait.src}
        portraitCredit={artist.imageCredit}
        initials={portrait.initials}
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Artists', href: '/artists' },
          { label: artist.name },
        ]}
        products={products}
        printCount={prints(products.length)}
        lowest={lowest}
        hero={
          hero
            ? {
                src: hero.scene.image,
                // shopScenes alt: the scene as written for image search.
                alt: hero.scene.alt,
                href: `/product/${hero.product.slug}`,
                title: hero.product.name,
                note: scenePhrase(hero.scene.alt) ?? sizeLabel(Object.keys(hero.product.prices)[0] ?? ''),
              }
            : null
        }
        editorial={editorial}
        facts={facts}
        map={hasCity(city) ? { city, label: city, caption: `${city}, where ${firstName(artist.name)} works.` } : null}
        more={more}
        explore={published.filter(a => a.id !== artist.id).map(a => ({ slug: a.slug, name: a.name }))}
        t={{
          printsBy: 'Prints by',
          from: 'from',
          atAGlance: 'At a glance',
          moreArtists: 'More artists',
          allArtists: 'All artists',
          allArtistsHref: '/artists',
          productHref: slug => `/product/${slug}`,
        }}
      />

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
    </>
  );
}
