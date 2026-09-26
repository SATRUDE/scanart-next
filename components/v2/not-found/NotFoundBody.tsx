import { TrackNotFound } from '@/components/TrackNotFound';
import { NotFoundFrame, type FramePrint } from '@/components/v2/not-found/NotFoundFrame';
import { getAllProducts } from '@/lib/products';

/**
 * The 404 page's body (Figma: 404 · desktop 221:3986, mobile 221:4072).
 * "Nothing hangs here": an empty frame on a wall with a card over it (the
 * Start from your wall picker: choose a print, it hangs in the frame, See the
 * print), then the message with See all prints and See the artists. Mark
 * (2026-09-26) kept the idea and the copy and asked for it much simpler: the
 * row of print tiles, the search and the link list are gone.
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
    printLabel: 'Print',
    choose: 'Choose a print for the frame',
    seePrint: 'See the print',
    allPrints: 'See all prints',
    artists: 'See the artists',
  },
  no: {
    title: 'Fant ikke siden | Scandinavian Art',
    heading: 'Her henger det ingenting.',
    body: 'Siden du lette etter er flyttet, eller den har aldri vært her. Noe annet kan fylle plassen.',
    frameAlt: 'En tom bilderamme på en ferskenfarget vegg over et dekket spisebord',
    printLabel: 'Trykk',
    choose: 'Velg et trykk til rammen',
    seePrint: 'Se trykket',
    allPrints: 'Se alle trykk',
    artists: 'Se kunstnerne',
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
    return [{ slug, href: `${p}/product/${slug}`, name: x.name, artist: x.artist ?? '', prices: x.prices, chip: `/images/v2/wall/chips/${slug}.jpg`, composite: `/images/v2/not-found/fill-${slug}.webp` }];
  });
  return (
    <>
      {/* React hoists these into <head>; not-found files have no metadata export. */}
      <title>{t.title}</title>
      <meta name="robots" content="noindex" />
      <TrackNotFound />
      <div className="page-x pt-6 pb-section tab:pt-band">
        <NotFoundFrame t={t} prints={prints} productsHref={`${p}/products`} artistsHref={`${p}/artists`} />
      </div>
    </>
  );
}
