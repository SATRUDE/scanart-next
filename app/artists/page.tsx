import type { Metadata } from 'next';
import { artists } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';
import { ArtistsList, ArtistWithCount } from '@/components/ArtistsList';
import { BASE_URL, socialCard } from '@/lib/site';

const PAGE_TITLE = 'Artists';
const PAGE_DESCRIPTION = 'Meet the Scandinavian artists behind the collection, a small group of illustrators and printmakers working across Norway and Sweden.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/artists',
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/artists' }),
};

export default async function ArtistsPage() {
  // Only artists with published prints get a detail page (see
  // app/artist/[slug]/generateStaticParams and app/sitemap.ts), so the hub
  // lists exactly those, ordered by how much work they have.
  const withCounts: ArtistWithCount[] = [];
  for (const artist of artists) {
    const products = await getProductsByArtist(artist.id);
    if (products.length > 0) withCounts.push({ ...artist, printCount: products.length });
  }
  withCounts.sort((a, b) => b.printCount - a.printCount || a.name.localeCompare(b.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Artists',
    description: 'The Scandinavian and Nordic artists behind the collection.',
    url: `${BASE_URL}/artists`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: withCounts.map((artist, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: artist.name,
        url: `${BASE_URL}/artist/${artist.slug}`,
      })),
    },
  };

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">Artists</h1>
          <p className="text-muted-foreground">{withCounts.length} artists</p>
          <p className="text-neutral-600 mt-2">
            Meet the Scandinavian artists behind the collection, a small group of illustrators and printmakers working across Norway and Sweden.
          </p>
        </div>
        <ArtistsList artists={withCounts} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
