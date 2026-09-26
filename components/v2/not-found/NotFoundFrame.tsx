'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button, TextLink } from '@/components/v2/ui';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDisplayPrice, getLowestProductPrices, type CurrencyPrices } from '@/lib/pricing';

export interface FramePrint {
  slug: string;
  href: string;
  name: string;
  artist: string;
  prices: Record<string, CurrencyPrices>;
  /** The artwork thumbnail the wall picker uses (public/images/v2/wall/chips). */
  chip: string;
  /** The room with this print hung in the frame (scripts/v2/frame_404.py). */
  composite: string;
}

export interface NotFoundFrameCopy {
  frameAlt: string;
  heading: string;
  body: string;
  printLabel: string;
  choose: string;
  seePrint: string;
  allPrints: string;
  artists: string;
}

/**
 * The 404: the empty frame with a card over it in the Start from your wall
 * style (the Print picker and See the print, no wall swatches). Choosing a
 * print hangs it in the frame (a 250 ms crossfade, instant under reduced
 * motion). Beside it, the message and the two ways on.
 */
export function NotFoundFrame({ t, prints, productsHref, artistsHref }: {
  t: NotFoundFrameCopy;
  prints: FramePrint[];
  productsHref: string;
  artistsHref: string;
}) {
  const [hung, setHung] = useState('');
  const chosen = prints.find(p => p.slug === hung);
  const { selectedCountry } = useLanguage();
  const priceOf = (p: FramePrint) => formatDisplayPrice(getLowestProductPrices(p)[selectedCountry.currency], selectedCountry.currency);

  const meta = (p: FramePrint) => (
    <span className="flex items-center gap-[6px] type-caption">
      <span>{p.artist}</span>
      <span aria-hidden className="hairline" />
      <span>{priceOf(p)}</span>
    </span>
  );

  return (
    <div className="page-grid gap-y-10 tab:items-center">
      <div className="relative col-span-full flex flex-col gap-group tab:col-span-5 tab:block desk:col-span-7">
        {/* Cropped from the top (the frame sits high in the photo), landscape
            from tablet up so the frame and the card both show on first view. */}
        <div className="relative aspect-square w-full overflow-hidden bg-image-bg tab:aspect-[5/4]">
          {/* The empty frame is the page's LCP image at every width. */}
          <Image src="/images/v2/not-found/empty-frame.webp" alt={t.frameAlt} fill preload sizes="(max-width: 833px) 100vw, 60vw" className="object-cover object-top" />
          {prints.map(p => (
            <Image
              key={p.slug}
              src={p.composite}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 833px) 100vw, 60vw"
              className={`object-cover object-top transition-opacity duration-[250ms] ease-out motion-reduce:transition-none ${hung === p.slug ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>

        {prints.length > 0 && (
          <div className="flex flex-col gap-group tab:absolute tab:bottom-6 tab:left-6 tab:w-[360px] tab:bg-bg tab:p-6">
            <div>
              <span className="mb-3 block type-small tab:mb-2 tab:type-caption">{t.printLabel}</span>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger className="group/pick flex w-full items-center gap-3 border border-line-strong bg-bg py-[6px] pl-[6px] pr-[14px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  {chosen ? (
                    <Image src={chosen.chip} alt="" width={36} height={36} sizes="36px" className="size-9 shrink-0 bg-image-bg object-cover" />
                  ) : (
                    <span aria-hidden className="size-9 shrink-0 border border-line bg-image-bg" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="type-small">{chosen ? chosen.name : t.choose}</span>
                    {chosen && meta(chosen)}
                  </span>
                  <svg aria-hidden width="10" height="6" viewBox="0 0 10 6" fill="none" className="shrink-0 transition-transform group-data-[state=open]/pick:rotate-180 motion-reduce:transition-none">
                    <path d="M.5.5 5 5 9.5.5" stroke="currentColor" />
                  </svg>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    side="top"
                    align="start"
                    sideOffset={-1}
                    className="z-50 w-(--radix-dropdown-menu-trigger-width) border border-ink bg-bg p-0 text-ink outline-hidden"
                  >
                    <DropdownMenu.RadioGroup value={hung} onValueChange={setHung}>
                      {prints.map(p => (
                        <DropdownMenu.RadioItem
                          key={p.slug}
                          value={p.slug}
                          className="flex cursor-pointer items-center gap-3 border-b border-line py-[6px] pl-[6px] pr-[14px] outline-hidden last:border-b-0 data-highlighted:bg-surface"
                        >
                          <Image src={p.chip} alt="" width={36} height={36} sizes="36px" className="size-9 shrink-0 bg-image-bg object-cover" />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-[6px] type-small">
                              {p.slug === hung && <span aria-hidden className="hairline" />}
                              {p.name}
                            </span>
                            {meta(p)}
                          </span>
                        </DropdownMenu.RadioItem>
                      ))}
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
            {chosen ? (
              <Button href={chosen.href} className="self-start tab:w-full tab:self-stretch">{t.seePrint}</Button>
            ) : (
              // Until a print is chosen there is nothing to see: the same
              // button, dimmed and inert, so the card never changes size.
              <Button type="button" disabled className="self-start tab:w-full tab:self-stretch">{t.seePrint}</Button>
            )}
          </div>
        )}
      </div>

      {/* First on a phone, so the message leads; beside the frame from tablet up. */}
      <div className="order-first col-span-full flex flex-col items-start tab:order-none tab:col-span-3 desk:col-span-4 desk:col-start-9">
        <h1 className="type-display">{t.heading}</h1>
        <p className="mt-6 type-body tab:type-lead">{t.body}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 tab:mt-band">
          <Button href={productsHref}>{t.allPrints}</Button>
          <TextLink href={artistsHref} size="body">{t.artists}</TextLink>
        </div>
      </div>
    </div>
  );
}
