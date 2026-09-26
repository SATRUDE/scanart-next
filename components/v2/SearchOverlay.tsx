'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SmartImage } from '@/components/SmartImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchStrings, type SearchStrings } from '@/lib/i18n';
import { formatDisplayPrice, getLowestProductPrices } from '@/lib/pricing';
import { fill, highlight, searchIndex, type SearchIndex, type SearchPrint, type SearchResults, type SearchTab as Tab } from '@/lib/site-search';
import { shouldTrackSiteSearch } from '@/lib/site-search-signal';
import { track } from '@/lib/analytics';
import { NoResults, Results, ResultTabs } from '@/components/v2/search/SearchResultViews';

/**
 * Full-screen search (Figma: Search overlay 242:4241, the Search frames on
 * Latest pages, and the motion notes in about-hero-motion.md).
 *
 * SEO (docs/v2-seo.md, item 8): a real GET form that submits to the search
 * page, /search?q= (or /no/search?q=), which is noindex, follow and not in the
 * sitemap. /products?q= still works for old links, and the Prints section
 * links to it. The live suggestions and the tabbed results are client state
 * inside this dialog, and nothing here is in the served HTML. The indexable
 * value is in the links, which go to real category, collection, artist,
 * product and article pages.
 *
 * The tabs, result sections and no results state are shared with the search
 * page (components/v2/search/SearchResultViews.tsx), so the two agree.
 *
 * The data is the small index the root layout builds (lib/search-index.ts);
 * matching is on the client (lib/site-search.ts), with the same fields as the
 * /products grid, so "See all" and the Prints page never disagree.
 *
 * States: open (popular and recent searches), typing (live suggestions after
 * a 150 ms debounce), searching (while the debounce settles on the results
 * view), results (All / Prints / Artists / Stories tabs) and no results (with
 * places to try instead).
 *
 * Access: a modal dialog with a focus trap; Escape and Close both close it and
 * focus goes back to whatever opened it. Motion follows the notes (rise 450 ms,
 * rule draws, columns stagger) and collapses to a 150 ms fade under
 * prefers-reduced-motion.
 */
export function SearchOverlay({
  open,
  onClose,
  isNo,
  index = EMPTY_INDEX,
}: {
  open: boolean;
  onClose: () => void;
  isNo: boolean;
  index?: SearchIndex;
}) {
  // Mounted only while open, so every opening starts from the empty state
  // and the panel's browser-only reads (motion preference, recent searches)
  // never run during server rendering.
  if (!open) return null;
  return <SearchPanel onClose={onClose} isNo={isNo} index={index} />;
}

const EMPTY_INDEX: SearchIndex = { prints: [], artists: [], stories: [], popular: [], productsHref: '/products', searchHref: '/search', inspireHref: '/inspire' };

const RECENT_KEY = 'scanart-recent-searches';
const EASE = 'cubic-bezier(.2,.7,.2,1)';

type View = 'suggest' | 'results';

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(x => typeof x === 'string').slice(0, 4) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  try {
    const next = [term, ...readRecent().filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 4);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private windows and blocked storage: recent searches are a convenience.
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function SearchPanel({ onClose, isNo, index }: { onClose: () => void; isNo: boolean; index: SearchIndex }) {
  const t = searchStrings[isNo ? 'no' : 'en'];
  const router = useRouter();
  const fieldId = useId();
  const tabsId = useId();

  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [view, setView] = useState<View>('suggest');
  const [tab, setTab] = useState<Tab>('all');
  const [recent] = useState<string[]>(readRecent);
  const [narrow] = useState(() => window.matchMedia('(max-width: 833px)').matches);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closing = useRef(false);

  // Suggestions swap without motion after a 150 ms debounce (motion notes).
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(q), 150);
    return () => window.clearTimeout(id);
  }, [q]);

  const results = useMemo(() => searchIndex(index, debounced), [index, debounced]);
  const pending = q.trim() !== debounced.trim();

  // Opening: focus the field, lock the page behind, play the rise.
  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    if (dialog && typeof dialog.animate === 'function') {
      if (prefersReducedMotion()) {
        dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
      } else {
        dialog.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 450, easing: EASE });
        ruleRef.current?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 400, delay: 120, easing: EASE, fill: 'backwards' });
        inputRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 200, fill: 'backwards' });
        Array.from(bodyRef.current?.querySelectorAll<HTMLElement>('[data-stagger]') ?? []).forEach((el, i) =>
          el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], {
            duration: 300,
            delay: 280 + i * 60,
            easing: EASE,
            fill: 'backwards',
          })
        );
      }
    }

    return () => {
      document.body.style.overflow = overflow;
      // Opened from the mobile menu, the opener has gone with the menu: land
      // on the Menu button that opened it instead of the top of the page.
      const back = returnFocus.current?.isConnected
        ? returnFocus.current
        : document.querySelector<HTMLElement>('header button[aria-expanded]');
      back?.focus?.({ preventScroll: true });
    };
  }, []);

  /** Every way out goes through here: fade 250 ms (150 reduced), then unmount. */
  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.animate !== 'function') return onClose();
    const anim = dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: prefersReducedMotion() ? 150 : 250, easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = () => onClose();
  };

  // Escape closes; Tab and Shift+Tab stay inside the dialog.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      requestClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(el => el.tabIndex !== -1 && el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const setQuery = (value: string) => {
    setQ(value);
    if (!value.trim()) setView('suggest');
  };

  const clear = () => {
    setQ('');
    setDebounced('');
    setView('suggest');
    setTab('all');
    inputRef.current?.focus();
  };

  const showAll = (term = q) => {
    const query = term.trim();
    if (!query) return;
    saveRecent(query);
    setQ(term);
    setDebounced(term);
    setTab('all');
    setView('results');
    const found = searchIndex(index, query);
    // The overlay's own record of demand, kept apart from the grid's
    // site-search events by `source` so neither count is inflated.
    if (shouldTrackSiteSearch(query, index.prints.length)) {
      track('site-search', { query, results: found.total, source: 'overlay' });
    }
    inputRef.current?.focus();
  };

  // The form's own submission: the search page, /search?q= (/no/search?q= on
  // Norwegian pages), a client navigation when JavaScript is running, a plain
  // GET when it is not.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    saveRecent(query);
    router.push(`${index.searchHref}?q=${encodeURIComponent(query)}`);
    requestClose();
  };

  const hasQuery = q.trim().length > 0;
  const big = view === 'results';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.dialog}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-bg"
    >
      <div className="page-x flex h-[60px] items-center justify-between tab:h-auto tab:pt-9 tab:pb-2">
        <span aria-hidden className="w-[42px] tab:w-20" />
        <span aria-hidden className="font-serif text-[22px] leading-[28px] whitespace-nowrap tab:text-[34px] tab:leading-[42px] tab:tracking-[-0.01em]">
          Scandinavian Art
        </span>
        <button type="button" onClick={requestClose} className="w-[42px] text-right type-small transition-colors hover:text-brand tab:w-20">
          {t.close}
        </button>
      </div>

      <div className="page-x flex flex-col gap-10 pt-6 pb-band tab:gap-[56px] tab:pt-[56px]">
        <div className="flex flex-col gap-6">
          <form action={index.searchHref} method="get" role="search" onSubmit={onSubmit}>
            <div className="group/field relative flex items-baseline justify-between gap-6 pb-3">
              <label htmlFor={fieldId} className="sr-only-sa">{t.placeholder}</label>
              <input
                ref={inputRef}
                id={fieldId}
                name="q"
                type="search"
                enterKeyHint="search"
                value={q}
                onChange={e => setQuery(e.target.value)}
                placeholder={narrow ? t.placeholderShort : t.placeholder}
                autoComplete="off"
                spellCheck={false}
                className={`min-w-0 flex-1 bg-transparent text-ink caret-ink outline-none focus-visible:outline-none placeholder:text-ink/45 [&::-webkit-search-cancel-button]:appearance-none ${big ? 'type-h1 tab:type-display' : 'type-h2 tab:type-h1'}`}
              />
              {hasQuery ? (
                <button type="button" onClick={clear} className="shrink-0 type-small transition-colors hover:text-brand">
                  {t.clear}
                </button>
              ) : (
                <button type="submit" className="hidden shrink-0 type-small transition-colors hover:text-brand tab:inline">
                  {t.submit}
                </button>
              )}
              {/* The field's rule, drawn left to right on opening; 2 px while
                  the field has focus, which is its focus indicator. */}
              <span
                ref={ruleRef}
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px origin-left bg-ink transition-[height] group-focus-within/field:h-[2px]"
              />
            </div>
          </form>

          {view === 'results' && hasQuery && (
            <ResultTabs t={t} id={tabsId} tab={tab} onTab={setTab} results={results} pending={pending} />
          )}
        </div>

        <p aria-live="polite" className="sr-only-sa">
          {debounced.trim() && !pending ? fill(t.resultCount, { n: results.total }) : ''}
        </p>

        <div ref={bodyRef}>
          {!hasQuery ? (
            <OpenState t={t} index={index} recent={recent} onRecent={term => showAll(term)} onNavigate={requestClose} />
          ) : view === 'suggest' ? (
            debounced.trim() === '' ? null : results.total === 0 ? (
              pending ? null : <NoResults t={t} index={index} query={debounced.trim()} onNavigate={requestClose} />
            ) : (
              <LiveSuggestions t={t} results={results} query={debounced} onNavigate={requestClose} onSeeAll={() => showAll()} />
            )
          ) : pending ? (
            <Searching t={t} />
          ) : results.total === 0 ? (
            <NoResults t={t} index={index} query={debounced.trim()} onNavigate={requestClose} />
          ) : (
            <Results t={t} id={tabsId} tab={tab} results={results} index={index} query={debounced.trim()} isNo={isNo} onNavigate={requestClose} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function OpenState({
  t,
  index,
  recent,
  onRecent,
  onNavigate,
}: {
  t: SearchStrings;
  index: SearchIndex;
  recent: string[];
  onRecent: (term: string) => void;
  onNavigate: () => void;
}) {
  // Mobile: the terms are chips; desktop: serif H3 lines (Search · open).
  const chip = 'whitespace-nowrap border border-ink px-[10px] py-2 type-small transition-colors hover:text-brand tab:border-0 tab:p-0 tab:type-h3';
  return (
    <div className="page-grid gap-y-10">
      {index.popular.length > 0 && (
        <div data-stagger className="col-span-full flex flex-col gap-3 tab:col-span-4">
          <h2 className="type-small">{t.popular}</h2>
          <ul className="flex flex-wrap gap-[10px] tab:flex-col tab:flex-nowrap tab:gap-[6px]">
            {index.popular.map(item => (
              <li key={item.href} className="shrink-0">
                <Link href={item.href} onClick={onNavigate} className={`block ${chip}`}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {recent.length > 0 && (
        <div data-stagger className="col-span-full flex flex-col gap-3 tab:col-span-4">
          <h2 className="type-small">{t.recent}</h2>
          <ul className="flex flex-wrap gap-[10px] tab:flex-col tab:flex-nowrap tab:gap-[6px]">
            {recent.map(term => (
              <li key={term} className="shrink-0">
                <button type="button" onClick={() => onRecent(term)} className={`text-left ${chip}`}>{term}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div data-stagger className="hidden flex-col gap-3 tab:col-span-4 tab:flex">
        <h2 className="type-small">{t.roomsHeading}</h2>
        <Link href={index.inspireHref} onClick={onNavigate} className="type-body transition-colors hover:text-brand">
          {t.roomsLink} <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function PriceLine({ print }: { print: SearchPrint }) {
  const { selectedCountry } = useLanguage();
  const currency = selectedCountry.currency;
  return (
    <p className="flex items-center gap-[6px] type-caption">
      <span>{print.artist}</span>
      <span aria-hidden className="hairline" />
      <span>{formatDisplayPrice(getLowestProductPrices(print)[currency], currency)}</span>
    </p>
  );
}

function LiveSuggestions({
  t,
  results,
  query,
  onNavigate,
  onSeeAll,
}: {
  t: SearchStrings;
  results: SearchResults;
  query: string;
  onNavigate: () => void;
  onSeeAll: () => void;
}) {
  const prints = results.prints.slice(0, 3);
  const stories = results.stories.slice(0, 3);
  return (
    <div className="flex flex-col gap-10 tab:gap-12">
      <div className="page-grid gap-y-8">
        {prints.length > 0 && (
          <div className="col-span-full flex flex-col gap-3 desk:col-span-6">
            <h2 className="type-small">{t.prints}</h2>
            <ul className="flex flex-col gap-3">
              {prints.map(print => (
                <li key={print.id}>
                  <Link href={print.href} onClick={onNavigate} className="group flex items-center gap-4">
                    <span className="relative size-12 shrink-0 overflow-hidden bg-image-bg tab:size-[72px]">
                      <SmartImage src={print.image} alt="" sizes="72px" className="h-full w-full" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-[2px]">
                      <span className="type-body transition-colors group-hover:text-brand">{print.name}</span>
                      <PriceLine print={print} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(results.artists.length > 0 || stories.length > 0) && (
          <div className="col-span-full flex flex-col gap-6 desk:col-span-6">
            {results.artists.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="type-small">{t.artists}</h2>
                <ul className="flex flex-col gap-1">
                  {results.artists.map(artist => {
                    const [before, match, after] = highlight(artist.name, query);
                    return (
                      <li key={artist.slug}>
                        <Link href={artist.href} onClick={onNavigate} className="type-h3 transition-colors hover:text-brand">
                          {before}
                          <span className="text-text-accent">{match}</span>
                          {after}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {stories.length > 0 && (
              <div className={`flex flex-col gap-3 ${results.artists.length > 0 ? 'border-t border-ink pt-4' : ''}`}>
                <h2 className="type-small">{t.stories}</h2>
                <ul className="flex flex-col gap-2">
                  {stories.map(story => (
                    <li key={story.slug}>
                      <Link href={story.href} onClick={onNavigate} className="type-body transition-colors hover:text-brand">{story.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={onSeeAll} className="self-start pt-2 text-left type-body transition-colors hover:text-brand">
        {fill(results.total === 1 ? t.seeAllOne : t.seeAll, { n: results.total, q: query.trim() })} <span aria-hidden>→</span>
      </button>
    </div>
  );
}

function Searching({ t }: { t: SearchStrings }) {
  return (
    <div className="flex flex-col gap-6 pt-6 tab:pt-10">
      <p className="type-body">{t.searching}</p>
      <div className="page-grid gap-y-6">
        {[0, 1, 2].map(i => (
          <div key={i} className={`col-span-full aspect-square bg-image-bg tab:col-span-4 ${i > 0 ? 'hidden tab:block' : ''}`} />
        ))}
      </div>
    </div>
  );
}
