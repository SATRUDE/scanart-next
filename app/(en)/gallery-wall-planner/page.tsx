import type { Metadata } from 'next';
import Link from 'next/link';
import { GalleryWallCalculator } from '@/components/GalleryWallCalculator';
import { QualityPromise } from '@/components/QualityPromise';
import { FullWidthImage } from '@/components/FullWidthImage';
import { BASE_URL, socialCard } from '@/lib/site';
import { EYE_LEVEL_CM } from '@/lib/gallery-wall-calculator';

const PAGE_TITLE = 'Gallery Wall Planner: Plan Your Wall to Scale';
const PAGE_DESCRIPTION =
  'Free gallery wall planner. Enter your wall, drag the prints into place and read the hanging measurements off a to-scale drawing: spacing, height above the floor, where every hook goes.';

/**
 * English only for now, like /nordic-art: no /no twin, so no hreflang pair.
 * Build the Norwegian page and lib/i18n-no.test.ts starts demanding the
 * links follow it.
 */
export const metadata: Metadata = {
  // Absolute, as on /nordic-art: the layout's "| Scandinavian Art Gallery"
  // suffix would push the query this page targets past Google's display cut.
  title: { absolute: `${PAGE_TITLE} | Scandinavian Art` },
  description: PAGE_DESCRIPTION,
  keywords: ['gallery wall planner', 'gallery wall layout', 'how to plan a gallery wall', 'gallery wall spacing', 'picture hanging height'],
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

/**
 * The questions people bring to a gallery wall, answered from the same numbers
 * the planner uses. Also the page's FAQPage schema, so an answer can show in
 * search as one.
 */
const FAQ = [
  {
    question: 'How far apart should frames be on a gallery wall?',
    answer: 'Between 5 and 8 cm, and the same distance between rows as between prints. Closer and the frames crowd each other; wider and they stop reading as one group. The planner clicks prints to exactly the gap you set.',
  },
  {
    question: 'How high should a gallery wall be hung?',
    answer: `Hang the group so its centre - the centre of the whole arrangement, not of each print - sits at about ${EYE_LEVEL_CM} cm from the floor. That is the convention galleries hang to. Above a sofa or sideboard, leave 15 to 25 cm between the furniture and the lowest frame.`,
  },
  {
    question: 'How do I plan a gallery wall layout before drilling?',
    answer: 'Measure the wall, decide the gap, and lay the arrangement out to scale first. The planner draws your wall with the prints on it and writes the measurements on the drawing, so you know each frame’s left edge and its top edge from the floor before you mark anything. Frames usually hang 3 to 5 cm below their hook.',
  },
  {
    question: 'Which print sizes work together on a gallery wall?',
    answer: 'Mixing one portrait size with one square size is the simplest way to get a wall that looks arranged rather than stacked: 50 × 70 cm portraits with 50 × 50 cm squares share a width, so columns line up while the heights vary. Every arrangement in the planner uses those two sizes.',
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
            fetchPriority="high"
            decoding="async"
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
              <h2 className="mb-0 text-3xl text-neutral-900">How to plan a gallery wall with it</h2>
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
              <h2 className="mb-0 text-3xl text-neutral-900">Gallery wall spacing and height: three rules</h2>
            </div>
            <div className="lg:col-span-2 grid gap-8 sm:grid-cols-3">
              {RULES.map(rule => (
                <div key={rule.heading}>
                  <h3 className="text-base font-medium text-neutral-900">{rule.heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{rule.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="mb-0 text-3xl text-neutral-900">Gallery wall questions</h2>
            </div>
            <dl className="lg:col-span-2 divide-y divide-neutral-200">
              {FAQ.map(item => (
                <div key={item.question} className="py-5 first:pt-0 last:pb-0">
                  <dt className="text-base font-medium text-neutral-900">{item.question}</dt>
                  <dd className="mt-2 text-base leading-relaxed text-neutral-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="mb-0 text-3xl text-neutral-900">Keep reading</h2>
            </div>
            <nav aria-label="Related guides" className="lg:col-span-2 flex flex-col gap-3 text-base">
              {[
                ['/article/create-an-art-wall', 'How to create an art wall with multiple pieces'],
                ['/article/how-to-frame-an-art-print', 'How to frame an art print, and the size trap to avoid'],
                ['/article/complete-guide-choosing-print-sizes', 'The complete guide to choosing print sizes for your home'],
                ['/article/how-to-style-scandinavian-wall-art-living-room', 'How to style Scandinavian wall art in your living room'],
                ['/article/scandinavian-wall-decor-ideas', 'Scandinavian wall decor ideas: eight ways to dress a wall'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="text-neutral-800 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-900 hover:decoration-neutral-900">
                  {label}
                </Link>
              ))}
            </nav>
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
            '@type': 'FAQPage',
            mainEntity: FAQ.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
          }),
        }}
      />
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
