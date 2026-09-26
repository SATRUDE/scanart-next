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
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
/**
 * Artist, Size and Sort: a quiet trigger ("Artist ⌄") that opens a panel in
 * the language picker's style (square, 1 px line, no shadow, the chosen row
 * on the surface grey), not the browser's own menu. Radix gives it the menu
 * semantics: arrow keys, type-ahead, Escape, focus back on the trigger.
 */
function Refine({ id, label, prefix, heading, value, options, onChange, reserve }: {
  id: string;
  /** Accessible name when there is no visible prefix. */
  label: string;
  /** Visible before the value, which then names the control: "Sort: Name". */
  prefix?: string;
  /** The panel's small heading, as the language picker has. */
  heading: string;
  value: string;
  /** `menuLabel` replaces the label inside the open panel ("All artists" for the trigger's "Artist"). */
  options: { value: string; label: string; menuLabel?: string }[];
  onChange: (v: string) => void;
  /** Labels to hold room for, so the control keeps one width across pages whose defaults differ. */
  reserve?: string[];
}) {
  const shown = options.find(o => o.value === value)?.label ?? options[0]?.label;
  const control = (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        id={id}
        aria-label={prefix ? undefined : `${label}: ${shown}`}
        className="group/refine inline-flex items-center gap-[6px] type-small transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[state=open]:text-brand"
      >
        {prefix && <span>{prefix}</span>}
        <span>{shown}</span>
        <span className="transition-transform duration-200 group-data-[state=open]/refine:rotate-180 motion-reduce:transition-none">
          <Chevron />
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 min-w-48 border border-line bg-bg p-3 text-ink outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-1 motion-reduce:animate-none"
        >
          <DropdownMenu.Label className="mb-2 type-caption">{heading}</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={value} onValueChange={onChange} className="space-y-0.5">
            {options.map(o => (
              <DropdownMenu.RadioItem
                key={o.value}
                value={o.value}
                className="block cursor-pointer px-2 py-1.5 type-small outline-hidden data-highlighted:bg-surface data-[state=checked]:bg-surface"
              >
                {o.menuLabel ?? o.label}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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

  // The options stay on one line. Whatever doesn't fit folds behind "More",
  // which opens the full, wrapping list. Every option is still in the HTML
  // (the folded ones are display: none), so each landing keeps its crawlable
  // link. Widths come from an invisible copy of the row that always shows
  // every option, so folding never changes what is measured.
  const listRef = useRef<HTMLUListElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const [widths, setWidths] = useState<{ avail: number; gap: number; items: number[]; more: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  useLayoutEffect(() => {
    const list = listRef.current;
    const measure = measureRef.current;
    if (!list || !measure) return;
    const read = () => {
      const lis = [...measure.children] as HTMLElement[];
      const more = lis.pop()!;
      setWidths({
        avail: list.clientWidth,
        gap: parseFloat(getComputedStyle(measure).columnGap) || 0,
        items: lis.map(li => li.getBoundingClientRect().width),
        more: more.getBoundingClientRect().width,
      });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(list);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [locale]);

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

  // Which options show on the folded line: All and the chosen one always,
  // then the rest in order while they fit beside the More button. Index 0 is All.
  const selectedIndex = allSelected ? 0 : options.findIndex(o => o.selected) + 1;
  const shown = new Set<number>(options.map((_, i) => i + 1).concat(0));
  let folding = false;
  if (widths && !expanded && widths.items.length === options.length + 1) {
    const { avail, gap, items, more } = widths;
    const total = items.reduce((a, w) => a + w, 0) + gap * (items.length - 1);
    if (total > avail + 0.5) {
      folding = true;
      shown.clear();
      const must = [0, ...(selectedIndex > 0 ? [selectedIndex] : [])];
      let used = more + must.reduce((a, i) => a + items[i] + gap, 0);
      must.forEach(i => shown.add(i));
      for (let i = 1; i < items.length; i++) {
        if (shown.has(i)) continue;
        if (used + items[i] + gap > avail) break;
        used += items[i] + gap;
        shown.add(i);
      }
    }
  } else if (widths && expanded) {
    const { avail, gap, items } = widths;
    folding = items.reduce((a, w) => a + w, 0) + gap * (items.length - 1) > avail + 0.5;
  }
  const hiddenCount = options.length + 1 - shown.size;

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
        <div className="relative flex flex-col gap-3 border-t border-ink pt-4 tab:pt-6 desk:flex-row desk:items-start desk:justify-between desk:gap-8">
          <ul
            ref={listRef}
            id="shop-filter-options"
            className={`flex min-w-0 items-center desk:flex-1 gap-x-5 gap-y-2 tab:gap-x-6 ${expanded || !folding ? 'flex-wrap' : 'flex-nowrap overflow-hidden'}`}
          >
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
            {options.map((o, i) => (
              <li key={o.key} className={shown.has(i + 1) ? undefined : 'hidden'}>
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
            {folding && (
              <li>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls="shop-filter-options"
                  onClick={() => setExpanded(v => !v)}
                  className={idle}
                >
                  <span>{expanded ? t.lessFilters : `${t.moreFilters} (${hiddenCount})`}</span>
                </button>
              </li>
            )}
          </ul>
          {/* The measuring copy: every option at its real size, never seen or read. */}
          <div aria-hidden inert className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden">
          <ul ref={measureRef} className="flex w-max items-center gap-x-5 tab:gap-x-6">
            {[t.allChip, ...options.map(o => o.label)].map(label => (
              <li key={label} className={optionCls}>
                <span>{label}</span>
              </li>
            ))}
            <li className={optionCls}>
              <span>{`${t.moreFilters} (${options.length})`}</span>
            </li>
          </ul>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-6 tab:gap-8">
            <Refine
              id="filter-artist"
              label={t.artistFilterLabel}
              value={own.artist}
              onChange={v => setRefineField('artist', v)}
              heading={t.artistAll}
              options={[{ value: '', label: t.artistAll, menuLabel: t.artistAny }, ...route.artists.map(a => ({ value: a, label: a }))]}
            />
            <Refine
              id="filter-size"
              label={t.sizeFilterLabel}
              value={own.size}
              onChange={v => setRefineField('size', v)}
              heading={t.sizeAll}
              options={[{ value: '', label: t.sizeAll, menuLabel: t.sizeAny }, ...route.sizes.map(s => ({ value: s, label: sizeLabel(s) }))]}
            />
            <Refine
              id="sort-products"
              label={t.sortLabel}
              prefix={t.sortPrefix}
              heading={t.sortPrefix.replace(/:$/, '')}
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
