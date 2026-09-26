'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { scenePosition } from '@/lib/scene-focus';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';
import type { ProductImage } from '@/lib/product-image-alt';
import { warmImage } from '@/lib/warm-image';
import { chromeAria, isNoPath } from '@/lib/i18n';
import { galleryEn, fill, type GalleryStrings } from '@/lib/product-page-copy';
import type { ProductVideo as ProductVideoData } from '@/config/product-videos';
import { ProductVideo } from '@/components/v2/product/ProductVideo';
import { Hairline } from '@/components/v2/ui';

interface ProductImageGalleryWrapperProps {
  /**
   * Each image carries its own alt text, built from catalogue data by
   * lib/product-image-alt. Pairing the two here rather than passing parallel
   * arrays keeps them in step when a blank src is filtered out below.
   */
  images: ProductImage[];
  productName: string;
  /** A light-motion clip (config/product-videos.ts); takes the second slot. */
  video?: ProductVideoData;
  /** The clip's accessible name in the page's language. */
  videoLabel?: string;
  /** Localised gallery and lightbox copy; defaults to English. */
  strings?: GalleryStrings;
}

type Media =
  | { kind: 'image'; src: string; alt: string; caption: string }
  | { kind: 'video'; caption: string };

/**
 * The V2 product gallery (Figma 116:379, 187:1609, 116:455) and its lightbox
 * (116:534 all images, 115:442 one image).
 *
 * Desktop: the first two media side by side on four columns each, next to the
 * panel. Mobile: one swipe row of every image with a "1 / 2" position under
 * it. Both are the same DOM, so the first image is rendered once and is
 * preloaded once: it is always the standard print image, and it stays the
 * LCP. A product with a video (config/product-videos.ts) shows it second, on
 * both, and the room still moves to third.
 */
export const ProductImageGalleryWrapper: React.FC<ProductImageGalleryWrapperProps> = ({
  images,
  productName,
  video,
  videoLabel,
  strings = galleryEn,
}) => {
  const aria = chromeAria[isNoPath(usePathname() || '/') ? 'no' : 'en'];
  const validImages = images.filter(img => img.src && img.src.trim() !== '');

  const media: Media[] = validImages.map((img, i) => ({
    kind: 'image' as const,
    // Shown with the warm backdrop (lib/warm-image.ts); the JSON-LD and the
    // image sitemap keep declaring the original file.
    src: warmImage(img.src),
    alt: img.alt,
    caption: i === 0 ? strings.captions.print : strings.captions.scene,
  }));
  if (video) media.splice(Math.min(1, media.length), 0, { kind: 'video', caption: strings.captions.video });

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'single'>('single');
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);

  const count = media.length;
  const pad = (n: number) => String(n).padStart(2, '0');

  const show = useCallback(
    (next: number) => {
      const i = (next + count) % count;
      setIndex(i);
      // Image 0 is the print itself; anything after is a scene shot or the
      // clip, and whether people look at scenes is the signal this event
      // exists for.
      track('gallery-image-view', { productName, imageIndex: i, isScene: i > 0 });
    },
    [count, productName]
  );

  const openAt = (i: number) => {
    setView('single');
    setOpen(true);
    show(i);
  };
  const openGrid = () => {
    setView('grid');
    setOpen(true);
  };

  useEffect(() => {
    if (!open || view !== 'single' || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, view, index, count, show]);

  // The mobile swipe row's position, from the scroll offset.
  const onScroll = () => {
    const row = rowRef.current;
    if (!row || !row.firstElementChild) return;
    const step = (row.firstElementChild as HTMLElement).offsetWidth + 8;
    const i = Math.round(row.scrollLeft / step);
    if (i !== slide) {
      setSlide(i);
      track('gallery-image-view', { productName, imageIndex: i, isScene: i > 0 });
    }
  };

  const renderMedia = (m: Media, i: number, sizes: string, fit: 'cover' | 'contain' = 'cover') =>
    m.kind === 'video' && video ? (
      <ProductVideo
        video={video}
        label={videoLabel ?? productName}
        pauseLabel={aria.video.pause}
        playLabel={aria.video.play}
        productName={productName}
        className="h-full w-full"
      />
    ) : m.kind === 'image' ? (
      <Image
        src={m.src}
        alt={m.alt}
        fill
        // Only the print, and only in the page gallery: it is the LCP.
        preload={i === 0 && fit === 'cover'}
        sizes={sizes}
        style={fit === 'cover' ? { objectPosition: scenePosition(m.src) } : undefined}
        className={fit === 'cover' ? 'object-cover' : 'object-contain'}
      />
    ) : null;

  return (
    <div>
      <div
        ref={rowRef}
        onScroll={onScroll}
        className="-mx-margin flex snap-x snap-mandatory gap-2 overflow-x-auto scrollbar-hide tab:mx-0 tab:grid tab:grid-cols-2 tab:gap-gutter tab:overflow-visible"
      >
        {media.map((m, i) => (
          <div
            key={i}
            className={`relative aspect-[4/5] w-[calc(100vw-40px)] shrink-0 snap-start overflow-hidden bg-image-bg tab:aspect-[405/714] tab:w-auto ${i > 1 ? 'tab:hidden' : ''}`}
          >
            {m.kind === 'image' ? (
              <button
                type="button"
                onClick={() => openAt(i)}
                // The image inside carries the alt, which is the button's name.
                className="absolute inset-0 cursor-zoom-in"
              >
                {renderMedia(m, i, '(max-width: 833px) 90vw, (max-width: 1199px) 50vw, 405px')}
              </button>
            ) : (
              renderMedia(m, i, '405px')
            )}
            {/* "All 6 images" (116:531), on the second slot when there are more than two. */}
            {i === 1 && count > 2 && (
              <button
                type="button"
                onClick={openGrid}
                className={`absolute bottom-6 hidden items-center gap-2 type-small text-inverse-text transition-colors hover:text-brand tab:flex ${m.kind === 'video' ? 'left-6' : 'right-6'}`}
              >
                <Hairline />
                {fill(strings.allImages, { count })}
              </button>
            )}
          </div>
        ))}
      </div>
      {count > 1 && (
        <p className="pt-2 type-caption tab:hidden" aria-hidden>
          {slide + 1} / {count}
        </p>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-bg"
          >
            <div className="page-x flex items-baseline justify-between gap-6 pt-6 tab:pt-10">
              <div className="flex items-baseline gap-6 type-small">
                <Dialog.Title className="type-small">{productName}</Dialog.Title>
                {view === 'grid' && <span className="opacity-55">{fill(strings.imageCount, { count })}</span>}
              </div>
              <Dialog.Close className="type-small transition-colors hover:text-brand">{strings.close}</Dialog.Close>
            </div>

            {view === 'grid' ? (
              <ul className="page-x grid grid-cols-1 gap-x-gutter gap-y-8 pt-8 pb-band tab:grid-cols-2 tab:pt-band desk:grid-cols-3">
                {media.map((m, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        setView('single');
                        show(i);
                      }}
                      className="group flex w-full flex-col gap-[10px] text-left"
                    >
                      <span className="relative block aspect-[392/380] w-full overflow-hidden bg-image-bg">
                        {m.kind === 'image' ? (
                          <Image src={m.src} alt={m.alt} fill sizes="(max-width: 833px) 100vw, 400px" style={{ objectPosition: scenePosition(m.src) }} className="object-cover transition-transform duration-500 group-hover:scale-[1.015]" />
                        ) : video ? (
                          // The poster stands in for the clip in the overview.
                          <Image src={video.poster} alt={videoLabel ?? productName} fill sizes="(max-width: 833px) 100vw, 400px" className="object-cover" />
                        ) : null}
                      </span>
                      <span className="type-caption whitespace-pre">{`${pad(i + 1)}  ${m.caption}`}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="page-x flex flex-1 flex-col pt-4 pb-6 tab:pt-2 tab:pb-10">
                <div className="relative mx-auto min-h-[360px] w-full flex-1 tab:max-w-[760px]">
                  {media[index] &&
                    (media[index].kind === 'video' && video ? (
                      <div className="absolute inset-0">
                        <ProductVideo
                          key="lightbox-video"
                          video={video}
                          label={videoLabel ?? productName}
                          pauseLabel={aria.video.pause}
                          playLabel={aria.video.play}
                          productName={productName}
                          objectPosition="50% 50%"
                          className="h-full w-full"
                        />
                      </div>
                    ) : (
                      renderMedia(media[index], index, '(max-width: 833px) 100vw, 760px', 'contain')
                    ))}
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 type-small tab:grid-cols-[1fr_760px_1fr]">
                  {count > 1 ? (
                    <button type="button" onClick={() => setView('grid')} className="justify-self-start transition-colors hover:text-brand">
                      {pad(index + 1)} / {pad(count)}
                    </button>
                  ) : (
                    <span />
                  )}
                  <p className="col-span-2 row-start-2 type-caption tab:col-span-1 tab:row-start-1 tab:col-start-2">{media[index]?.caption}</p>
                  {count > 1 && (
                    <div className="flex justify-end gap-8 tab:col-start-3 tab:row-start-1">
                      <button type="button" onClick={() => show(index - 1)} className="transition-colors hover:text-brand">
                        {strings.previous}
                      </button>
                      <button type="button" onClick={() => show(index + 1)} className="transition-colors hover:text-brand">
                        {strings.next}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
