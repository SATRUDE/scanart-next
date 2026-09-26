import { TrackNotFound } from '@/components/TrackNotFound';
import { NotFoundFrame, type FramePrint } from '@/components/v2/not-found/NotFoundFrame';
import { getAllProducts } from '@/lib/products';

/**
 * The 404 page's body (Figma: 404 · desktop 221:3986, mobile 221:4072).
 * "Nothing hangs here": an empty frame on a wall, one line, a small "Fill the
 * frame" menu that hangs a print in it, and one way on. Mark (2026-09-26) kept
 * the idea and the copy and asked for it much simpler: the row of print tiles
 * became that menu, and the search and link list are gone (the header already
 * carries both).
 *
 * Rendered in three places, always inside the site's own header and footer:
 * - app/(en)/not-found.tsx and app/(no)/not-found.tsx, when a page calls
 *   notFound() (an unknown product, artist or article);
 * - app/(no)/no/[...missing], so an unmatched /no URL gets the Norwegian page;
 * - app/global-not-found.tsx, for any other unmatched URL (English, our
 *   x-default: an unmatched URL has no language of its own).
 * The response is a 404 and the page carries robots noindex.
 */

export const NOT_FOUND_COPY = {
  en: {
    title: 'Page not found | Scandinavian Art',
    heading: 'Nothing hangs here.',
    body: 'The page you were after has moved, or it was never here. Something else could fill the space.',
    frameAlt: 'An empty picture frame on a peach wall above a set dining table',
    fill: 'Fill the frame',
    see: 'See {name}',
    cta: 'See the prints',
  },
  no: {
    title: 'Fant ikke siden | Scandinavian Art',
    heading: 'Her henger det ingenting.',
    body: 'Siden du lette etter er flyttet, eller den har aldri vært her. Noe annet kan fylle plassen.',
    frameAlt: 'En tom bilderamme på en ferskenfarget vegg over et dekket spisebord',
    fill: 'Fyll rammen',
    see: 'Se {name}',
    cta: 'Se trykkene',
  },
} as const;

/**
 * The prints offered, all sold at 50 × 70, the frame's size (the "Start from
 * your wall" rule). One that leaves the catalogue or loses that size drops out.
 */
const FILL = ['dancer', 'dragon', 'hyttefrokost'];

export async function NotFoundBody({ locale }: { locale: 'en' | 'no' }) {
  const t = NOT_FOUND_COPY[locale];
  const p = locale === 'no' ? '/no' : '';
  const products = await getAllProducts();
  const prints: FramePrint[] = FILL.flatMap(slug => {
    const x = products.find(item => item.slug === slug);
    if (!x || !x.prices['50x70cm']) return [];
    return [{ slug, href: `${p}/product/${slug}`, name: x.name, artist: x.artist ?? '', composite: `/images/v2/not-found/fill-${slug}.webp` }];
  });
  return (
    <>
      {/* React hoists these into <head>; not-found files have no metadata export. */}
      <title>{t.title}</title>
      <meta name="robots" content="noindex" />
      <TrackNotFound />
      <div className="page-x pt-6 pb-section tab:pt-band">
        <NotFoundFrame
          frameAlt={t.frameAlt}
          heading={t.heading}
          body={t.body}
          fillLabel={t.fill}
          seeLabel={t.see}
          cta={t.cta}
          productsHref={`${p}/products`}
          prints={prints}
        />
      </div>
    </>
  );
}
