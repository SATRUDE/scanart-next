'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { track } from '@/lib/analytics';
import { getLowestProductPrices } from '@/lib/pricing';
import { shouldTrackSiteSearch } from '@/lib/site-search-signal';
import { getArtistById } from '@/data/artists';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { sizeLabel } from '@/components/PrintCard';
import { Hairline } from '@/components/v2/ui';
import { PrintGrid } from '@/components/v2/prints/PrintGrid';
import type { Product } from '@/contexts/CartContext';
import type { ProductsGridStrings } from '@/lib/i18n';

const EN: ProductsGridStrings = {
  heading: 'Nordic & Scandinavian Art Prints',
  searchPrefix: 'Search',
  printsSuffix: 'prints',
  allChip: 'All prints',
  sortLabel: 'Sort products',
  sortName: 'Name',
  sortPriceLow: 'Price: Low to High',
  sortPriceHigh: 'Price: High to Low',
  outOfStock: 'Out of stock',
  emptyHeading: 'No products found',
  emptyCta: 'View all products',
  printsSrHeading: 'Prints',
  artistAll: 'Artist',
  artistFilterLabel: 'Filter by artist',
  sizeAll: 'Size',
  sizeFilterLabel: 'Filter by size',
  sortPrefix: 'Sort:',
  clearSearch: 'Clear search',
};

/**
 * Lifts the URL query (`?category=`, `?q=`) into the listing's filter state.
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
const ProductsQuerySync: React.FC<{
  onCategory: (value: string) => void;
  onQuery: (value: string) => void;
}> = ({ onCategory, onQuery }) => {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'All';
  const query = searchParams.get('q') || '';

  useEffect(() => {
    onCategory(category);
  }, [category, onCategory]);

  useEffect(() => {
    onQuery(query);
  }, [query, onQuery]);

  return null;
};

const artistOf = (p: Product) => (p.artistId ? getArtistById(p.artistId)?.name || p.artist || p.brand : p.artist || p.brand);

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
function Refine({ id, label, prefix, value, options, onChange }: {
  id: string;
  /** Accessible name when there is no visible prefix. */
  label: string;
  /** Visible before the value, which then names the control: "Sort: Name". */
  prefix?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const shown = options.find(o => o.value === value)?.label ?? options[0]?.label;
  return (
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
}

/**
 * The /products listing (Figma: Prints · desktop 153:241, Filter bar 241:3763):
 * the filter bar under a rule, then the continuous three-column grid.
 *
 * The category and collection filters are real <a> links to their landings
 * (docs/v2-seo.md, "/products filters"), so every landing has a crawlable link
 * from this page. Artist, Size and Sort refine the grid in place.
 */
export function PrintsListing({
  products,
  categories,
  locale = 'en',
  strings,
}: {
  products: Product[];
  categories: string[];
  /** Keeps every link inside the tree the listing is rendered in. */
  locale?: 'en' | 'no';
  /** Localised labels; defaults to the English strings above. */
  strings?: ProductsGridStrings;
}) {
  const t = strings ?? EN;
  const p1 = locale === 'no' ? '/no' : '';
  // All default to "no filter" so the prerendered HTML is the full catalogue;
  // ProductsQuerySync overrides them on hydration when the URL asks for a
  // legacy /products?category= deep link or a ?q= search.
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [artist, setArtist] = useState('');
  const [size, setSize] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const artists = useMemo(() => [...new Set(products.map(artistOf))].filter(Boolean).sort(), [products]);
  const sizes = useMemo(() => [...new Set(products.flatMap(p => Object.keys(p.prices)))].sort(), [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // Match the artist through the same `artist || brand` fallback the rest of
      // the codebase uses (product page, product feed, HeroSection): `brand` is
      // empty on every product in the exported catalogue, so matching it alone
      // meant an artist-name search found nothing while the card below still
      // displayed that artist's name.
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.artist || p.brand).toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    } else if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (artist) filtered = filtered.filter(p => artistOf(p) === artist);
    if (size) filtered = filtered.filter(p => size in p.prices);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-low') return (getLowestProductPrices(a).GBP || 0) - (getLowestProductPrices(b).GBP || 0);
      if (sortBy === 'price-high') return (getLowestProductPrices(b).GBP || 0) - (getLowestProductPrices(a).GBP || 0);
      return 0;
    });
  }, [products, selectedCategory, sortBy, searchQuery, artist, size]);

  // Each submitted search is a visitor stating demand in their own words, the
  // on-site twin of the GSC query report; results: 0 is a catalogue-gap signal.
  // The ref fires one event per query so re-sorts don't re-count the search.
  //
  // A search against an empty catalogue is not recorded at all: it would report
  // results: 0 and read as a gap when the truth is that there was nothing to
  // search. See lib/site-search-signal.ts for the case that prompted this.
  const resultCount = filteredProducts.length;
  const lastTrackedQuery = React.useRef('');
  useEffect(() => {
    if (!shouldTrackSiteSearch(searchQuery, products.length)) return;
    if (lastTrackedQuery.current === searchQuery) return;
    lastTrackedQuery.current = searchQuery;
    track('site-search', { query: searchQuery, results: resultCount });
  }, [searchQuery, resultCount, products.length]);

  const allSelected = !searchQuery && selectedCategory === 'All';
  const optionCls = 'flex items-center gap-tight type-small transition-colors';
  const idle = `${optionCls} text-ink/55 hover:text-brand`;

  const options = [
    ...categories.map(cat => {
      const landing = getCategoryLandingByCategory(cat);
      // Category options link to the /category/<slug> landing pages (so they're
      // crawlable and get their own SEO), falling back to the in-page filter
      // only if a category has no landing page yet.
      const href = landing ? `${p1}/category/${landing.slug}` : `${p1}/products?category=${encodeURIComponent(cat)}`;
      return { key: cat, href, label: t.categoryLabels?.[cat] ?? cat, selected: !searchQuery && selectedCategory === cat, event: { type: 'category', value: cat } };
    }),
    // Curated collection landings (subjects, then rooms) alongside the
    // categories, so each has a crawlable internal link from this indexed page.
    ...collections.map(col => ({
      key: col.slug,
      href: `${p1}/collection/${col.slug}`,
      label: t.collectionChips?.[col.slug] ?? col.chipLabel,
      selected: false,
      event: { type: col.axis, value: col.slug },
    })),
  ];

  return (
    <div>
      <Suspense fallback={null}>
        <ProductsQuerySync onCategory={setSelectedCategory} onQuery={setSearchQuery} />
      </Suspense>

      <div className="flex flex-col gap-3 border-t border-ink pt-4 tab:pt-6 desk:flex-row desk:items-start desk:justify-between desk:gap-8">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 tab:gap-x-6">
          <li>
            <Link href={`${p1}/products`} aria-current={allSelected ? 'page' : undefined} className={allSelected ? optionCls : idle}>
              {allSelected && <Hairline />}
              <span>{t.allChip}</span>
            </Link>
          </li>
          {options.map(o => (
            <li key={o.key}>
              <Link href={o.href} onClick={() => track('products-filter-click', o.event)} className={o.selected ? optionCls : idle}>
                {o.selected && <Hairline />}
                <span>{o.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 flex-wrap items-center gap-6 tab:gap-8">
          <Refine
            id="filter-artist"
            label={t.artistFilterLabel}
            value={artist}
            onChange={setArtist}
            options={[{ value: '', label: t.artistAll }, ...artists.map(a => ({ value: a, label: a }))]}
          />
          <Refine
            id="filter-size"
            label={t.sizeFilterLabel}
            value={size}
            onChange={setSize}
            options={[{ value: '', label: t.sizeAll }, ...sizes.map(s => ({ value: s, label: sizeLabel(s) }))]}
          />
          <Refine
            id="sort-products"
            label={t.sortLabel}
            prefix={t.sortPrefix}
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'name', label: t.sortName },
              { value: 'price-low', label: t.sortPriceLow },
              { value: 'price-high', label: t.sortPriceHigh },
            ]}
          />
        </div>
      </div>

      {searchQuery && (
        <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 type-small" role="status">
          <span className="inline-flex items-center gap-[6px]">
            <span>{t.searchPrefix}: “{searchQuery}”</span>
            <Hairline />
            <span>{resultCount} {t.printsSuffix}</span>
          </span>
          <Link href={`${p1}/products`} className="transition-colors hover:text-brand">{t.clearSearch}</Link>
        </p>
      )}

      <section aria-labelledby="prints-heading" className="mt-6 desk:mt-band">
        <h2 id="prints-heading" className="sr-only-sa">{t.printsSrHeading}</h2>
        <PrintGrid products={filteredProducts} locale={locale} outOfStockLabel={t.outOfStock} />
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-start gap-4 py-band">
            <p className="type-h3">{t.emptyHeading}</p>
            <Link href={`${p1}/products`} className="type-small transition-colors hover:text-brand">{t.emptyCta} →</Link>
          </div>
        )}
      </section>
    </div>
  );
}
