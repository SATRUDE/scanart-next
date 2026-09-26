'use client';
/// <reference types="react/canary" />

import React, {
  Suspense,
  ViewTransition,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '@/lib/analytics';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { sizeLabel } from '@/components/PrintCard';
import { OPTION_PAD } from '@/components/v2/OptionTrack';
import type { ShopRoute } from '@/components/v2/shop/shop-routes';
import type { ShopSort } from '@/components/v2/shop/shop-filters';
import type { ProductsGridStrings } from '@/lib/i18n';
import './shop-frame.css';

/**
 * The shop frame: /products and every category and collection landing, EN and
 * NO (app/(en)/(shop)/layout.tsx and its /no twin).
 *
 * Mark (26 Sep 2026): the filter options led to new pages, which is right for
 * search and wrong for the visitor, who is suddenly somewhere else. So each
 * option is still a real link to its own statically rendered URL, and this
 * frame, which lives in the shared layout and never re-mounts between those
 * URLs, makes the change look like filtering one page:
 *
 *   - The Filter bar stays mounted. Its links pass scroll={false}, so the
 *     scroll position is kept, and focus stays on the option that was chosen.
 *   - The page header (H1, lead, meta line) swaps in place above it. Every
 *     header is reserved the same height, so the bar does not move; if one ever
 *     outgrows that, the scroll is corrected by the difference so the bar still
 *     holds its place on screen.
 *   - The header and the grid crossfade through React's <ViewTransition>,
 *     which Next's navigations trigger (shop-frame.css). Only filter
 *     clicks carry the 'shop-filter' type, so no other navigation animates.
 *   - Everything below the grid is the page's own and follows on the same
 *     render.
 *
 * Artist, Size and Sort filter in place, as before. They reset when the
 * category changes: an artist chosen on Abstract may have nothing in Kitchen,
 * and an empty grid after a click reads as broken.
 */

export const SHOP_TRANSITION = 'shop-filter';

type ShopState = {
  locale: 'en' | 'no';
  strings: ProductsGridStrings;
  /** A ?q= search, on /products only. */
  query: string;
  /** A legacy /products?category= deep link, on /products only. */
  category: string;
  artist: string;
  size: string;
  sort: ShopSort;
};

const ShopContext = createContext<ShopState | null>(null);

export function useShop() {
  const state = useContext(ShopContext);
  if (!state) throw new Error('useShop must be used inside ShopFrame');
  return state;
}

/**
 * Lifts the URL query (`?category=`, `?q=`) into the frame's state.
 *
 * This lives in its own component behind a Suspense boundary on purpose:
 * useSearchParams client-renders the tree up to the nearest boundary, so when
 * the grid itself called the hook the entire catalogue was that tree and
 * /products had to be dynamically rendered to get products into the served
 * HTML. Isolated in a leaf that renders nothing, everything above it (the grid
 * and its JSON-LD) prerenders into the static HTML, and the query is applied on
 * hydration instead. Reading it through the hook rather than
 * window.location.search keeps it reactive, so the header's search still
 * re-filters when it pushes /products?q= while already on this page.
 */
function QuerySync({ onChange }: { onChange: (v: { category: string; q: string }) => void }) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'All';
  const q = searchParams.get('q') || '';
  useEffect(() => {
    onChange({ category, q });
  }, [category, q, onChange]);
  return null;
}

/** Chevron from the Filter bar master (8 × 4). */
function Chevron() {
  return (
    <svg aria-hidden width="8" height="4" viewBox="0 0 8 4" fill="none" className="pointer-events-none">
      <path d="M.5.5 4 3.5 7.5.5" stroke="currentColor" />
    </svg>
  );
}

/**
 * A refine control from the Filter bar, set as text: "Artist ⌄". A native
 * select sits transparent over the visible label, so the control is exactly as
 * wide as what it shows, keyboard and screen reader get the real <select>, and
 * the platform picker opens on click. The focus ring follows the select.
 */
function Refine({ id, label, prefix, value, options, onChange, reserve }: {
  id: string;
  /** Accessible name when there is no visible prefix. */
  label: string;
  /** Visible before the value, which then names the control: "Sort: Name". */
  prefix?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  /** Labels to hold room for, so the control keeps one width across pages whose defaults differ. */
  reserve?: string[];
}) {
  const shown = options.find(o => o.value === value)?.label ?? options[0]?.label;
  const control = (
    <span className="relative inline-flex items-center gap-[6px] type-small transition-colors hover:text-brand has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-focus">
      <label htmlFor={id} className={prefix ? '' : 'sr-only-sa'}>{prefix ?? label}</label>
      <span aria-hidden>{shown}</span>
      <Chevron />
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  );
  if (!reserve) return control;
  // The control and invisible copies at the reserved labels share one grid
  // cell, so the cell is the widest of them and the control sits at its end.
  return (
    <span className="inline-grid justify-items-end">
      {reserve.map(r => (
        <span key={r} aria-hidden className="invisible col-start-1 row-start-1 inline-flex items-center gap-[6px] type-small">
          <span>{prefix}</span><span>{r}</span><Chevron />
        </span>
      ))}
      <span className="col-start-1 row-start-1 inline-flex">{control}</span>
    </span>
  );
}

export function ShopFrame({
  locale,
  routes,
  categories,
  strings,
  children,
}: {
  locale: 'en' | 'no';
  /** Pathname -> header and refine options, from shopRoutes() on the server. */
  routes: Record<string, ShopRoute>;
  /** Catalogue categories, sorted, for the category options. */
  categories: string[];
  strings: ProductsGridStrings;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const route = routes[pathname];
  const p1 = locale === 'no' ? '/no' : '';
  const isProducts = pathname === `${p1}/products`;

  // All default to "no filter" so the prerendered HTML is the full catalogue;
  // QuerySync overrides them on hydration when the URL asks for a legacy
  // /products?category= deep link or a ?q= search.
  const [urlQuery, setUrlQuery] = useState({ category: 'All', q: '' });
  const onQuery = useCallback((v: { category: string; q: string }) => {
    setUrlQuery(prev => (prev.category === v.category && prev.q === v.q ? prev : v));
  }, []);
  const query = isProducts ? urlQuery.q : '';
  const category = isProducts && !query ? urlQuery.category : 'All';

  // Refine state belongs to the page it was chosen on. Keyed by pathname
  // rather than reset in an effect, so the new page's first render is already
  // unfiltered (an effect would paint one frame of the old filter first).
  const [refine, setRefine] = useState<{ path: string; artist: string; size: string; sort: ShopSort | '' }>(
    { path: pathname, artist: '', size: '', sort: '' },
  );
  const own = refine.path === pathname ? refine : { path: pathname, artist: '', size: '', sort: '' as const };
  const defaultSort: ShopSort = route?.curated ? 'featured' : 'name';
  const sort = own.sort || defaultSort;
  const setRefineField = (field: 'artist' | 'size' | 'sort', value: string) =>
    setRefine({ ...own, [field]: value });

  // The option clicked, shown as chosen from the click rather than when the
  // new page arrives, so its hairline starts growing at once. Keyed by the
  // page it was clicked on: once the URL changes (or Back is pressed) the
  // real selection takes over again, with no effect to reset it.
  const here = `${pathname}|${urlQuery.category}|${urlQuery.q}`;
  const [clicked, setClicked] = useState<{ from: string; href: string } | null>(null);
  const pendingHref = clicked?.from === here ? clicked.href : null;
  const choose = (href: string) => (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    setClicked({ from: here, href });
  };

  // Hold the Filter bar where it was on screen across a filter click. Every
  // header is reserved the same height, so this normally finds nothing to
  // correct; it is the backstop for copy that outgrows the reservation. It
  // only applies once the visitor has scrolled: at the very top the header is
  // in full view, and letting it grow downwards is the honest thing to show.
  const barRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<number | null>(null);
  const holdBar = () => {
    anchor.current = window.scrollY > 0 ? barRef.current?.getBoundingClientRect().top ?? null : null;
  };
  useLayoutEffect(() => {
    const before = anchor.current;
    anchor.current = null;
    if (before === null || !barRef.current) return;
    const delta = barRef.current.getBoundingClientRect().top - before;
    if (Math.abs(delta) > 1) window.scrollBy(0, delta);
  }, [pathname]);

  // A URL this frame has no entry for (an unknown slug on its way to the 404)
  // gets the page alone, without a Filter bar pointing at nothing.
  if (!route) return <>{children}</>;

  const t = strings;
  // Every option reserves the hairline's space and carries its own
  // .option-mark, so the old line shrinks away and the new one grows in.
  const optionCls = `relative flex items-center ${OPTION_PAD} type-small transition-colors`;
  const idle = `${optionCls} text-ink/55 hover:text-brand`;
  const allHref = `${p1}/products`;
  const allSelected = pendingHref ? pendingHref === allHref : isProducts && !query && category === 'All';

  const options = [
    ...categories.map(cat => {
      const landing = getCategoryLandingByCategory(cat);
      // Category options link to the /category/<slug> landing pages (so they're
      // crawlable and get their own SEO), falling back to the in-page filter
      // only if a category has no landing page yet.
      const href = landing ? `${p1}/category/${landing.slug}` : `${p1}/products?category=${encodeURIComponent(cat)}`;
      const selected = landing ? pathname === `${p1}/category/${landing.slug}` || (isProducts && category === cat) : isProducts && category === cat;
      return { key: cat, href, label: t.categoryLabels?.[cat] ?? cat, selected: pendingHref ? pendingHref === href : selected, event: { type: 'category', value: cat } };
    }),
    // Curated collection landings (subjects, then rooms) alongside the
    // categories, so each has a crawlable internal link from every page here.
    ...collections.map(col => ({
      key: col.slug,
      href: `${p1}/collection/${col.slug}`,
      label: t.collectionChips?.[col.slug] ?? col.chipLabel,
      selected: pendingHref ? pendingHref === `${p1}/collection/${col.slug}` : pathname === `${p1}/collection/${col.slug}`,
      event: { type: col.axis, value: col.slug },
    })),
  ];

  const linkProps = { scroll: false, transitionTypes: [SHOP_TRANSITION] };

  return (
    <div className="page-x pb-section">
      <Suspense fallback={null}>
        <QuerySync onChange={onQuery} />
      </Suspense>

      {/* The header's reserved height (shop-frame.css) keeps the bar
          at one position on every page in the frame. */}
      <div className="shop-header" data-locale={locale}>
        <ViewTransition
          key={pathname}
          enter={{ [SHOP_TRANSITION]: 'shop-fade-in', default: 'none' }}
          exit={{ [SHOP_TRANSITION]: 'shop-fade-out', default: 'none' }}
          default="none"
        >
          <div>{route.header}</div>
        </ViewTransition>
      </div>

      <div ref={barRef} className="mt-6 tab:mt-band desk:mt-[128px]">
        <div className="flex flex-col gap-3 border-t border-ink pt-4 tab:pt-6 desk:flex-row desk:items-start desk:justify-between desk:gap-8">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 tab:gap-x-6">
            <li>
              <Link
                href={allHref}
                {...linkProps}
                onClick={e => { holdBar(); choose(allHref)(e); }}
                aria-current={allSelected ? 'page' : undefined}
                className={allSelected ? optionCls : idle}
              >
                <span aria-hidden className="option-mark" />
                <span>{t.allChip}</span>
              </Link>
            </li>
            {options.map(o => (
              <li key={o.key}>
                <Link
                  href={o.href}
                  {...linkProps}
                  onClick={e => { holdBar(); choose(o.href)(e); track('products-filter-click', o.event); }}
                  aria-current={o.selected ? 'page' : undefined}
                  className={o.selected ? optionCls : idle}
                >
                  <span aria-hidden className="option-mark" />
                  <span>{o.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 flex-wrap items-center gap-6 tab:gap-8">
            <Refine
              id="filter-artist"
              label={t.artistFilterLabel}
              value={own.artist}
              onChange={v => setRefineField('artist', v)}
              options={[{ value: '', label: t.artistAll }, ...route.artists.map(a => ({ value: a, label: a }))]}
            />
            <Refine
              id="filter-size"
              label={t.sizeFilterLabel}
              value={own.size}
              onChange={v => setRefineField('size', v)}
              options={[{ value: '', label: t.sizeAll }, ...route.sizes.map(s => ({ value: s, label: sizeLabel(s) }))]}
            />
            <Refine
              id="sort-products"
              label={t.sortLabel}
              prefix={t.sortPrefix}
              // "Sort: Featured" on a landing and "Sort: Name" on /products
              // differ in width; without this, Artist and Size would shift
              // sideways on every click between them.
              reserve={[t.sortFeatured, t.sortName]}
              value={sort}
              onChange={v => setRefineField('sort', v)}
              options={[
                ...(route.curated ? [{ value: 'featured', label: t.sortFeatured }] : []),
                { value: 'name', label: t.sortName },
                { value: 'price-low', label: t.sortPriceLow },
                { value: 'price-high', label: t.sortPriceHigh },
              ]}
            />
          </div>
        </div>
      </div>

      <ShopContext.Provider value={{ locale, strings, query, category, artist: own.artist, size: own.size, sort }}>
        {children}
      </ShopContext.Provider>
    </div>
  );
}
