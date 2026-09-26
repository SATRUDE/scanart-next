import { no } from '@/lib/i18n/no';
import type { ProductsGridStrings } from '@/lib/i18n';

/** The Filter bar and grid labels in English. The Norwegian set is lib/i18n/no.ts's products.grid. */
const EN: ProductsGridStrings = {
  heading: 'Nordic & Scandinavian Art Prints',
  searchPrefix: 'Search',
  printsSuffix: 'prints',
  allChip: 'All prints',
  sortLabel: 'Sort products',
  sortFeatured: 'Featured',
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

export function shopStrings(locale: 'en' | 'no'): ProductsGridStrings {
  if (locale === 'en') return EN;
  return {
    ...no.products.grid,
    categoryLabels: no.shared.categoryLabels,
    collectionChips: no.shared.collectionChips,
  };
}
