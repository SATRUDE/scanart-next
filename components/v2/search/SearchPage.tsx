'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchStrings } from '@/lib/i18n';
import { fill, type SearchIndex, type SearchResults, type SearchTab } from '@/lib/site-search';
import { shouldTrackSiteSearch } from '@/lib/site-search-signal';
import { track } from '@/lib/analytics';
import { NoResults, Results, ResultTabs, TryList, tryLinks } from '@/components/v2/search/SearchResultViews';

/**
 * The search results page, /search?q= and /no/search?q= (Figma, Latest pages:
 * Search · results · all 231:5247 and 232:4390, the Prints tab 231:5287, no
 * results 231:5319 and 231:5516). Where Enter in the search overlay lands.
 *
 * The results are worked out on the server, from the same index and matching
 * as the overlay (lib/search-index.ts, lib/site-search.ts), so both agree and
 * the results are in the served HTML. The page itself is noindex, follow (see
 * the route files); the value for search is in the links it carries.
 *
 * The query is the heading, as an editable field: a new search is a GET to
 * this page. The H1 names the page for a screen reader ("Search results for
 * “Simen”"), since the field's value is not a heading. The tabs are client
 * state, mirrored into `&tab=` with replaceState so a reload or a shared link
 * keeps the tab without adding history entries.
 */
export function SearchPage({
  lang,
  query,
  initialTab,
  index,
  results,
}: {
  lang: 'en' | 'no';
  query: string;
  initialTab: SearchTab;
  index: SearchIndex;
  results: SearchResults;
}) {
  const t = searchStrings[lang];
  const router = useRouter();
  const fieldId = useId();
  const tabsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(query);
  const [tab, setTab] = useState<SearchTab>(initialTab);

  // One record of demand per search that lands here, marked apart from the
  // overlay's and the Prints grid's so no count is inflated.
  useEffect(() => {
    if (shouldTrackSiteSearch(query, index.prints.length)) {
      track('site-search', { query, results: results.total, source: 'search-page' });
    }
  }, [query, index.prints.length, results.total]);

  const onTab = (next: SearchTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url);
  };

  // A client navigation when JavaScript is running, the form's own GET when not.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = q.trim();
    if (!next) return;
    router.push(`${index.searchHref}?q=${encodeURIComponent(next)}`);
  };

  const clear = () => {
    setQ('');
    inputRef.current?.focus();
  };

  const hasQuery = query.length > 0;
  const found = results.total > 0;

  return (
    <div className="page-x pt-6 pb-section tab:pt-band">
      <h1 className="sr-only-sa">{hasQuery ? fill(t.pageTitleFor, { q: query }) : t.pageTitle}</h1>

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
              onChange={e => setQ(e.target.value)}
              placeholder={t.placeholderShort}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-ink caret-ink outline-none type-h1 placeholder:text-ink/45 focus-visible:outline-none tab:type-display [&::-webkit-search-cancel-button]:appearance-none"
            />
            {q ? (
              <button type="button" onClick={clear} className="shrink-0 type-small transition-colors hover:text-brand">
                {t.clear}
              </button>
            ) : (
              <button type="submit" className="shrink-0 type-small transition-colors hover:text-brand">
                {t.submit}
              </button>
            )}
            {/* The field's rule; 2 px while the field has focus, which is its focus indicator. */}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-ink transition-[height] group-focus-within/field:h-[2px]" />
          </div>
        </form>

        {hasQuery && found && <ResultTabs t={t} id={tabsId} tab={tab} onTab={onTab} results={results} />}
      </div>

      {!hasQuery ? (
        <div className="page-grid gap-y-8 pt-10 desk:pt-[60px]">
          <div className="col-span-full flex flex-col desk:col-span-6 desk:col-start-7 desk:border-t desk:border-ink desk:pt-4">
            <h2 className="mb-3 type-small">{t.popular}</h2>
            <TryList items={tryLinks(t, index)} />
          </div>
        </div>
      ) : !found ? (
        <NoResults t={t} index={index} query={query} className="page-grid gap-y-8 pt-8 desk:pt-[60px]" />
      ) : (
        <Results
          t={t}
          id={tabsId}
          tab={tab}
          results={results}
          index={index}
          query={query}
          isNo={lang === 'no'}
          artistRowOnMobile
          preloadFirst
          className="flex flex-col gap-[96px] pt-band desk:gap-[128px] desk:pt-[96px]"
        />
      )}
    </div>
  );
}
