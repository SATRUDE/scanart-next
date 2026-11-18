import { TrackedLink } from '@/components/TrackedLink';
import { PrintCard } from '@/components/PrintCard';
import type { Product } from '@/contexts/CartContext';

/**
 * A single row of print cards, each linking to its product page. One module,
 * two layouts:
 *
 * - `scroll` (the default): the product page's "More prints like this". On
 *   phones one row that runs off the right edge, two columns on tablet, three
 *   on desktop, top edges aligned and each print at its own ratio.
 * - `three`: exactly three across at every width, compact cards, for a narrow
 *   column such as the buying panel under Add to basket.
 *
 * No 'use client': it has no state, so it renders on the server.
 */
export function PrintRow({
  products,
  from,
  locale = 'en',
  layout = 'scroll',
  placement,
  outOfStockLabel,
  className = '',
}: {
  products: Product[];
  /** The slug of the page the row sits on, for the click event. */
  from: string;
  locale?: 'en' | 'no';
  layout?: 'scroll' | 'three';
  /** Added to the click event when a page has more than one row. */
  placement?: string;
  outOfStockLabel?: string;
  className?: string;
}) {
  const prefix = locale === 'no' ? '/no' : '';
  const three = layout === 'three';
  return (
    <ul
      className={
        three
          ? `grid grid-cols-3 gap-3 ${className}`
          : `-mr-margin flex gap-3 overflow-x-auto scrollbar-hide tab:mr-0 tab:grid tab:grid-cols-2 tab:gap-x-gutter tab:gap-y-band tab:overflow-visible desk:grid-cols-3 ${className}`
      }
    >
      {products.map(p => (
        <li key={p.id} className={three ? 'min-w-0' : 'w-[240px] shrink-0 tab:w-auto'}>
          <TrackedLink
            event="related-product-click"
            eventData={placement ? { from, to: p.slug, placement } : { from, to: p.slug }}
            href={`${prefix}/product/${p.slug}`}
          >
            <PrintCard
              product={p}
              locale={locale}
              variant={three ? 'compact' : 'default'}
              sizes={three ? '(max-width: 833px) 33vw, (max-width: 1199px) 17vw, 130px' : '(max-width: 833px) 240px, (max-width: 1199px) 50vw, 405px'}
              {...(outOfStockLabel ? { outOfStockLabel } : {})}
            />
          </TrackedLink>
        </li>
      ))}
    </ul>
  );
}
