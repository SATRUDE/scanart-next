import type { Metadata } from 'next';
import { artists } from '@/data/artists';
import { getProductsByArtist } from '@/lib/products';
import { ArtistApplyBand } from '@/components/ArtistApplyBand';
import { PageHeader } from '@/components/v2/ui';
import { ArtistCardList } from '@/components/v2/artists/ArtistCard';
import { cityOf, portraitFor } from '@/components/v2/artists/artist-data';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian artists hub: app/(en)/artists/page.tsx mirrored exactly (V2), with bios
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
  const withCounts: ((typeof artists)[number] & { printCount: number })[] = [];
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

  const totalPrints = withCounts.reduce((sum, a) => sum + a.printCount, 0);
  const prints = (n: number) => `${n} ${n === 1 ? no.shared.printOne : no.shared.printOther}`;
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

  return (
    <div className="page-x pb-section">
      <PageHeader
        title={t.heading}
        lead={<p>{t.intro}</p>}
        meta={[`${withCounts.length} ${t.countLabel}`, prints(totalPrints)]}
        locale="no"
      />
      <div className="mt-10 tab:mt-32">
        <ArtistCardList artists={cards} hrefPrefix="/no" priorityCount={3} />
      </div>

      {/* The twin of the band on app/(en)/artists/page.tsx. /no/artists/apply
          has existed since the Norwegian tree landed, but nothing on the
          Norwegian side linked to it, so the roster was a dead end and the
          form was reachable only by typing the URL. */}
      <ArtistApplyBand
        className="mt-section"
        heading={t.apply.heading}
        body={<p>{t.apply.body}</p>}
        ctaLabel={t.apply.cta}
        href="/no/artists/apply"
        source="artists-index"
        locale="no"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
