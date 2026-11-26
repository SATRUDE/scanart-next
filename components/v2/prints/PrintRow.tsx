import { TrackedLink } from '@/components/TrackedLink';
import { PrintCard } from '@/components/PrintCard';
import type { Product } from '@/contexts/CartContext';

/**
 * A single row of print cards, each linking to its product page. On phones one
 * row that runs off the right edge, two columns on tablet, three on desktop,
 * top edges aligned and each print at its own ratio.
 *
 * The product page uses it twice: the related prints and "More prints like
 * this" further down, with the same cards at the same size (Mark, 18 Nov 2026:
 * "more like this part so it's not so tiny"). It always sits on the page's
 * content width: the related prints scroll in the buying panel on phones only
 * and move under the product as a full row from tablet up (Mark, 18 Nov 2026:
 * "on desktop it's broken and should be a full row"), so there is no narrow
 * column version any more.
 *
 * Where it scrolls it scrolls sideways only (Mark, 18 Nov 2026: "it can be
 * scrolled up and down instead of just left and right"). `overflow-x: auto`
 * alone turns `overflow-y` into `auto` too, so iOS Safari let the row be
 * dragged up and down, sliding the cards up inside it and leaving an empty
 * band under them. `overflow-y: hidden` closes that axis; the row is as tall
 * as its tallest card, so it hides nothing real. The link is a block, not
 * an inline box wrapped round the card, so the card alone sets each item's
 * height; the row snaps card by card on x only, and `overscroll-x-contain`
 * keeps a sideways fling from pulling the page or the browser's back swipe.
 * No touch override either: the page still scrolls vertically over the row.
 *
 * No 'use client': it has no state, so it renders on the server.
 */
export function PrintRow({
  products,
  from,
  locale = 'en',
  placement,
  match,
  outOfStockLabel,
  className = '',
}: {
  products: Product[];
  /** The slug of the page the row sits on, for the click event. */
  from: string;
  locale?: 'en' | 'no';
  /** Added to the click event when a page has more than one row. */
  placement?: string;
  /** Added to the click event per print: same-artist, similar or other-artist
   *  (lib/related-prints.ts), for the onward test. */
  match?: (p: Product) => string;
  outOfStockLabel?: string;
  className?: string;
}) {
  const prefix = locale === 'no' ? '/no' : '';
  return (
    <ul
      className={`-mr-margin flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-hide tab:mr-0 tab:grid tab:snap-none tab:grid-cols-2 tab:gap-x-gutter tab:gap-y-band tab:overflow-visible desk:grid-cols-3 ${className}`}
    >
      {products.map(p => (
        <li key={p.id} className="w-[240px] shrink-0 snap-start tab:w-auto">
          <TrackedLink
            className="block"
            event="related-product-click"
            eventData={{ from, to: p.slug, ...(placement ? { placement } : {}), ...(match ? { match: match(p) } : {}) }}
            href={`${prefix}/product/${p.slug}`}
          >
            <PrintCard
              product={p}
              locale={locale}
              sizes="(max-width: 833px) 240px, (max-width: 1199px) 50vw, 405px"
              {...(outOfStockLabel ? { outOfStockLabel } : {})}
            />
          </TrackedLink>
        </li>
      ))}
    </ul>
  );
}
