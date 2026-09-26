import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { artists, getArtistBySlug } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { BASE_URL, OG_IMAGE, SITE_NAME, TWITTER_SITE } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { artistMetaDescription, artistMetaTitle } from '@/lib/artist-meta';
import { sceneImageAlt } from '@/lib/product-image-alt';
import { no } from '@/lib/i18n/no';
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
  sizeLabel,
} from '@/components/v2/artists/artist-data';

// The Norwegian artist pages: app/(en)/artist/[slug]/page.tsx mirrored exactly
// (same params, same V2 ArtistProfile), with bios, locations, the editorial
// and every label swapped for lib/i18n/no.ts. Any artist missing a translation
// falls back to the English data, so the EN/NO pair always exists together.

const t = no.artistPage;
const prints = (n: number) => `${n} ${n === 1 ? no.shared.printOne : no.shared.printOther}`;

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
  const published = await getPublishedArtists();

  // The other artists with published prints, in data order, for the
  // More-artists section; summaries and cities in Norwegian.
  const more = artists.flatMap(other => {
    const pub = published.find(a => a.id === other.id);
    if (!pub || pub.id === artist.id) return [];
    const otherCopy = no.artists[pub.slug];
    const { src, initials } = portraitFor(pub);
    return [{
      slug: pub.slug,
      name: pub.name,
      portrait: src,
      initials,
      about: otherCopy?.bio || pub.bio,
      city: cityOf(otherCopy?.location || pub.location),
      prints: prints(pub.printCount),
    }];
  });

  const lowest = lowestPrices(products);
  const hero = heroSceneFor(artist.slug, products);
  // The marker is looked up by the English city; the label is the Norwegian one.
  const mapCity = cityOf(artist.location);
  const cityLabel = cityOf(location);
  const facts = [
    { label: t.factBasedIn, value: location },
    { label: t.factFormats, value: formatsLine(products, { and: t.and, for: t.for }) },
    { label: t.factInShop, value: prints(products.length) },
    { label: t.factFraming, value: framingLine(t.framingPrefix, t.and, no.productPage.actions.frameLabels) },
  ].filter(f => f.value);
  const portrait = portraitFor(artist);

  return (
    <>
      <ArtistProfile
        locale="no"
        slug={artist.slug}
        name={artist.name}
        bio={bio}
        location={location}
        portrait={portrait.src}
        portraitCredit={artist.imageCredit}
        initials={portrait.initials}
        breadcrumb={[
          { label: t.breadcrumbHome, href: '/no' },
          { label: t.breadcrumbArtists, href: '/no/artists' },
          { label: artist.name },
        ]}
        products={products}
        printCount={prints(products.length)}
        lowest={lowest}
        hero={
          hero
            ? {
                src: hero.scene.image,
                // The scene alt in the page's language (lib/product-image-alt.ts).
                alt: sceneImageAlt({ name: hero.product.name, artist: artist.name, brand: hero.product.brand, category: hero.product.category }, 'no'),
                href: `/no/product/${hero.product.slug}`,
                title: hero.product.name,
                note: sizeLabel(Object.keys(hero.product.prices)[0] ?? ''),
              }
            : null
        }
        editorial={editorial}
        facts={facts}
        map={hasCity(mapCity) ? { city: mapCity, label: cityLabel, caption: `${cityLabel}, ${t.mapWhere} ${firstName(artist.name)} ${t.mapWorks}.` } : null}
        more={more}
        explore={published.filter(a => a.id !== artist.id).map(a => ({ slug: a.slug, name: a.name }))}
        t={{
          printsBy: t.printsBy,
          from: t.from,
          atAGlance: t.atAGlance,
          moreArtists: t.moreArtists,
          allArtists: t.allArtists,
          allArtistsHref: '/no/artists',
          productHref: slug => `/no/product/${slug}`,
          categoryLabels: no.shared.categoryLabels,
          outOfStock: no.shared.outOfStock,
          crossLinks: no.crossLinks,
        }}
      />

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
          shape the English artist pages emit. The item URLs are the /no
          product pages this list links to (they pointed at the English ones
          until V2; docs/v2-seo.md "Fixed along the way"). */}
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
                url: `${BASE_URL}/no/product/${p.slug}`,
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
    </>
  );
}
