'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDisplayPrice, getLowestProductPrices, type CurrencyPrices } from '@/lib/pricing';

export interface FramePrint {
  slug: string;
  href: string;
  name: string;
  artist: string;
  prices: Record<string, CurrencyPrices>;
  /** The standard product image, for the tile. */
  image: string;
  imageAlt: string;
  /** The room with this print in the frame (a composite, public/images/v2/not-found). */
  composite: string;
}

/**
 * The 404's split (Figma 404 · desktop 221:3986, print in the frame 284:12670,
 * mobile 221:4072; brand file 404/README.md): the empty frame on the left and,
 * on the right, the message, then "Fill the frame" with three 50 × 70 prints.
 *
 * Hover or focus on a print puts it in the frame with a 250 ms crossfade and
 * dims the other two to 45%; leaving restores the empty frame. On touch the
 * first tap previews and the second opens the print. Reduced motion swaps
 * instantly (globals.css zeroes transition durations).
 *
 * The frame states are pre-rendered composites of each print's own artwork in
 * the empty frame's mount, so the page ships four still images and no canvas.
 */
export function FillTheFrame({
  emptyFrame,
  heading,
  prints,
  message,
  after,
}: {
  emptyFrame: { src: string; alt: string };
  heading: string;
  prints: FramePrint[];
  /** The H1 and the lead, above Fill the frame. */
  message: React.ReactNode;
  /** The search and the route links, below it. */
  after: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const pointer = useRef<string>('mouse');
  const { selectedCountry } = useLanguage();
  const currency = selectedCountry.currency;

  return (
    <div className="page-grid gap-y-6 tab:gap-y-0">
      <div className="col-span-full tab:col-span-4 desk:col-span-6">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-image-bg">
          {/* The empty frame is the page's LCP image at every width. */}
          <Image src={emptyFrame.src} alt={emptyFrame.alt} fill preload sizes="(max-width: 833px) 100vw, 50vw" className="object-cover" />
          {prints.map(p => (
            <Image
              key={p.slug}
              src={p.composite}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 833px) 100vw, 50vw"
              className={`object-cover transition-opacity duration-[250ms] ease-out ${active === p.slug ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
      </div>

      <div className="col-span-full flex flex-col tab:col-span-4 desk:col-span-6">
        {message}

        <section aria-labelledby="fill-the-frame" className="mt-10 tab:mt-band">
          <h2 id="fill-the-frame" className="type-h3">{heading}</h2>
          <ul className="mt-4 grid grid-cols-3 gap-3 tab:gap-group" onMouseLeave={() => setActive(null)}>
            {prints.map(p => {
              const dimmed = active !== null && active !== p.slug;
              return (
                <li key={p.slug} className={`transition-opacity duration-[250ms] ${dimmed ? 'opacity-45' : 'opacity-100'}`}>
                  <Link
                    href={p.href}
                    className="group flex flex-col gap-tight"
                    onPointerDown={e => {
                      pointer.current = e.pointerType;
                    }}
                    onMouseEnter={() => setActive(p.slug)}
                    onFocus={() => setActive(p.slug)}
                    onBlur={() => setActive(null)}
                    onClick={e => {
                      // Touch: the first tap previews the print in the frame,
                      // the second opens it.
                      if (pointer.current === 'touch' && active !== p.slug) {
                        e.preventDefault();
                        setActive(p.slug);
                      }
                    }}
                  >
                    <span className="relative block aspect-[5/7] w-full overflow-hidden bg-image-bg">
                      <Image src={p.image} alt={p.imageAlt} fill sizes="(max-width: 833px) 33vw, 192px" className="object-cover" />
                    </span>
                    <span className="flex flex-col type-small tab:flex-row tab:items-start tab:justify-between tab:gap-2">
                      <span className="transition-colors group-hover:text-brand">{p.name}</span>
                      <span className="shrink-0">{formatDisplayPrice(getLowestProductPrices(p)[currency], currency)}</span>
                    </span>
                    <span className="-mt-2 hidden type-caption tab:block">{p.artist}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {after}
      </div>
    </div>
  );
}
