'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { PrintCard } from '@/components/PrintCard';
import { SmartImage } from '@/components/SmartImage';
import { getArtistInitials } from '@/data/artists';
import type { SearchStrings } from '@/lib/i18n';
import { fill, type SearchArtist, type SearchIndex, type SearchResults, type SearchStory, type SearchTab } from '@/lib/site-search';
import { OPTION_PAD } from '@/components/v2/OptionTrack';

/**
 * The results views shared by the search overlay (components/v2/SearchOverlay)
 * and the search page (/search, components/v2/search/SearchPage): the All /
 * Prints / Artists / Stories tabs, the three result sections and the no
 * results state (Figma, Latest pages: Search · results · all 231:5247, the
 * Prints tab 231:5287, no results 231:5319, and their mobile frames).
 *
 * One copy of each so the overlay and the page cannot drift apart: the page is
 * where Enter in the overlay lands, and a visitor should see the same thing in
 * both.
 */

export function ResultTabs({
  t,
  id,
  tab,
  onTab,
  results,
  pending = false,
}: {
  t: SearchStrings;
  id: string;
  tab: SearchTab;
  onTab: (tab: SearchTab) => void;
  results: SearchResults;
  pending?: boolean;
}) {
  const tabs: { key: SearchTab; label: string; short?: string; count: number }[] = [
    { key: 'all', label: t.allResults, short: t.allShort, count: results.total },
    { key: 'prints', label: t.prints, count: results.prints.length },
    { key: 'artists', label: t.artists, count: results.artists.length },
    { key: 'stories', label: t.stories, count: results.stories.length },
  ];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const next = (from + step + tabs.length) % tabs.length;
    onTab(tabs[next].key);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={t.tabsLabel} className="flex flex-wrap items-center gap-x-3 gap-y-2 type-caption tab:gap-x-6 tab:type-small">
      {tabs.map((item, i) => {
        const selected = item.key === tab;
        return (
          <button
            key={item.key}
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${id}-tab-${item.key}`}
            aria-selected={selected}
            aria-controls={`${id}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onTab(item.key)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') { e.preventDefault(); move(i, 1); }
              if (e.key === 'ArrowLeft') { e.preventDefault(); move(i, -1); }
            }}
            className={`relative flex items-center ${OPTION_PAD} transition-opacity ${selected ? '' : 'opacity-60 hover:opacity-100'}`}
          >
            <span aria-hidden className="option-mark" />
            {/* "All (7)" on a phone, so the four tabs keep to one line (232:4390). */}
            <span>
              {item.short ? (
                <>
                  <span className="tab:hidden">{item.short}</span>
                  <span className="hidden tab:inline">{item.label}</span>
                </>
              ) : item.label}
              {pending ? '' : ` (${item.count})`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SectionHead({ title, link, onNavigate }: { title: string; link?: { href: string; label: string }; onNavigate?: () => void }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-ink pt-4 tab:pt-6">
      <h2 className="type-h2">{title}</h2>
      {link && (
        <Link href={link.href} onClick={onNavigate} className="shrink-0 text-right type-small transition-colors hover:text-brand">
          {link.label}
        </Link>
      )}
    </div>
  );
}

/**
 * Where the Prints section's link goes. When the prints found are exactly one
 * artist's whole body of work (a search for "Simen"), the design's "All 5
 * prints by Simen Wahlqvist" goes to that artist's page; otherwise the
 * catalogue's own query URL, /products?q=, shows the same prints with the
 * filters.
 */
function printsLink(t: SearchStrings, results: SearchResults, index: SearchIndex, query: string) {
  const [artist] = results.artists;
  if (
    results.artists.length === 1 &&
    results.prints.length > 1 &&
    results.prints.length === artist.printCount &&
    results.prints.every(p => p.artist === artist.name)
  ) {
    return { href: artist.href, label: fill(t.allPrintsBy, { n: artist.printCount, name: artist.name }) };
  }
  return { href: `${index.productsHref}?q=${encodeURIComponent(query)}`, label: t.seeOnPrintsPage };
}

export function Results({
  t,
  id,
  tab,
  results,
  index,
  query,
  isNo,
  onNavigate,
  className = 'flex flex-col gap-[96px] pt-10 desk:gap-[128px]',
  artistRowOnMobile = false,
  preloadFirst = false,
}: {
  t: SearchStrings;
  id: string;
  tab: SearchTab;
  results: SearchResults;
  index: SearchIndex;
  query: string;
  isNo: boolean;
  onNavigate?: () => void;
  className?: string;
  /** The search page's mobile artist card: portrait on the left (232:4390). */
  artistRowOnMobile?: boolean;
  /** The first print tiles are the page's LCP candidates on /search. */
  preloadFirst?: boolean;
}) {
  const show = (k: SearchTab) => (tab === 'all' || tab === k);
  return (
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className={className}>
      {show('prints') && results.prints.length > 0 && (
        <section className="flex flex-col gap-band">
          <SectionHead title={t.prints} link={printsLink(t, results, index, query)} onNavigate={onNavigate} />
          {/* One continuous list in columns, each tile 64 under the one
              above (layout.md, rule 13); CSS columns keep the DOM, reading
              and tab order the same as the list. */}
          <ul className="columns-1 gap-x-8 tab:columns-2 desk:columns-3">
            {results.prints.map((print, i) => (
              <li key={print.id} className="mb-band break-inside-avoid">
                <Link href={print.href} onClick={onNavigate} className="block">
                  <PrintCard
                    product={print}
                    locale={isNo ? 'no' : 'en'}
                    priority={preloadFirst && i < 3}
                    sizes="(max-width: 833px) 100vw, (max-width: 1199px) 50vw, 405px"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show('artists') && results.artists.length > 0 && (
        <section className="flex flex-col gap-band">
          <SectionHead title={t.artists} onNavigate={onNavigate} />
          <ul className="page-grid gap-y-10">
            {results.artists.map(artist => (
              <li key={artist.slug} className="col-span-full tab:col-span-4">
                <ArtistResult t={t} artist={artist} onNavigate={onNavigate} rowOnMobile={artistRowOnMobile} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {show('stories') && results.stories.length > 0 && (
        <section className="flex flex-col gap-band">
          <SectionHead title={t.stories} onNavigate={onNavigate} />
          <ul className="page-grid gap-y-band">
            {results.stories.map(story => (
              <li key={story.slug} className="col-span-full tab:col-span-4">
                <StoryResult story={story} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Artist card 61:199: rule on top, portrait, name in H3, one line, city and
 * prints at the foot. On the search page's mobile frame the portrait sits to
 * the left of the words instead (rowOnMobile).
 */
function ArtistResult({ t, artist, onNavigate, rowOnMobile }: { t: SearchStrings; artist: SearchArtist; onNavigate?: () => void; rowOnMobile: boolean }) {
  return (
    <Link
      href={artist.href}
      onClick={onNavigate}
      className={`group flex h-full border-t border-ink pt-group tab:min-h-[380px] tab:flex-col tab:gap-group ${rowOnMobile ? 'flex-row gap-4' : 'flex-col gap-group'}`}
    >
      <span className="relative size-14 shrink-0 overflow-hidden bg-image-bg">
        {artist.image ? (
          <SmartImage src={artist.image} alt={artist.name} sizes="56px" className="h-full w-full" />
        ) : (
          <span aria-hidden className="flex h-full w-full items-center justify-center type-small">{getArtistInitials(artist.name)}</span>
        )}
      </span>
      <span className={`flex flex-1 flex-col justify-between tab:gap-group ${rowOnMobile ? 'gap-2' : 'gap-group'}`}>
        <span className={`flex flex-col tab:gap-group ${rowOnMobile ? 'gap-1' : 'gap-group'}`}>
          <span className="type-h3 transition-colors group-hover:text-brand">{artist.name}</span>
          <span className="type-body">{artist.line}</span>
        </span>
        <span className="flex items-center gap-[6px] type-caption">
          <span>{artist.city}</span>
          <span aria-hidden className="hairline" />
          <span>{artist.printCount === 1 ? t.printCountOne : fill(t.printCount, { n: artist.printCount })}</span>
        </span>
      </span>
    </Link>
  );
}

/** Story tile 45:131: image at 4:5, then the category in text-accent and the title. */
function StoryResult({ story, onNavigate }: { story: SearchStory; onNavigate?: () => void }) {
  return (
    <Link href={story.href} onClick={onNavigate} className="group flex flex-col gap-tight">
      <span className="relative block aspect-[4/5] w-full overflow-hidden bg-image-bg">
        <SmartImage src={story.image} alt={story.imageAlt} sizes="(max-width: 833px) 100vw, 405px" className="h-full w-full" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="type-caption text-text-accent">{story.category}</span>
        <span className="type-body transition-colors group-hover:text-brand">{story.title}</span>
      </span>
    </Link>
  );
}

/**
 * Places to go instead: the popular searches (real category, collection and
 * artist pages), the rooms and the whole catalogue. Links to indexable pages,
 * never to another search URL.
 */
export function tryLinks(t: SearchStrings, index: SearchIndex) {
  return [
    ...index.popular.slice(0, 2),
    ...index.popular.slice(-1),
    { label: t.roomsLink, href: index.inspireHref },
    { label: fill(t.allPrints, { n: index.prints.length }), href: index.productsHref },
  ];
}

export function TryList({ items, onNavigate }: { items: { label: string; href: string }[]; onNavigate?: () => void }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="flex items-baseline justify-between gap-4 border-b border-ink py-[14px] type-body transition-colors hover:text-brand tab:type-h3"
          >
            <span>{item.label}</span>
            <span aria-hidden className="type-body">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function NoResults({
  t,
  index,
  query,
  onNavigate,
  className = 'page-grid gap-y-8 pt-2 tab:pt-10',
}: {
  t: SearchStrings;
  index: SearchIndex;
  query: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="col-span-full flex flex-col gap-4 desk:col-span-6">
        <h2 className="type-h2">{fill(t.noResultsTitle, { q: query })}</h2>
        <p className="type-body">{t.noResultsBody}</p>
      </div>
      <div className="col-span-full flex flex-col desk:col-span-6 desk:border-t desk:border-ink desk:pt-4">
        <h3 className="mb-3 hidden type-small tab:block">{t.tryHeading}</h3>
        <TryList items={tryLinks(t, index)} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
