'use client';
/// <reference types="react/canary" />

import React, { ViewTransition, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { shouldTrackSiteSearch } from '@/lib/site-search-signal';
import { Hairline } from '@/components/v2/ui';
import { PrintGrid } from '@/components/v2/prints/PrintGrid';
import { SHOP_TRANSITION, useShop } from '@/components/v2/shop/ShopFrame';
import { refineProducts } from '@/components/v2/shop/shop-filters';
import type { Product } from '@/contexts/CartContext';

/**
 * A shop page's grid, under the Filter bar that ShopFrame keeps mounted. The
 * page hands over its own prints (the full catalogue, a category, or a
 * collection in its curated order) and this applies the bar's Artist, Size and
 * Sort, plus a /products ?q= search.
 *
 * Rendered by the page, not the frame, so every URL's grid is in its own
 * served HTML. It re-mounts on each filter click, which is what lets the
 * <ViewTransition> below crossfade the old grid out and the new one in.
 */
export function ShopGrid({ products }: { products: Product[] }) {
  const { locale, strings: t, query, category, artist, size, sort } = useShop();
  const p1 = locale === 'no' ? '/no' : '';

  const filtered = useMemo(
    () => refineProducts(products, { query, category, artist, size, sort }),
    [products, query, category, artist, size, sort],
  );

  // Each submitted search is a visitor stating demand in their own words, the
  // on-site twin of the GSC query report; results: 0 is a catalogue-gap signal.
  // The ref fires one event per query so re-sorts don't re-count the search.
  //
  // A search against an empty catalogue is not recorded at all: it would report
  // results: 0 and read as a gap when the truth is that there was nothing to
  // search. See lib/site-search-signal.ts for the case that prompted this.
  const resultCount = filtered.length;
  const lastTrackedQuery = useRef('');
  useEffect(() => {
    if (!shouldTrackSiteSearch(query, products.length)) return;
    if (lastTrackedQuery.current === query) return;
    lastTrackedQuery.current = query;
    track('site-search', { query, results: resultCount });
  }, [query, resultCount, products.length]);

  return (
    <ViewTransition
      enter={{ [SHOP_TRANSITION]: 'shop-fade-in', default: 'none' }}
      exit={{ [SHOP_TRANSITION]: 'shop-fade-out', default: 'none' }}
      default="none"
    >
      <div>
        {query && (
          <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 type-small" role="status">
            <span className="inline-flex items-center gap-[6px]">
              <span>{t.searchPrefix}: “{query}”</span>
              <Hairline />
              <span>{resultCount} {t.printsSuffix}</span>
            </span>
            <Link href={`${p1}/products`} className="transition-colors hover:text-brand">{t.clearSearch}</Link>
          </p>
        )}

        <section aria-labelledby="prints-heading" className="mt-6 desk:mt-band">
          {/* sr-only, keeping the order h1 -> h2 -> card h3 */}
          <h2 id="prints-heading" className="sr-only-sa">{t.printsSrHeading}</h2>
          <PrintGrid products={filtered} locale={locale} outOfStockLabel={t.outOfStock} />
          {filtered.length === 0 && (
            <div className="flex flex-col items-start gap-4 py-band">
              <p className="type-h3">{t.emptyHeading}</p>
              <Link href={`${p1}/products`} className="type-small transition-colors hover:text-brand">{t.emptyCta} →</Link>
            </div>
          )}
        </section>
      </div>
    </ViewTransition>
  );
}
