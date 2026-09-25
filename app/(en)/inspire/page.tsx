import type { Metadata } from 'next';
import Link from 'next/link';
import { getInspireScenes } from '@/lib/inspire';
import { socialCard } from '@/lib/site';
import { metaTitle } from '@/lib/meta-title';
import { hreflangPair } from '@/lib/i18n';
import { inspireFilterStringsEn } from '@/lib/inspire-walls';
import { getPublishedArtists } from '@/lib/published-artists';
import { PageHeader } from '@/components/v2/ui';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { InspireWall } from '@/components/v2/inspire/InspireWall';
import { getInspireRooms, inspireGalleryJsonLd } from '@/components/v2/inspire/rooms';

export async function generateMetadata(): Promise<Metadata> {
  const scenes = await getInspireScenes();
  // Was 186 characters, so the last third never reached a result. Trimmed to
  // fit the slot with the words buyers search kept at the front: the room
  // names, "framed" and "Nordic prints".
  const description =
    'Scandinavian art print inspiration: framed Nordic prints styled in bedrooms, kitchens, dining rooms and home offices. Click through to shop the scenes.';
  return {
    // 54 characters of its own, and it already carries its own pipe, so the
    // layout's brand suffix both overflowed it and read as a second divider.
    title: metaTitle('Scandinavian Art Print Inspiration | Styled Room Ideas'),
    description,
    // ?wall= and ?room= are filters over this same page, so they all
    // canonicalise here (the canonical is the bare path whatever the query).
    alternates: {
      canonical: '/inspire',
      languages: hreflangPair('/inspire'),
    },
    ...socialCard({
      title: 'Scandinavian Art Print Inspiration',
      description,
      path: '/inspire',
      image: scenes[0]?.image,
    }),
  };
}

export default async function InspirePage() {
  const [rooms, artists] = await Promise.all([getInspireRooms('en'), getPublishedArtists()]);

  const jsonLd = inspireGalleryJsonLd({
    rooms,
    name: 'Scandinavian Art Print Inspiration',
    galleryName: 'Scandinavian art prints styled in real rooms',
    path: '/inspire',
    productPrefix: '',
  });

  return (
    <div className="page-x pb-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        title="Inspire"
        lead="Framed Nordic prints styled in real rooms. Start from your wall colour or a room, then shop the prints in the scene."
      />

      <h2 className="sr-only">Styled scenes</h2>
      <InspireWall rooms={rooms} strings={inspireFilterStringsEn} />

      <p className="type-body tab:mt-band tab:max-w-[624px] [&_a]:text-text-accent [&_a]:transition-colors [&_a:hover]:text-ink">
        Looking for a particular room instead? <Link href="/collection/living-room">Living room</Link>,{' '}
        <Link href="/collection/bedroom">bedroom</Link> and <Link href="/collection/home-office">home office</Link> each
        have their own curated wall, or browse <Link href="/products">the full collection</Link>.
      </p>

      <LandingCrossLinks className="mt-section" artists={artists} />
    </div>
  );
}
