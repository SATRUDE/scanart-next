import type { Metadata } from 'next';
import { artists } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';
import { ArtistsList, ArtistWithCount } from '@/components/ArtistsList';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian artists hub: app/artists/page.tsx mirrored exactly, with bios
// and locations swapped for the Norwegian copy in lib/i18n/no.ts.
const t = no.artistsIndex;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/artists',
    languages: hreflangPair('/artists'),
  },
  ...socialCard({ title: t.meta.title, description: t.meta.description, path: '/no/artists', ogLocale: 'nb_NO' }),
};

export default async function NorwegianArtistsPage() {
  // Only artists with published prints get a detail page (see
  // app/no/artist/[slug]/generateStaticParams and app/sitemap.ts), so the hub
  // lists exactly those, ordered by how much work they have.
  const withCounts: ArtistWithCount[] = [];
  for (const artist of artists) {
    const products = await getProductsByArtist(artist.id);
    if (products.length > 0) {
      const copy = no.artists[artist.slug];
      withCounts.push({
        ...artist,
        ...(copy ? { bio: copy.bio, location: copy.location } : {}),
        printCount: products.length,
      });
    }
  }
  withCounts.sort((a, b) => b.printCount - a.printCount || a.name.localeCompare(b.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.heading,
    description: t.jsonLdDescription,
    url: `${BASE_URL}/no/artists`,
    inLanguage: 'no',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: withCounts.map((artist, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: artist.name,
        url: `${BASE_URL}/no/artist/${artist.slug}`,
      })),
    },
  };

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">{t.heading}</h1>
          <p className="text-muted-foreground">{withCounts.length} {t.countLabel}</p>
          <p className="text-neutral-600 mt-2">
            {t.intro}
          </p>
        </div>
        <ArtistsList artists={withCounts} locale="no" printLabels={{ one: no.shared.printOne, other: no.shared.printOther }} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
