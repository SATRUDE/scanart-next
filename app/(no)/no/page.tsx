import type { Metadata } from 'next';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';
import { getHomeData } from '@/lib/home';
import { HomePage } from '@/components/v2/home/HomePage';

// The Norwegian homepage: the English one mirrored exactly (the same
// HomePage component and the same getHomeData(), so the hero, prints, artists
// and journal teaser cannot drift), with the copy from lib/i18n/no.ts. The
// journal teaser stays: articles are English in phase one, and their cards
// link to the English article pages.
export const metadata: Metadata = {
  title: { absolute: no.home.meta.title },
  description: no.home.meta.description,
  alternates: {
    canonical: '/no',
    languages: hreflangPair('/'),
  },
  ...socialCard({
    title: no.home.meta.title,
    description: no.home.meta.description,
    path: '/no',
    ogLocale: 'nb_NO',
  }),
};

export default async function NorwegianHomePage() {
  const data = await getHomeData('/no');
  const strings = {
    ...no.home.v2,
    journal: { ...no.home.v2.journal, categoryLabels: no.journal.page.categoryLabels as Record<string, string> },
  };
  const artistLocations = Object.fromEntries(
    Object.entries(no.artists).map(([slug, copy]) => [slug, copy.location])
  );

  return (
    <>
      <HomePage
        locale="no"
        strings={strings}
        data={data}
        help={no.help.groups}
        artistLocations={artistLocations}
        crossLinks={no.crossLinks}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Scandinavian Art Gallery',
            url: `${BASE_URL}/no`,
            inLanguage: 'no',
            description: no.home.jsonLdDescription,
            publisher: {
              '@type': 'Organization',
              name: 'Scandinavian Art Gallery',
              url: BASE_URL,
              logo: `${BASE_URL}/images/scandinavian-art-gallery-og.jpg`,
              // the gallery's live profiles, same URLs the Footer links
              sameAs: [
                'https://www.instagram.com/helloscandinavianart/',
                'https://www.facebook.com/people/Scandinavian-Art/61563171855842/',
              ],
            },
          }),
        }}
      />
    </>
  );
}
