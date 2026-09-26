'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/v2/ui';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDisplayPrice } from '@/lib/pricing';
import { track } from '@/lib/analytics';
import {
  DEFAULT_PRINT,
  DEFAULT_WALL,
  ROOM,
  WALLS,
  type WallId,
  type WallPrint,
  type WallRenderer,
} from './wall/room';

export interface WallStrings {
  /** "Wall", the swatch group's label. */
  wallLabel: string;
  /** "Print", the dropdown's label. */
  printLabel: string;
  seePrint: string;
  /** Swatch names, e.g. { peach: 'Peach' }. */
  walls: Record<WallId, string>;
  /** The wall as it reads inside a sentence, e.g. { peach: 'peach' }. */
  wallsInSentence: Record<WallId, string>;
  /** For screen readers, updated on every change:
   *  "{print} by {artist}, {size}, framed on a {wall} wall in a home office." */
  roomDescription: string;
  /** Alt of the server-rendered still (the default wall and print). */
  stillAlt: string;
}

const DURATION = { wall: 300, print: 250 } as const;
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = (kind: 'wall' | 'print') => (reducedMotion() ? 0 : DURATION[kind]);

/**
 * Start from your wall (Figma 48:128 desktop, 184:1545 mobile), ported from
 * the wall-match prototype. Pick a wall colour and a print, and the print is
 * hung in a real room with the wall repainted, in place.
 *
 * Load order (docs/v2-seo.md, page speed): the server renders the default room
 * (Peach wall, Dancer) as a plain next/image still, so the section has its
 * picture, its size and its links with no JavaScript. The WebGL compositor is
 * a separate chunk, imported only when the section comes within 600 px of the
 * viewport (or the moment someone uses a control); without WebGL2 the CSS
 * blend-mode version takes over. The canvas sits exactly over the still and
 * the still fades out once the first frame is drawn, so nothing moves.
 *
 * Controls come over from the prototype: the swatches are native radios in a
 * fieldset (arrow keys for free), and the print picker is a select-only
 * combobox (button + listbox that opens upwards) with arrows, Home, End, Page
 * Up/Down, Enter, Space, Escape and type-ahead. Transitions drop to 0 under
 * reduced motion.
 */
export function StartFromYourWall({
  prints,
  strings,
  locale = 'en',
}: {
  prints: WallPrint[];
  strings: WallStrings;
  locale?: 'en' | 'no';
}) {
  const { selectedCountry } = useLanguage();
  const currency = selectedCountry.currency;
  const priceOf = (p: WallPrint) => formatDisplayPrice(p.prices[currency], currency);

  const initialPrint = prints.find(p => p.slug === DEFAULT_PRINT)?.slug ?? prints[0]?.slug;
  const [wall, setWall] = useState<WallId>(DEFAULT_WALL);
  const [printSlug, setPrintSlug] = useState(initialPrint);
  const print = prints.find(p => p.slug === printSlug) ?? prints[0];

  // ---- renderer: loaded lazily, near the viewport or on first use ----
  const sectionRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WallRenderer | null>(null);
  const loadingRef = useRef(false);
  const stateRef = useRef({ wall, print });
  useEffect(() => { stateRef.current = { wall, print }; }, [wall, print]);
  const [ready, setReady] = useState(false);

  const loadRenderer = useCallback(async () => {
    if (loadingRef.current || !roomRef.current) return;
    loadingRef.current = true;
    const el = roomRef.current;
    const opts = { duration };
    let renderer: WallRenderer;
    try {
      const { createGLRenderer } = await import('./wall/render-gl');
      renderer = await createGLRenderer(el, ROOM, opts);
    } catch {
      const { createCSSRenderer } = await import('./wall/render-css');
      renderer = await createCSSRenderer(el, ROOM, opts);
    }
    rendererRef.current = renderer;
    renderer.setView(ROOM.views.desktop);
    renderer.setWall(stateRef.current.wall);
    if (stateRef.current.print) await renderer.setPrint(stateRef.current.print);
    setReady(true);
    renderer.preload(prints);
  }, [prints]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          io.disconnect();
          loadRenderer();
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadRenderer]);

  useEffect(() => {
    const el = roomRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => rendererRef.current?.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => { if (ready) rendererRef.current?.setWall(wall); }, [wall, ready]);
  useEffect(() => { if (ready && print) rendererRef.current?.setPrint(print); }, [print, ready]);

  const chooseWall = (id: WallId) => {
    setWall(id);
    loadRenderer();
    track('wall-swatch', { wall: id, locale });
  };
  const choosePrint = (slug: string) => {
    if (slug === printSlug) return;
    setPrintSlug(slug);
    loadRenderer();
    track('wall-print', { print: slug, wall, locale });
  };

  // ---- print listbox (select-only combobox) ----
  const id = useId();
  const labelId = `${id}-label`;
  const buttonId = `${id}-button`;
  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const typed = useRef({ text: '', at: 0 });

  const clamp = (i: number) => Math.max(0, Math.min(prints.length - 1, i));
  const openList = () => {
    setActive(Math.max(0, prints.findIndex(p => p.slug === printSlug)));
    setOpen(true);
  };
  const closeList = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus({ preventScroll: true });
  };
  const chooseAt = (i: number) => {
    closeList();
    if (prints[i]) choosePrint(prints[i].slug);
  };

  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (open && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // optionId is derived from a stable useId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!selectRef.current?.contains(e.target as Node)) closeList(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const onButtonKey = (e: React.KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };
  const onListKey = (e: React.KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive(a => clamp(a + 1)),
      ArrowUp: () => setActive(a => clamp(a - 1)),
      Home: () => setActive(0),
      End: () => setActive(prints.length - 1),
      PageDown: () => setActive(a => clamp(a + 5)),
      PageUp: () => setActive(a => clamp(a - 5)),
      Enter: () => chooseAt(active),
      ' ': () => chooseAt(active),
      Escape: () => closeList(),
      Tab: () => closeList(false),
    };
    if (keys[e.key]) {
      if (e.key !== 'Tab') e.preventDefault();
      keys[e.key]();
      return;
    }
    if (e.key.length === 1) {
      // type-ahead
      const now = performance.now();
      const t = typed.current;
      t.text = now - t.at > 700 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
      t.at = now;
      const i = prints.findIndex(p => p.name.toLowerCase().startsWith(t.text));
      if (i >= 0) setActive(i);
    }
  };

  if (!print) return null;

  const description = strings.roomDescription
    .replace('{print}', print.name)
    .replace('{artist}', print.artist)
    .replace('{size}', print.size)
    .replace('{wall}', strings.wallsInSentence[wall]);

  const meta = (p: WallPrint) => (
    <span className="flex items-center gap-[6px] type-caption">
      <span>{p.artist}</span>
      <span aria-hidden className="hairline" />
      <span>{priceOf(p)}</span>
    </span>
  );

  return (
    <div ref={sectionRef} className="relative flex flex-col gap-group tab:block">
      <div ref={roomRef} className="relative aspect-[16/10] w-full overflow-hidden bg-image-bg [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full">
        {/* The server's picture of the default state. The renderer's canvas
            or CSS stage is appended over it; once it has drawn, this fades. */}
        <Image
          src={ROOM.still}
          alt={strings.stillAlt}
          fill
          sizes="(max-width: 833px) 100vw, (max-width: 1439px) calc(100vw - 96px), 1280px"
          className={`z-[1] object-cover object-top transition-opacity duration-200 ${ready ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        />
        <p className="sr-only-sa" aria-live="polite">{ready ? description : ''}</p>
      </div>

      <form
        onSubmit={e => e.preventDefault()}
        className="relative z-[2] flex flex-col gap-group tab:absolute tab:bottom-6 tab:left-6 tab:w-[360px] tab:bg-bg tab:p-6"
      >
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-3 flex items-center gap-[6px] p-0 type-small tab:mb-2 tab:type-caption">
            <span>{strings.wallLabel}</span>
            <span aria-hidden className="hairline" />
            <span>{strings.walls[wall]}</span>
          </legend>
          <div className="flex gap-4">
            {WALLS.map(w => (
              <label key={w.id} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name={`${id}-wall`}
                  value={w.id}
                  checked={wall === w.id}
                  onChange={() => chooseWall(w.id)}
                  aria-label={strings.walls[w.id]}
                  className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
                />
                <span
                  aria-hidden
                  style={{ background: w.hex }}
                  className="block size-9 border border-line transition-colors hover:border-line-strong peer-checked:border-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus tab:size-[45px]"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <span id={labelId} className="mb-3 block type-small tab:mb-2 tab:type-caption">{strings.printLabel}</span>
          <div ref={selectRef} className="relative">
            <button
              ref={buttonRef}
              id={buttonId}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-labelledby={`${labelId} ${buttonId}`}
              aria-controls={listId}
              onClick={() => (open ? closeList() : openList())}
              onKeyDown={onButtonKey}
              className="flex w-full items-center gap-3 border border-line-strong bg-bg py-[6px] pl-[6px] pr-[14px] text-left"
            >
              <Image src={print.chip} alt="" width={36} height={36} sizes="36px" className="size-9 shrink-0 bg-image-bg object-cover" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-small">{print.name}</span>
                {meta(print)}
              </span>
              <svg aria-hidden width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
                <path d="M.5.5 5 5 9.5.5" stroke="currentColor" />
              </svg>
            </button>
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={labelId}
              aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
              hidden={!open}
              onKeyDown={onListKey}
              onBlur={e => {
                if (open && !selectRef.current?.contains(e.relatedTarget as Node)) closeList(false);
              }}
              className="absolute inset-x-0 bottom-[calc(100%-1px)] z-10 m-0 max-h-[min(420px,60vh)] list-none overflow-y-auto overscroll-contain border border-ink bg-bg p-0"
            >
              {prints.map((p, i) => (
                <li
                  key={p.slug}
                  id={optionId(i)}
                  role="option"
                  aria-selected={p.slug === printSlug}
                  onClick={() => chooseAt(i)}
                  onMouseMove={() => active !== i && setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 border-b border-line py-[6px] pl-[6px] pr-[14px] last:border-b-0 ${i === active ? 'bg-surface' : ''}`}
                >
                  <Image src={p.chip} alt="" width={36} height={36} sizes="36px" className="size-9 shrink-0 bg-image-bg object-cover" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-[6px] type-small">
                      {p.slug === printSlug && <span aria-hidden className="hairline" />}
                      {p.name}
                    </span>
                    {meta(p)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button href={print.href} className="self-start tab:w-full tab:self-stretch">
          {strings.seePrint}
        </Button>
      </form>
    </div>
  );
}
