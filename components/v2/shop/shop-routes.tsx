import React from 'react';
import { getAllProducts } from '@/lib/products';
import { categoryLandings } from '@/lib/categories';
import { collections, type Collection } from '@/lib/collections';
import { PageHeader } from '@/components/v2/ui';
import { FromPrice } from '@/components/v2/prints/FromPrice';
import { lowestPrices } from '@/components/v2/prints/lowest-prices';
import { LandingIntro } from '@/components/v2/landing/LandingIntro';
import { refineOptions } from '@/components/v2/shop/shop-filters';
import { no } from '@/lib/i18n/no';
import type { Product } from '@/contexts/CartContext';

/**
 * Everything the shop layout needs to know about each page it frames: /products
 * and every category and collection landing (Mark, 26 Sep 2026: the filter
 * options should feel like filtering one page while each keeps its own URL).
 *
 * The layout renders the page header above the Filter bar and the bar itself,
 * and neither re-mounts between these routes, so the header has to come from
 * here rather than from the page. Each header is still server-rendered, and on
 * a first load only the one for the requested URL is in the HTML as markup;
 * the rest travel in the RSC payload so a filter click can swap the header in
 * the same commit as the grid.
 */
export type ShopRoute = {
  header: React.ReactNode;
  artists: string[];
  sizes: string[];
  /** The page's own order is meaningful (a curated collection), so Sort starts on it. */
  curated: boolean;
};

/**
 * A collection's curated slug list resolved to products, in the configured
 * order, silently dropping any slug that no longer exists in the catalogue.
 * The collection pages and this map share it so the header count and the grid
 * cannot disagree.
 */
export function collectionProducts(collection: Collection, all: Product[]) {
  const bySlug = new Map(all.map(p => [p.slug, p]));
  return collection.productSlugs
    .map(s => bySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

/** The /products H1, unchanged from before V2 (the Figma frame says "Prints"). */
export const PRODUCTS_HEADING = 'Nordic & Scandinavian Art Prints';

export async function shopRoutes(locale: 'en' | 'no'): Promise<Record<string, ShopRoute>> {
  const isNo = locale === 'no';
  const p1 = isNo ? '/no' : '';
  const all = await getAllProducts();
  const fromLabel = isNo ? no.shared.fromPrice : 'from';
  const count = (n: number) =>
    isNo ? `${n} ${n === 1 ? no.shared.printOne : no.shared.printOther}` : `${n} ${n === 1 ? 'print' : 'prints'}`;

  const header = (title: string, lead: React.ReactNode, products: Product[]) => (
    <PageHeader
      title={title}
      locale={locale}
      lead={lead}
      meta={[count(products.length), <FromPrice key="from" prices={lowestPrices(products)} label={fromLabel} />]}
    />
  );
  const intro = (paragraphs: string[]) =>
    isNo
      ? <LandingIntro paragraphs={paragraphs} moreLabel={no.shared.readMore} lessLabel={no.shared.readLess} />
      : <LandingIntro paragraphs={paragraphs} />;

  const routes: Record<string, ShopRoute> = {};

  // /products. V2 gives it its own lead rather than the /nordic-art text the
  // Figma frame reuses, so the two pages don't compete for the same query
  // (docs/v2-seo.md, item 4).
  // Fixed copy with no artist count or country list (Mark, 2026-09-26: it
  // should not need updating each time an artist joins).
  const productsLead = isNo
    ? no.products.page.lead
    : 'Prints by independent artists from across the Nordics. Each one is made to order, framed or unframed, and delivered worldwide.';
  routes[`${p1}/products`] = {
    header: header(isNo ? no.products.grid.heading : PRODUCTS_HEADING, productsLead, all),
    ...refineOptions(all),
    curated: false,
  };

  for (const landing of categoryLandings) {
    const products = all.filter(p => p.category === landing.category);
    if (products.length === 0) continue;
    // Falls back to the English copy for a category added before its
    // translation, exactly as the Norwegian page does.
    const copy = isNo ? no.categories[landing.slug] ?? landing : landing;
    routes[`${p1}/category/${landing.slug}`] = {
      header: header(copy.heading, intro([copy.intro, copy.intro2]), products),
      ...refineOptions(products),
      curated: true,
    };
  }

  for (const collection of collections) {
    const products = collectionProducts(collection, all);
    if (products.length === 0) continue;
    const copy = isNo ? no.collections[collection.slug] ?? collection : collection;
    routes[`${p1}/collection/${collection.slug}`] = {
      header: header(copy.heading, intro([copy.intro, copy.intro2]), products),
      ...refineOptions(products),
      curated: true,
    };
  }

  return routes;
}
