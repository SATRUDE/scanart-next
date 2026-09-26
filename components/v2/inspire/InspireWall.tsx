'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { scenePosition } from '@/lib/scene-focus';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { Hairline } from '@/components/v2/ui';
import { formatDisplayPrice, getLowestProductPrices, type CurrencyPrices } from '@/lib/pricing';
import {
  WALLS,
  ROOMS,
  isRoom,
  isWall,
  type InspireFilterStrings,
  type RoomId,
  type TileRatio,
  type WallId,
} from '@/lib/inspire-walls';

export interface InspireRoomPrint {
  slug: string;
  name: string;
  artist: string;
  prices: Record<string, CurrencyPrices>;
}

export interface InspireRoom {
  image: string;
  alt: string;
  width: number;
  height: number;
  /** Untagged rooms (older Inspire scenes with no measured wall) show under All only. */
  wall?: WallId;
  room?: RoomId;
  ratio: TileRatio | 'natural';
  prints: InspireRoomPrint[];
}

const RATIO: Record<TileRatio, string> = {
  portrait: 'tab:aspect-[4/5]',
  square: 'tab:aspect-square',
  tall: 'tab:aspect-[2/3]',
};

/**
 * Inspire's wall (Figma 208:2720, filtered 208:3510, mobile 209:2968).
 *
 * Every room is in the served HTML and the filter only hides what does not
 * match, so search sees the whole gallery whatever the URL says. `?wall=` and
 * `?room=` are read after hydration and kept in the address bar with
 * replaceState (no navigation, no history entry), so a colour can be shared:
 * the homepage's "Start from your wall" links into `/inspire?wall=peach`. The
 * page's canonical stays /inspire for every one of them.
 *
 * The rooms flow in CSS columns, so the list stays in one DOM order (the
 * mobile order, the reading order and the JSON-LD order) and the columns
 * rebalance by themselves when the filter removes tiles.
 */
export function InspireWall({
  rooms,
  strings,
  locale = 'en',
}: {
  rooms: InspireRoom[];
  strings: InspireFilterStrings;
  locale?: 'en' | 'no';
}) {
  const [wall, setWall] = useState<WallId | null>(null);
  const [room, setRoom] = useState<RoomId | null>(null);
  const { selectedCountry } = useLanguage();
  const currency = selectedCountry.currency;
  const wallLabelId = useId();
  const roomLabelId = useId();
  const prefix = locale === 'no' ? '/no' : '';

  // Deep links apply after hydration: the page stays static, and the served
  // HTML is the unfiltered wall.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get('wall');
    const r = params.get('room');
    /* eslint-disable react-hooks/set-state-in-effect -- one-off sync from the URL after hydration; reading it during render would cause a server/client mismatch */
    if (isWall(w)) setWall(w);
    if (isRoom(r)) setRoom(r);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const choose = (nextWall: WallId | null, nextRoom: RoomId | null) => {
    setWall(nextWall);
    setRoom(nextRoom);
    const url = new URL(window.location.href);
    if (nextWall) url.searchParams.set('wall', nextWall);
    else url.searchParams.delete('wall');
    if (nextRoom) url.searchParams.set('room', nextRoom);
    else url.searchParams.delete('room');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  };

  const shown = useMemo(
    () =>
      rooms.map(r => {
        if (!wall && !room) return true;
        if (wall && r.wall !== wall) return false;
        if (room && r.room !== room) return false;
        return true;
      }),
    [rooms, wall, room]
  );
  const count = shown.filter(Boolean).length;
  const usedRooms = ROOMS.filter(id => rooms.some(r => r.room === id));

  return (
    <>
      <div className="flex flex-col gap-3 pt-8 tab:mt-band tab:gap-4 tab:border-t tab:border-ink tab:pt-group">
        <div className="flex flex-col gap-3 tab:flex-row tab:items-center tab:gap-6">
          <p id={wallLabelId} className="type-caption tab:w-16 tab:shrink-0 tab:type-small">{strings.wall}</p>
          <div
            role="group"
            aria-labelledby={wallLabelId}
            className="-mx-margin flex gap-4 overflow-x-auto px-margin scrollbar-hide tab:mx-0 tab:flex-wrap tab:gap-6 tab:overflow-visible tab:px-0"
          >
            <FilterOption selected={!wall} onClick={() => choose(null, room)}>
              {strings.all}
            </FilterOption>
            {WALLS.map(w => (
              <FilterOption key={w.id} selected={wall === w.id} onClick={() => choose(w.id, room)} chip={w.chip}>
                {strings.walls[w.id]}
              </FilterOption>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 tab:flex-row tab:items-center tab:gap-6">
          <p id={roomLabelId} className="type-caption tab:w-16 tab:shrink-0 tab:type-small">{strings.room}</p>
          <div
            role="group"
            aria-labelledby={roomLabelId}
            className="-mx-margin flex gap-4 overflow-x-auto px-margin scrollbar-hide tab:mx-0 tab:flex-wrap tab:gap-6 tab:overflow-visible tab:px-0"
          >
            <FilterOption selected={!room} onClick={() => choose(wall, null)}>
              {strings.allRooms}
            </FilterOption>
            {usedRooms.map(id => (
              <FilterOption key={id} selected={room === id} onClick={() => choose(wall, id)}>
                {strings.rooms[id]}
              </FilterOption>
            ))}
          </div>
        </div>
        <p aria-live="polite" className="type-small">
          {count === 1 ? strings.countOne : strings.countOther.replace('{n}', String(count))}
        </p>
      </div>

      {count === 0 && (
        <p className="mt-6 type-body tab:mt-12">
          {strings.empty}{' '}
          <button type="button" onClick={() => choose(null, null)} className="text-text-accent transition-colors hover:text-ink">
            {strings.reset}
          </button>
        </p>
      )}

      <ul className="mt-6 gap-8 tab:mt-12 tab:columns-2 desk:columns-3">
        {rooms.map((r, index) => {
          const first = r.prints[0];
          return (
            <li
              key={r.image}
              hidden={!shown[index]}
              className="mb-10 break-inside-avoid tab:mb-band"
            >
              <Link href={`${prefix}/product/${first.slug}`} className="group block">
                <div
                  className={`relative aspect-[4/5] w-full overflow-hidden bg-image-bg ${r.ratio === 'natural' ? '' : RATIO[r.ratio]}`}
                  style={r.ratio === 'natural' ? { aspectRatio: `${r.width} / ${r.height}` } : undefined}
                >
                  {/* This page is a wall of room scenes with little text above
                      it, so the first scene is the LCP element at every width.
                      Preload that one and leave the rest lazy. */}
                  <Image
                    src={r.image}
                    alt={r.alt}
                    fill
                    sizes="(max-width: 833px) 100vw, (max-width: 1199px) 50vw, 405px"
                    preload={index === 0}
                    style={{ objectPosition: scenePosition(r.image) }}
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                  />
                </div>
              </Link>
              {r.wall && (
                <p className="mt-tight flex items-center gap-tight type-small">
                  <span aria-hidden className="size-3 shrink-0 border-[0.5px] border-ink" style={{ background: WALLS.find(w => w.id === r.wall)?.chip }} />
                  <span>{strings.wallCaption[r.wall]}</span>
                  {r.room && (
                    <>
                      <Hairline />
                      <span>{strings.rooms[r.room]}</span>
                    </>
                  )}
                </p>
              )}
              <ul className={`${r.wall ? 'mt-2' : 'mt-tight'} flex flex-col gap-tight`}>
                {r.prints.map((p, i) => (
                  <li key={p.slug} className="flex items-start justify-between gap-4 type-small tab:type-body">
                    {/* Reads "Featuring Dragon by Helene Brox" to a screen reader
                        and to search, as the caption always has; the design
                        shows it as "Dragon, Helene Brox". */}
                    <span>
                      <span className="sr-only-sa">{i === 0 ? `${strings.featuring} ` : ` ${strings.and} `}</span>
                      <Link href={`${prefix}/product/${p.slug}`} className="transition-colors hover:text-brand">
                        {p.name}
                      </Link>
                      {p.artist && (
                        <>
                          <span aria-hidden>, </span>
                          <span className="sr-only-sa"> {strings.by} </span>
                          {p.artist}
                        </>
                      )}
                    </span>
                    <span className="shrink-0">{formatDisplayPrice(getLowestProductPrices(p)[currency], currency)}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * One filter choice. Desktop is the text option (hairline before the selected
 * one, the rest at 60%); mobile is the bordered Option (237:3674), 1 px ink
 * when selected. Wall colours carry their Swatch (237:3700): 24 on desktop with
 * a 2 px ink ring when selected, 16 inside the mobile option.
 */
function FilterOption({
  selected,
  onClick,
  chip,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  chip?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group/opt relative flex shrink-0 items-center gap-tight whitespace-nowrap px-3 py-2 type-small tab:border-0 tab:p-0 tab:pl-5 ${
        selected ? 'border border-ink' : 'border-[0.5px] border-ink'
      }`}
    >
      {/* Desktop only: every option reserves the line's space (tab:pl-5) and
          carries its own .option-mark, in front of the swatch, so the old line
          shrinks away and the new one grows in without moving a word. */}
      <span aria-hidden className="option-mark hidden tab:block" />
      {chip && (
        <span
          aria-hidden
          className={`size-4 shrink-0 tab:size-6 ${selected ? 'tab:outline-2 tab:outline-ink' : ''}`}
          style={{ background: chip }}
        />
      )}
      <span className={selected ? '' : 'transition-opacity tab:opacity-60 tab:group-hover/opt:opacity-100'}>{children}</span>
    </button>
  );
}
