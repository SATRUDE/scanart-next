import type { Metadata } from 'next';
import { BASE_URL, socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { ABOUT_HERO_SLUG, aboutHeroImage } from '@/lib/about-hero';
import { getAllProducts } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { AboutBody } from '@/components/v2/about/AboutBody';
import { ABOUT_WINDOW_POOLS, aboutPlaces, rosterCards } from '@/components/v2/about/about-data';

const PAGE_TITLE = 'About';
const PAGE_DESCRIPTION =
  'The story of Scandinavian Art: an online gallery working directly with Scandinavian artists to bring authentic Nordic prints into homes around the world.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/about',
    languages: hreflangPair('/about'),
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/about' }),
};

export default async function AboutPage() {
  const [products, artists] = await Promise.all([getAllProducts(), getPublishedArtists()]);
  // The catalogue picture, and its description, both come from the catalogue
  // rather than being written out here (see lib/about-hero).
  const hero = aboutHeroImage(products);
  const heroPrint = products.find(p => p.slug === ABOUT_HERO_SLUG);

  return (
    <>
      <AboutBody
        copy={{
          locale: 'en',
          // The H1 reads exactly "Bringing Scandinavian art into homes around
          // the world"; the windows between the words are decoration.
          headline: [
            'Bringing',
            { window: 'prints' },
            'Scandinavian art ',
            { br: true },
            'into homes',
            { window: 'homes' },
            'around ',
            { br: true },
            { window: 'nature' },
            'the world',
          ],
          pools: ABOUT_WINDOW_POOLS,
          about: {
            heading: 'About Scandinavian Art',
            paragraphs: [
              'Scandinavian Art exists to bring the distinct Scandinavian aesthetic into homes around the world, while giving the artists behind it the chance to reach a wider audience.',
              'The idea came from a conversation with a friend, an artist living in Oslo. We realised how little Scandinavian artwork reached the rest of the world, and set out to create a place where these talented artists could showcase their work to a broader audience.',
              'At its core, Scandinavian design celebrates natural materials, clean lines and the concept of lagom, having just the right amount. The prints we curate carry that spirit: serene, purposeful and timeless.',
            ],
            figure: {
              src: hero.src,
              alt: hero.alt,
              caption: heroPrint ? `${heroPrint.name} by ${heroPrint.artist}` : '',
            },
            cta: { label: 'Explore the collection', href: '/products' },
            link: { label: 'View all prints', href: '/products' },
          },
          howItWorks: {
            heading: 'How the shop works',
            // Only what the site can stand behind: artists are chosen (the
            // apply page is a request to be considered, not a sign-up); prints
            // are made to order (data/help.ts, /delivery); and the frame
            // choices (config/frame.ts). The artist's share is deliberately not
            // on the public site (Mark, 2026-09-26): it is between us and the
            // artists, and lives in the Artist Agreement and how-it-works.
            rows: [
              { title: 'Chosen, not listed', body: 'Every artist is selected by us. Nobody signs up and uploads; we choose the work first.' },
              { title: 'Printed to order', body: 'Each print is made when you order it, so nothing sits in a warehouse waiting.' },
              { title: 'Framed or unframed', body: 'Choose a wood, black or white frame, or order the print on its own.' },
            ],
          },
          where: { heading: 'Where the artists work', places: aboutPlaces(artists) },
          // The customer quote the homepage carries (components/Testimonials.tsx),
          // not the design's placeholder: no invented reviews.
          statement: {
            quote:
              'I bought a print for my home, and I will definitely buy more in the future. Thank you for making my apartment more beautiful with your art!',
            attribution: 'David Steel, London, England',
          },
          artists: {
            heading: 'Working with artists',
            paragraphs: [
              'We work directly with local artists, leveraging their expertise to select the most authentic pieces, so the collection stays fresh, diverse and of the highest quality. Every print is printed on 200gsm uncoated paper, with professional framing available.',
              'Every purchase directly supports the artist behind it, helping them gain the recognition they deserve and continue creating. By choosing Scandinavian Art, you put a piece of Scandinavia in your home and support the people who make it.',
            ],
            link: { label: 'Read the journal', href: '/journal' },
          },
          roster: {
            heading: 'The artists',
            all: { label: 'All artists', href: '/artists' },
            cards: rosterCards(artists, { printCount: n => (n === 1 ? '1 print' : `${n} prints`) }),
            hrefPrefix: '',
          },
          cta: {
            heading: 'Are you an artist?',
            body: 'We are a small gallery and take on very few, but a person reads everything that comes in. Tell us about your work.',
            label: 'Ask to be considered',
            href: '/artists/apply',
          },
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About Scandinavian Art',
            url: `${BASE_URL}/about`,
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
