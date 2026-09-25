import type { Metadata } from 'next';
import Image from 'next/image';
import { GalleryWallCalculator } from '@/components/GalleryWallCalculator';
import { Button, ContentSection, LinkRow, ListItem, PageHeader, Question } from '@/components/v2/ui';
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
    <div className="page-x pb-section">
      {/* No V2 frame of its own: the template for those pages (docs/v2-seo.md),
          Page header, the tool, then Content sections. */}
      <PageHeader
        title="Plan your gallery wall, to scale"
        lead="Set your wall, drag the prints into place, and take the hanging measurements straight off the drawing. Then find the prints to fill it."
      >
        <div className="mt-2">
          <Button href="#planner">Start planning</Button>
        </div>
      </PageHeader>

      {/* The page's hero picture, and its LCP: preloaded, not lazy. */}
      <div className="relative mt-block aspect-square w-full overflow-hidden bg-image-bg tab:aspect-[2/1]">
        <Image
          src="/images/journal/gallery-wall-living-room.jpg"
          alt="A gallery wall of framed prints above a sofa in a Scandinavian living room"
          fill
          preload
          sizes="(max-width: 1440px) 100vw, 1280px"
          className="object-cover object-top"
        />
      </div>

      {/* The planner is the page. */}
      <section id="planner" className="mt-section scroll-mt-20">
        <GalleryWallCalculator />
      </section>

      {/* The words live below the tool, where a reader who wants them - and a
          search engine - will find them, and where they cannot slow down a
          hand that just wants to drag. */}
      <ContentSection
        id="how-to-plan"
        className="mt-section"
        title="How to plan a gallery wall with it"
        footer={<Button href="/products">Find the prints for your wall</Button>}
      >
        <p className="type-body tab:max-w-[624px]">
          The drawing is your wall to scale, floor at the bottom, eye level marked. Drag a print anywhere and it clicks to its neighbours’ edges and centres, exactly one gap apart; hover beside any print to add another, tap one to change its size, and slide the whole group up or down by the marker at the right. Change the gap and the whole arrangement re-spaces itself.
        </p>
        <p className="type-body tab:max-w-[624px]">
          The measurements are written on the drawing the way a plan writes them: the group’s width and height, the space each side, the height of the top edge above the floor. Copy the plan and you get every frame’s left edge and top edge from the floor as text; copy the link and the wall comes back exactly as you left it. Frames usually hang 3 to 5 cm below their hook, so check yours before marking.
        </p>
      </ContentSection>

      <ContentSection id="three-rules" className="mt-section" title="Gallery wall spacing and height: three rules">
        <ol className="flex flex-col gap-group tab:max-w-[624px]">
          {RULES.map((rule, i) => (
            <ListItem key={rule.heading} type="number" number={String(i + 1).padStart(2, '0')}>
              <h3 className="type-body">{rule.heading}</h3>
              <p className="mt-1 type-small">{rule.body}</p>
            </ListItem>
          ))}
        </ol>
      </ContentSection>

      {/* Question rows are native <details>: every answer is in the served
          HTML, matching the FAQPage below. */}
      <ContentSection id="questions" className="mt-section" title="Gallery wall questions">
        <div className="tab:max-w-[624px]">
          {FAQ.map((item, i) => (
            <Question key={item.question} question={item.question} open={i === 0} size="small" className="[&_summary]:items-center">
              <p>{item.answer}</p>
            </Question>
          ))}
        </div>
      </ContentSection>

      <ContentSection id="keep-reading" className="mt-section" title="Keep reading">
        <nav aria-label="Related guides" className="tab:max-w-[624px]">
          {[
            ['/article/create-an-art-wall', 'How to create an art wall with multiple pieces'],
            ['/article/complete-guide-choosing-print-sizes', 'Choosing print sizes and allowing for the frame'],
            ['/article/how-to-style-scandinavian-wall-art-living-room', 'How to style Scandinavian wall art in your living room'],
            ['/article/scandinavian-wall-decor-ideas', 'Scandinavian wall decor ideas: eight ways to dress a wall'],
          ].map(([href, label]) => (
            <LinkRow key={href} href={href} className="[&>span:first-child]:type-body">
              {label}
            </LinkRow>
          ))}
        </nav>
      </ContentSection>

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
