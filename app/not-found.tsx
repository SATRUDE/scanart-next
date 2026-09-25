import { SiteDocument } from './site-document';
import { TrackNotFound } from '@/components/TrackNotFound';
import { TextLink } from '@/components/v2/ui';
import { FillTheFrame, type FramePrint } from '@/components/v2/not-found/FillTheFrame';
import { getAllProducts } from '@/lib/products';
import { printImageAlt } from '@/lib/product-image-alt';

/**
 * The global 404, for a URL that matches no route in either language tree
 * (Figma: 404 · desktop 221:3986, mobile 221:4072, print in the frame
 * 284:12670). "Nothing hangs here": an empty frame on a wall, three prints to
 * fill it, the search, and the way back to Prints, Artists, Journal and Help.
 *
 * It renders its own document on purpose. Splitting the app into (en) and (no)
 * route groups removed the single top-level layout, so Next.js has no layout
 * to wrap this file with; it takes the same SiteDocument the English root
 * layout uses, so the page has the site's header and footer. lang="en" is the
 * honest default: an unmatched URL has no language, and English is our
 * x-default. The response stays a 404, and Next.js adds robots noindex to it.
 */

/**
 * The three prints offered, all sold at 50 × 70, the frame's size (the brand
 * file's "Start from your wall" rule), each with a pre-rendered frame state.
 * One that leaves the catalogue or loses its 50 × 70 size simply drops out.
 */
const FILL = [
  { slug: 'dancer', composite: '/images/v2/not-found/frame-dancer.webp' },
  { slug: 'dragon', composite: '/images/v2/not-found/frame-dragon.webp' },
  { slug: 'hyttefrokost', composite: '/images/v2/not-found/frame-hyttefrokost.webp' },
];

export default async function NotFound() {
  const products = await getAllProducts();
  const prints: FramePrint[] = FILL.flatMap(({ slug, composite }) => {
    const p = products.find(x => x.slug === slug);
    if (!p || !p.prices['50x70cm']) return [];
    return [
      {
        slug,
        href: `/product/${slug}`,
        name: p.name,
        artist: p.artist ?? '',
        prices: p.prices,
        image: p.image,
        imageAlt: printImageAlt({ name: p.name, artist: p.artist, brand: p.brand, category: p.category }),
        composite,
      },
    ];
  });

  return (
    <SiteDocument lang="en">
      {/* React hoists this into <head>; not-found has no metadata export. */}
      <title>Page not found | Scandinavian Art</title>
      <TrackNotFound />
      <div className="page-x pt-6 pb-section tab:pt-block">
        <FillTheFrame
          emptyFrame={{
            src: '/images/v2/not-found/empty-frame.webp',
            alt: 'An empty picture frame on a peach wall above a set dining table',
          }}
          heading="Fill the frame"
          prints={prints}
          message={
            <>
              <h1 className="type-display">Nothing hangs here.</h1>
              <p className="mt-6 type-body tab:type-lead">
                The page you were after has moved, or it was never here. Something else could fill the space.
              </p>
            </>
          }
          after={
            <>
              {/* The real search: it submits to /products?q=, as the header's
                  search does, and works without JavaScript. */}
              <form action="/products" method="get" role="search" className="mt-6 flex items-end gap-4 border-b border-ink pb-3 tab:pt-group">
                <label htmlFor="not-found-search" className="sr-only">Search prints, artists and stories</label>
                <input
                  id="not-found-search"
                  name="q"
                  type="search"
                  placeholder="Search prints, artists and stories"
                  className="min-w-0 flex-1 bg-transparent type-body outline-none placeholder:text-ink/45 tab:type-h3"
                />
                <button type="submit" className="shrink-0 type-small transition-colors hover:text-brand">Search</button>
              </form>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                <li><TextLink href="/products" size="body">Prints</TextLink></li>
                <li><TextLink href="/artists" size="body">Artists</TextLink></li>
                <li><TextLink href="/journal" size="body">Journal</TextLink></li>
                <li><TextLink href="/help" size="body">Help</TextLink></li>
              </ul>
            </>
          }
        />
      </div>
    </SiteDocument>
  );
}
