import type { Metadata } from 'next';
import Link from 'next/link';
import { GalleryWallCalculator } from '@/components/GalleryWallCalculator';
import { QualityPromise } from '@/components/QualityPromise';
import { FullWidthImage } from '@/components/FullWidthImage';
import { BASE_URL, socialCard } from '@/lib/site';
import { EYE_LEVEL_CM } from '@/lib/gallery-wall-calculator';

const PAGE_TITLE = 'Gallery wall planner';
const PAGE_DESCRIPTION =
  'Plan a gallery wall to scale. Set your wall, drag the prints into place, and read the hanging measurements straight off the drawing.';

/**
 * English only for now, like /nordic-art: no /no twin, so no hreflang pair.
 * Build the Norwegian page and lib/i18n-no.test.ts starts demanding the
 * links follow it.
 */
export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/gallery-wall-planner' },
  ...socialCard({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: '/gallery-wall-planner',
    image: '/images/journal/gallery-wall-living-room.jpg',
  }),
};

const RULES = [
  {
    heading: '5 to 8 cm between frames',
    body: 'Closer and the frames crowd each other; further and they stop reading as one group. Use the same gap between rows as between prints.',
  },
  {
    heading: `Centre the group at ${EYE_LEVEL_CM} cm`,
    body: 'The centre of the whole arrangement, not of each print, sits at eye level: the convention galleries hang to, and the one a room reads as right.',
  },
  {
    heading: '15 to 25 cm above furniture',
    body: 'Over a sofa or a sideboard, the lowest frame wants a hand’s width or two of wall above the back. Lower and it looks like it slipped.',
  },
];

export default function GalleryWallPlannerPage() {
  return (
    <div className="min-h-screen">
      {/* Hero, the About page's pattern: full-bleed image darkened for
          legibility, text pinned left and aligned with the page container. */}
      <section className="mx-auto max-w-[1680px] px-8 pt-8">
        <div className="relative flex items-center overflow-hidden rounded min-h-[52vh] md:min-h-[60vh]">
          {/* this project uses plain <img> (see FullWidthImage), not next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/journal/gallery-wall-living-room.jpg"
            alt="A gallery wall of framed prints above a sofa in a Scandinavian living room"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45 md:bg-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />
          <div className="relative w-full">
            <div className="container mx-auto px-8">
              <div className="max-w-lg py-16 text-white">
                <h1 className="text-3xl md:text-4xl font-normal leading-tight tracking-tight">
                  Plan your gallery wall, to scale
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-white/90">
                  Set your wall, drag the prints into place, and take the hanging measurements straight off the drawing. Then find the prints to fill it.
                </p>
                <a
                  href="#planner"
                  className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-gray-900 hover:bg-white/90"
                >
                  Start planning
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The planner is the page. */}
      <section id="planner" className="scroll-mt-20 py-16">
        <div className="container mx-auto px-8">
          <GalleryWallCalculator />
        </div>
      </section>

      {/* The words live below the tool, where a reader who wants them - and a
          search engine - will find them, and where they cannot slow down a
          hand that just wants to drag. */}
      <section className="border-t border-neutral-200 py-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="mb-0 text-3xl text-neutral-900">How the planner works</h2>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-4 text-lg leading-relaxed text-neutral-600">
                The drawing is your wall to scale, floor at the bottom, eye level marked. Drag a print anywhere and it clicks to its neighbours’ edges and centres, exactly one gap apart; hover beside any print to add another, tap one to change its size, and slide the whole group up or down by the marker at the right. Change the gap and the whole arrangement re-spaces itself.
              </p>
              <p className="mb-4 text-lg leading-relaxed text-neutral-600">
                The measurements are written on the drawing the way a plan writes them: the group’s width and height, the space each side, the height of the top edge above the floor. Copy the plan and you get every frame’s left edge and top edge from the floor as text; copy the link and the wall comes back exactly as you left it. Frames usually hang 3 to 5 cm below their hook, so check yours before marking.
              </p>
              <Link href="/products" className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 hover:text-gray-900">
                Find the prints for your wall
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="mb-0 text-3xl text-neutral-900">Three rules for a wall that looks meant</h2>
            </div>
            <div className="lg:col-span-2 grid gap-8 sm:grid-cols-3">
              {RULES.map(rule => (
                <div key={rule.heading}>
                  <h3 className="text-base font-medium text-neutral-900">{rule.heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{rule.body}</p>
                </div>
              ))}
              <div className="sm:col-span-3">
                <Link href="/article/create-an-art-wall" className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 hover:text-gray-900">
                  Read the full guide to creating an art wall
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QualityPromise />
      <FullWidthImage />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Gallery wall planner',
            description: PAGE_DESCRIPTION,
            url: `${BASE_URL}/gallery-wall-planner`,
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
            publisher: { '@type': 'Organization', name: 'Scandinavian Art Gallery', url: BASE_URL },
          }),
        }}
      />
    </div>
  );
}
