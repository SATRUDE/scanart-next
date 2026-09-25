import type { Metadata } from 'next';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';
import { noV2 } from '@/lib/i18n/no-v2-pages';
import { ABOUT_HERO_SLUG, aboutHeroImage } from '@/lib/about-hero';
import { getAllProducts } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { AboutBody } from '@/components/v2/about/AboutBody';
import { ABOUT_WINDOW_POOLS, aboutPlaces, rosterCards } from '@/components/v2/about/about-data';

// The Norwegian About page: app/(en)/about/page.tsx mirrored exactly (same
// AboutBody), with the copy swapped for lib/i18n/no.ts and every link kept
// inside /no.
const t = no.about;
const v = noV2.about;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/about',
    languages: hreflangPair('/about'),
  },
  ...socialCard({ title: t.meta.title, description: t.meta.description, path: '/no/about', ogLocale: 'nb_NO' }),
};

export default async function NorwegianAboutPage() {
  const [products, artists] = await Promise.all([getAllProducts(), getPublishedArtists()]);
  // Same catalogue print as the English page, described in bokmål by the same
  // shared vocabulary (see lib/about-hero and lib/product-image-alt).
  const hero = aboutHeroImage(products, 'no');
  const heroPrint = products.find(p => p.slug === ABOUT_HERO_SLUG);

  return (
    <>
      <AboutBody
        copy={{
          locale: 'no',
          // Reads exactly as t.heroTitle, "Skandinavisk kunst til hjem over
          // hele verden": the print after the art, the home after "til hjem",
          // nature before the world.
          headline: ['Skandinavisk kunst', { window: 'prints' }, { br: true }, 'til hjem', { window: 'homes' }, 'over ', { br: true }, { window: 'nature' }, 'hele verden'],
          pools: ABOUT_WINDOW_POOLS,
          about: {
            heading: t.aboutHeading,
            paragraphs: [t.aboutPara1, t.aboutPara2, t.aboutPara3],
            figure: {
              src: hero.src,
              alt: hero.alt,
              caption: heroPrint ? `${heroPrint.name} ${v.by} ${heroPrint.artist}` : '',
            },
            cta: { label: t.heroCta, href: '/no/products' },
            link: { label: v.viewAllPrints, href: '/no/products' },
          },
          howItWorks: v.howItWorks,
          where: { heading: v.whereHeading, places: aboutPlaces(artists, v.cities) },
          // The customer quote the Norwegian homepage carries (no.testimonials).
          statement: {
            quote: no.testimonials.quote,
            attribution: `${no.testimonials.name}, ${no.testimonials.location}`,
          },
          artists: {
            heading: t.artistsHeading,
            paragraphs: [t.artistsPara1, t.artistsPara2],
            link: { label: t.readTheJournal, href: '/no/journal' },
          },
          roster: {
            heading: v.artistsHeading,
            all: { label: v.allArtists, href: '/no/artists' },
            cards: rosterCards(artists, {
              statements: no.artistStatements,
              bios: no.artists,
              cityLabels: v.cities,
              printCount: n => (n === 1 ? v.printOne : v.printOther.replace('{n}', String(n))),
            }),
            hrefPrefix: '/no',
          },
          cta: {
            heading: v.cta.heading,
            body: v.cta.body,
            label: v.cta.button,
            href: '/no/artists/apply',
          },
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: t.jsonLdName,
            url: `${BASE_URL}/no/about`,
            inLanguage: 'no',
            mainEntity: {
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
