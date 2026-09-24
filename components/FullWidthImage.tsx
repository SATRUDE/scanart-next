import { shopScenes } from '@/lib/shop-scenes';
import React from 'react';
import { chromeAria } from '@/lib/i18n';
import Image from 'next/image';
import { TrackedLink } from '@/components/TrackedLink';

// The homepage strip is an entrance into /inspire (Mark's direction,
// 17 Aug): three InspireScene shots side by side, equal tiles, no gaps,
// with one centred call to action over the middle tile. The single wide
// banner it replaces could not keep its print in frame at every crop.
//
// Keep each print visible in the 3:4 tiles. The curated room sources are shared
// with the product pages so the strip follows the latest image selection.
const SCENES = [
  {
    src: shopScenes['hummer-og-vin'].image,
    alt: shopScenes['hummer-og-vin'].alt,
    position: 'object-center',
  },
  {
    src: '/notion-data/heroes/inspire-scene-10-3f8ff93c.jpg',
    alt: 'Vinkveld print above a cobalt side table and an oxblood chair, lit by a cone pendant',
    position: 'object-center',
  },
  {
    src: shopScenes.dancer.image,
    alt: shopScenes.dancer.alt,
    position: 'object-center',
  },
];

interface FullWidthImageProps {
  /**
   * Keeps the strip's link inside the tree it is rendered in. It appears on
   * four pages, two of them Norwegian, and sent all four to the English
   * /inspire until 2026-08-25.
   */
  locale?: 'en' | 'no';
}

export const FullWidthImage: React.FC<FullWidthImageProps> = ({ locale = 'en' }) => {
  const inspireHref = locale === 'no' ? '/no/inspire' : '/inspire';
  const t = chromeAria[locale];
  return (
    <section className="w-full mb-0">
      <TrackedLink
        event="homepage-section-click"
        eventData={{ section: 'inspire-strip', target: inspireHref }}
        href={inspireHref}
        className="relative grid grid-cols-3 gap-0 group"
        aria-label={t.inspireStrip}
      >
        {SCENES.map(scene => (
          <div key={scene.src} className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={scene.src}
              alt={scene.alt}
              fill
              sizes="33vw"
              className={`object-cover ${scene.position} transition-all duration-300 group-hover:scale-[1.02]`}
            />
          </div>
        ))}
        {/* Keep the call to action centred over the unchanged middle scene. */}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rounded-md bg-white text-neutral-900 text-sm tracking-wide px-8 py-3 shadow-md transition-transform duration-300 group-hover:scale-[1.04]">
            Be Inspired
          </span>
        </span>
      </TrackedLink>
    </section>
  );
};
