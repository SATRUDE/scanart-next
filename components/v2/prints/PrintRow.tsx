import { TrackedLink } from '@/components/TrackedLink';
import { PrintCard } from '@/components/PrintCard';
import type { Product } from '@/contexts/CartContext';

/**
 * A single row of print cards, each linking to its product page. On phones one
 * row that runs off the right edge, two columns on tablet, three on desktop,
 * top edges aligned and each print at its own ratio.
 *
 * The product page uses it twice: the prints under Add to basket and "More
 * prints like this" further down, with the same cards at the same size (Mark,
 * 18 Nov 2026: "more like this part so it's not so tiny").
 *
 * `fit` is the width the row sits in:
 * - `page` (the default): the full content width, as described above.
 * - `column`: a narrow column such as the buying panel (half the page on
 *   tablet, four columns on desktop). A grid there would squeeze the cards,
 *   so it stays the phone's scrolling row of 240 px cards at every width,
 *   ending on the column's edge from tablet up.
 *
 * No 'use client': it has no state, so it renders on the server.
 */
export function PrintRow({
  products,
  from,
  locale = 'en',
  placement,
  fit = 'page',
  outOfStockLabel,
  className = '',
}: {
  products: Product[];
  /** The slug of the page the row sits on, for the click event. */
  from: string;
  locale?: 'en' | 'no';
  /** Added to the click event when a page has more than one row. */
  placement?: string;
  fit?: 'page' | 'column';
  outOfStockLabel?: string;
  className?: string;
}) {
  const prefix = locale === 'no' ? '/no' : '';
  const page = fit === 'page';
  return (
    <ul
      className={`-mr-margin flex gap-3 overflow-x-auto scrollbar-hide tab:mr-0 ${
        page ? 'tab:grid tab:grid-cols-2 tab:gap-x-gutter tab:gap-y-band tab:overflow-visible desk:grid-cols-3' : ''
      } ${className}`}
    >
      {products.map(p => (
        <li key={p.id} className={`w-[240px] shrink-0 ${page ? 'tab:w-auto' : ''}`}>
          <TrackedLink
            event="related-product-click"
            eventData={placement ? { from, to: p.slug, placement } : { from, to: p.slug }}
            href={`${prefix}/product/${p.slug}`}
          >
            <PrintCard
              product={p}
              locale={locale}
              sizes={page ? '(max-width: 833px) 240px, (max-width: 1199px) 50vw, 405px' : '240px'}
              {...(outOfStockLabel ? { outOfStockLabel } : {})}
            />
          </TrackedLink>
        </li>
      ))}
    </ul>
  );
}
