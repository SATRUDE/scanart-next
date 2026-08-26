'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLowestProductPrices } from '@/lib/pricing';
import { SmartImage } from '@/components/SmartImage';
import { printImageAlt } from '@/lib/product-image-alt';
import { getArtistById } from '@/data/artists';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { Product } from '@/contexts/CartContext';
import type { ProductsGridStrings } from '@/lib/i18n';

const EN: ProductsGridStrings = {
  heading: 'Nordic & Scandinavian Art Prints',
  searchPrefix: 'Search',
  printsSuffix: 'prints',
  allChip: 'All',
  sortLabel: 'Sort products',
  sortName: 'Name',
  sortPriceLow: 'Price: Low to High',
  sortPriceHigh: 'Price: High to Low',
  outOfStock: 'Out of stock',
  emptyHeading: 'No products found',
  emptyCta: 'View all products',
};

interface ProductsGridProps {
  products: Product[];
  categories: string[];
  /** Keeps every link inside the tree the grid is rendered in. */
  locale?: 'en' | 'no';
  /** Localised labels; defaults to the English strings above. */
  strings?: ProductsGridStrings;
}

/**
 * Lifts the URL query (`?category=`, `?q=`) into the grid's filter state.
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

export const ProductsGrid: React.FC<ProductsGridProps> = ({
  products,
  categories,
  locale = 'en',
  strings,
}) => {
  const t = strings ?? EN;
  const p1 = locale === 'no' ? '/no' : '';
  // Both default to "no filter" so the prerendered HTML is the full catalogue;
  // ProductsQuerySync below overrides them on hydration when the URL asks for
  // a legacy /products?category= deep link or a ?q= search.
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const { formatPrice } = useLanguage();

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

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-low') {
        const aPrice = getLowestProductPrices(a).GBP || 0;
        const bPrice = getLowestProductPrices(b).GBP || 0;
        return aPrice - bPrice;
      }
      if (sortBy === 'price-high') {
        const aPrice = getLowestProductPrices(a).GBP || 0;
        const bPrice = getLowestProductPrices(b).GBP || 0;
        return bPrice - aPrice;
      }
      return 0;
    });
  }, [products, selectedCategory, sortBy, searchQuery]);

  // Each submitted search is a visitor stating demand in their own words, the
  // on-site twin of the GSC query report; results: 0 is a catalogue-gap signal.
  // The ref fires one event per query so re-sorts don't re-count the search.
  const resultCount = filteredProducts.length;
  const lastTrackedQuery = React.useRef('');
  useEffect(() => {
    if (!searchQuery || lastTrackedQuery.current === searchQuery) return;
    lastTrackedQuery.current = searchQuery;
    track('site-search', { query: searchQuery, results: resultCount });
  }, [searchQuery, resultCount]);

  return (
    <div>
      <Suspense fallback={null}>
        <ProductsQuerySync onCategory={setSelectedCategory} onQuery={setSearchQuery} />
      </Suspense>
      <div className="container mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">
            {searchQuery ? `${t.searchPrefix}: "${searchQuery}"` : t.heading}
          </h1>
          <p className="text-muted-foreground">{filteredProducts.length} {t.printsSuffix}</p>
        </div>

        {!searchQuery && (
          <div className="flex flex-wrap gap-2 mb-8">
            {['All', ...categories].map(cat => {
              const landing = cat === 'All' ? null : getCategoryLandingByCategory(cat);
              // Category chips link to the /category/<slug> landing pages (so they're
              // crawlable and get their own SEO), falling back to the in-page filter
              // only if a category has no landing page yet.
              const href = cat === 'All'
                ? `${p1}/products`
                : landing ? `${p1}/category/${landing.slug}` : `${p1}/products?category=${encodeURIComponent(cat)}`;
              return (
                <Link
                  key={cat}
                  href={href}
                  onClick={() => track('products-filter-click', { type: 'category', value: cat })}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-neutral-700 hover:bg-muted/80'
                  }`}
                >
                  {cat === 'All' ? t.allChip : t.categoryLabels?.[cat] ?? cat}
                </Link>
              );
            })}
            {/* Curated collection landings (by room) alongside the category chips,
                so each has a crawlable internal link from this indexed page. */}
            {collections.map(col => (
              <Link
                key={col.slug}
                href={`${p1}/collection/${col.slug}`}
                onClick={() => track('products-filter-click', { type: col.axis, value: col.slug })}
                className="px-4 py-2 rounded-full text-sm transition-colors bg-muted text-neutral-700 hover:bg-muted/80"
              >
                {t.collectionChips?.[col.slug] ?? col.chipLabel}
              </Link>
            ))}
          </div>
        )}

        <div className="flex justify-end mb-6">
          <label htmlFor="sort-products" className="sr-only">{t.sortLabel}</label>
          <select
            id="sort-products"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border rounded px-3 py-1.5"
          >
            <option value="name">{t.sortName}</option>
            <option value="price-low">{t.sortPriceLow}</option>
            <option value="price-high">{t.sortPriceHigh}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <Link key={product.id} href={`${p1}/product/${product.slug}`} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-neutral-50 mb-4 rounded">
                <SmartImage
                  src={product.image}
                  alt={printImageAlt(product, locale)}
                  priority={index < 4}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{product.artistId ? getArtistById(product.artistId)?.name || product.brand : product.brand}</span>
                  <span>&bull;</span>
                  <span>{t.categoryLabels?.[product.category] ?? product.category}</span>
                </div>
                <h2 className="text-sm text-neutral-900">{product.name}</h2>
                <p className="text-sm text-neutral-900">
                  {formatPrice(getLowestProductPrices(product))}
                </p>
                {!product.inStock && <p className="text-xs text-neutral-400">{t.outOfStock}</p>}
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">{t.emptyHeading}</p>
            <Link href={`${p1}/products`} className="text-primary hover:underline">{t.emptyCta}</Link>
          </div>
        )}
      </div>
    </div>
  );
};
