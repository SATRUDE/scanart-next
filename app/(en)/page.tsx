import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { getHomeData, homeStrings } from '@/lib/home';
import { helpGroups } from '@/data/help';
import { HomePage } from '@/components/v2/home/HomePage';

// Title and description come from siteMetadata (the default title and
// description), unchanged for V2 (docs/v2-seo.md item 2).
export const metadata: Metadata = {
  alternates: {
    canonical: '/',
    languages: hreflangPair('/'),
  },
};

export default async function Home() {
  // Hero, New prints, the wall's prints, artists and the journal teaser all
  // come from lib/home.ts, which the Norwegian homepage reads too.
  const data = await getHomeData('');

  return (
    <>
      <HomePage locale="en" strings={homeStrings} data={data} help={helpGroups} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Scandinavian Art Gallery',
            url: BASE_URL,
            description: 'Curated selection of exquisite Nordic artwork and prints from talented Scandinavian artists.',
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
