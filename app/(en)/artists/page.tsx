import type { Metadata } from 'next';
import { artists } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';
import { ArtistApplyBand } from '@/components/ArtistApplyBand';
import { PageHeader } from '@/components/v2/ui';
import { ArtistCardList } from '@/components/v2/artists/ArtistCard';
import { cityOf, portraitFor } from '@/components/v2/artists/artist-data';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

const PAGE_TITLE = 'Artists';
const PAGE_DESCRIPTION = 'Meet the artists behind the collection, a small group of illustrators and printmakers working across Norway, Sweden and Finland.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/artists',
    languages: hreflangPair('/artists'),
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/artists' }),
};

export default async function ArtistsPage() {
  // Only artists with published prints get a detail page (see
  // app/artist/[slug]/generateStaticParams and app/sitemap.ts), so the hub
  // lists exactly those, ordered by how much work they have.
  const withCounts: ((typeof artists)[number] & { printCount: number })[] = [];
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

  const totalPrints = withCounts.reduce((sum, a) => sum + a.printCount, 0);
  const prints = (n: number) => `${n} ${n === 1 ? 'print' : 'prints'}`;
  const cards = withCounts.map(artist => {
    const { src, initials } = portraitFor(artist);
    return {
      slug: artist.slug,
      name: artist.name,
      portrait: src,
      initials,
      about: artist.bio,
      city: cityOf(artist.location),
      prints: prints(artist.printCount),
    };
  });

  // V2 (Figma Artists 143:241 desktop, 187:1915 mobile). The lead keeps the
  // page's own intro rather than the design's: the design says "seven
  // illustrators in Norway, Sweden and Finland" and "half the profit"; the
  // roster count comes from the data, and no artist share is stated on public
  // pages. The lead names the countries the published roster covers.
  return (
    <div className="page-x pb-section">
      <PageHeader
        title="Artists"
        lead={
          <p>
            Meet the artists behind the collection, a small group of illustrators and printmakers working across Norway, Sweden and Finland.
          </p>
        }
        meta={[`${withCounts.length} artists`, prints(totalPrints)]}
      />
      <div className="mt-10 tab:mt-32">
        {/* The first row's portraits are above the fold. */}
        <ArtistCardList artists={cards} hrefPrefix="" priorityCount={3} />
      </div>

      {/* The inbound door for artist acquisition (Viggo scouts the outbound
          half). Shared with /no/artists and /artists/how-it-works; the design
          and copy notes live on the component. */}
      <ArtistApplyBand
        className="mt-section"
        heading="Are you an artist?"
        body={
          <p>
            We are a small gallery and we take on very few, but a person reads everything
            that comes in. Tell us about your work.
          </p>
        }
        ctaLabel="Ask to be considered"
        href="/artists/apply"
        source="artists-index"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
