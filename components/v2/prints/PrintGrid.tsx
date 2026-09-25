import Link from 'next/link';
import { PrintCard } from '@/components/PrintCard';
import { splitIntoColumns, tileHeightRatio } from '@/lib/print-columns';
import type { Product } from '@/contexts/CartContext';

/**
 * The V2 print grid (Figma: Grid · 3 columns in Prints · desktop 153:241).
 * Three continuous columns from tab up, tiles 64 apart with no row gaps; one
 * column on mobile, 40 apart. The split is contiguous (lib/print-columns.ts), so
 * the DOM stays in list order and mobile, keyboard and screen reader all read
 * the same sequence as the ItemList.
 *
 * No 'use client': it has no state of its own, so the landing pages render it on
 * the server and the /products listing renders it inside its client filter.
 */
export function PrintGrid({
  products,
  locale = 'en',
  outOfStockLabel,
  headingLevel = 'h3',
  className = '',
}: {
  products: Product[];
  locale?: 'en' | 'no';
  outOfStockLabel?: string;
  /** Card titles are h3 under the grid's h2 (docs/v2-seo.md, "Grid headings"). */
  headingLevel?: 'h2' | 'h3';
  className?: string;
}) {
  const prefix = locale === 'no' ? '/no' : '';
  const indexed = products.map((product, index) => ({ product, index }));
  const columns = splitIntoColumns(indexed, ({ product }) => tileHeightRatio(Object.keys(product.prices)[0]));
  // The first four cards in list order are preloaded (the contract's rule, and
  // the whole first screen on mobile). The top of each desktop column is too:
  // with a contiguous split those are what fills the first desktop screen.
  const columnTops = new Set(columns.map(c => c[0]?.index));

  return (
    <div className={`flex flex-col gap-10 tab:flex-row tab:items-start tab:gap-gutter ${className}`}>
      {columns.map((column, c) => (
        <div key={c} className="flex min-w-0 flex-1 flex-col gap-10 desk:gap-block">
          {column.map(({ product, index }) => (
            <div key={product.id}>
              <Link href={`${prefix}/product/${product.slug}`} className="block">
                <PrintCard
                  product={product}
                  locale={locale}
                  priority={index < 4 || columnTops.has(index)}
                  headingLevel={headingLevel}
                  sizes="(max-width: 833px) 100vw, (max-width: 1440px) 30vw, 405px"
                  {...(outOfStockLabel ? { outOfStockLabel } : {})}
                />
              </Link>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
