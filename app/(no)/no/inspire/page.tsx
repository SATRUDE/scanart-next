import type { Metadata } from 'next';
import Link from 'next/link';
import { getInspireScenes } from '@/lib/inspire';
import { socialCard } from '@/lib/site';
import { metaTitle } from '@/lib/meta-title';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';
import { noV2 } from '@/lib/i18n/no-v2-pages';
import { getPublishedArtists } from '@/lib/published-artists';
import { PageHeader } from '@/components/v2/ui';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { InspireWall } from '@/components/v2/inspire/InspireWall';
import { getInspireRooms, inspireGalleryJsonLd } from '@/components/v2/inspire/rooms';

// The Norwegian Inspire wall: app/(en)/inspire/page.tsx mirrored exactly (same
// components, same JSON-LD shape), with the copy swapped for lib/i18n/no.ts
// and every link kept inside the /no tree.
const t = no.inspire;

export async function generateMetadata(): Promise<Metadata> {
  const scenes = await getInspireScenes();
  return {
    title: metaTitle(t.meta.title),
    description: t.meta.description,
    alternates: {
      canonical: '/no/inspire',
      languages: hreflangPair('/inspire'),
    },
    ...socialCard({
      title: t.meta.socialTitle,
      description: t.meta.description,
      path: '/no/inspire',
      image: scenes[0]?.image,
      ogLocale: 'nb_NO',
    }),
  };
}

export default async function NorwegianInspirePage() {
  const [rooms, artists] = await Promise.all([getInspireRooms('no'), getPublishedArtists()]);

  // Same gallery structured data as the English wall, pointed at the /no
  // product URLs so the Norwegian page references its own tree.
  const jsonLd = inspireGalleryJsonLd({
    rooms,
    name: t.jsonLdName,
    galleryName: t.galleryName,
    path: '/no/inspire',
    productPrefix: '/no',
    inLanguage: 'nb-NO',
  });

  return (
    <div className="page-x pb-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader title={t.heading} lead={noV2.inspire.lead} locale="no" />

      <h2 className="sr-only">{t.scenesSrHeading}</h2>
      <InspireWall rooms={rooms} strings={noV2.inspire.filter} locale="no" />

      <p className="type-body tab:mt-block tab:max-w-[624px] [&_a]:text-text-accent [&_a]:transition-colors [&_a:hover]:text-ink">
        {t.roomsIntro} <Link href="/no/collection/living-room">{t.livingRoom}</Link>,{' '}
        <Link href="/no/collection/bedroom">{t.bedroom}</Link> {t.and}{' '}
        <Link href="/no/collection/home-office">{t.homeOffice}</Link> {t.roomsOutro}{' '}
        <Link href="/no/products">{t.fullCollection}</Link>.
      </p>

      <LandingCrossLinks className="mt-section" artists={artists} strings={no.crossLinks} locale="no" />
    </div>
  );
}
