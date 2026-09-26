'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button, TextLink } from '@/components/v2/ui';

export interface FramePrint {
  slug: string;
  href: string;
  name: string;
  artist: string;
  /** The room with this print hung in the frame (scripts/v2/frame_404.py). */
  composite: string;
}

/**
 * The 404's frame and its one control. "Fill the frame" is a small menu in
 * the Artist and Size panels' style, not a row of tiles: pick a print and it
 * hangs in the empty frame (a 250 ms crossfade, instant under reduced
 * motion), with a link to it underneath.
 */
export function NotFoundFrame({
  frameAlt,
  heading,
  body,
  fillLabel,
  seeLabel,
  cta,
  productsHref,
  prints,
}: {
  frameAlt: string;
  heading: string;
  body: string;
  fillLabel: string;
  /** "See {name}". */
  seeLabel: string;
  cta: string;
  productsHref: string;
  prints: FramePrint[];
}) {
  const [hung, setHung] = useState<string>('');
  const chosen = prints.find(p => p.slug === hung);

  return (
    <div className="page-grid gap-y-10 tab:items-center">
      <div className="col-span-full tab:col-span-4 desk:col-span-6">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-image-bg">
          {/* The empty frame is the page's LCP image at every width. */}
          <Image src="/images/v2/not-found/empty-frame.webp" alt={frameAlt} fill preload sizes="(max-width: 833px) 100vw, 50vw" className="object-cover" />
          {prints.map(p => (
            <Image
              key={p.slug}
              src={p.composite}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 833px) 100vw, 50vw"
              className={`object-cover transition-opacity duration-[250ms] ease-out motion-reduce:transition-none ${hung === p.slug ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
      </div>

      <div className="col-span-full flex flex-col items-start tab:col-span-4 desk:col-span-5 desk:col-start-8">
        <h1 className="type-display">{heading}</h1>
        <p className="mt-6 type-body tab:type-lead">{body}</p>

        {prints.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger className="group/fill inline-flex items-center gap-[6px] type-small transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[state=open]:text-brand">
                <span>{chosen ? `${fillLabel}: ${chosen.name}` : fillLabel}</span>
                <svg aria-hidden width="8" height="4" viewBox="0 0 8 4" fill="none" className="transition-transform duration-200 group-data-[state=open]/fill:rotate-180 motion-reduce:transition-none">
                  <path d="M.5.5 4 3.5 7.5.5" stroke="currentColor" />
                </svg>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={10}
                  className="z-50 min-w-56 border border-line bg-bg p-3 text-ink outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
                >
                  <DropdownMenu.Label className="mb-2 type-caption">{fillLabel}</DropdownMenu.Label>
                  <DropdownMenu.RadioGroup value={hung} onValueChange={setHung} className="space-y-0.5">
                    {prints.map(p => (
                      <DropdownMenu.RadioItem
                        key={p.slug}
                        value={p.slug}
                        className="flex cursor-pointer items-baseline justify-between gap-6 px-2 py-1.5 type-small outline-hidden data-highlighted:bg-surface data-[state=checked]:bg-surface"
                      >
                        <span>{p.name}</span>
                        <span className="type-caption text-ink/60">{p.artist}</span>
                      </DropdownMenu.RadioItem>
                    ))}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            {chosen && (
              <TextLink href={chosen.href} size="small">{seeLabel.replace('{name}', chosen.name)}</TextLink>
            )}
          </div>
        )}

        <Button href={productsHref} className="mt-10 tab:mt-band">{cta}</Button>
      </div>
    </div>
  );
}
