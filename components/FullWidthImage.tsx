import React from 'react';
import Image from 'next/image';
import { TrackedLink } from '@/components/TrackedLink';

// The homepage strip is an entrance into /inspire (Mark's direction,
// 17 Aug): three InspireScene shots side by side, equal tiles, no gaps,
// with one centred call to action over the middle tile. The single wide
// banner it replaces could not keep its print in frame at every crop.
//
// Tile crops are verified against the real images, not tags: each cell is
// 3:4 and the framed print stays whole at that ratio (inspire-06 needs the
// top-anchored position for it; the other two hold at centre). All three
// are real catalogue prints in honest scenes, and none repeats the category
// tiles further down the page.
const SCENES = [
  {
    src: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/inspire/inspire-03-1786005116015.jpg',
    alt: 'Hummer og Vin print above a green desk in a home office',
    position: 'object-center',
  },
  {
    src: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/inspire/inspire-06-1786005118346.jpg',
    alt: 'Birdie Pink print above a bed with yellow striped linen',
    position: 'object-top',
  },
  {
    src: 'https://m9gwpvkjxnjiqpwb.public.blob.vercel-storage.com/composed/_edit_2026-08-08-1786206620578_2x_upscaled_1786206677013-png-1786694955122.png',
    alt: 'Dancer print resting on a cane sideboard with books and a fig plant',
    position: 'object-center',
  },
];

export const FullWidthImage: React.FC = () => {
  return (
    <section className="w-full mb-0">
      <TrackedLink
        event="homepage-section-click"
        eventData={{ section: 'inspire-strip', target: 'inspire' }}
        href="/inspire"
        className="relative grid grid-cols-3 gap-0 group"
        aria-label="Be inspired: see our prints in real rooms"
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
        {/* Centred over the strip = centred on the middle tile, whose midpoint
            is calm wall and bedding, so the button never covers a print. */}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rounded-md bg-white text-neutral-900 text-sm tracking-wide px-8 py-3 shadow-md transition-transform duration-300 group-hover:scale-[1.04]">
            Be Inspired
          </span>
        </span>
      </TrackedLink>
    </section>
  );
};
