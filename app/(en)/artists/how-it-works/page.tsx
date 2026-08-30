import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { INTRO, LAST_UPDATED, SECTIONS } from '@/lib/artist-how-it-works';

/**
 * The link Mark sends an artist instead of writing the same long email again.
 *
 * UNLISTED BY DESIGN, and all four parts of that matter together:
 *  - robots index:false, follow:false (below), against the index/follow every
 *    other page declares;
 *  - absent from the static entries in app/sitemap.ts;
 *  - not linked from the nav, the footer, /artists or /artists/apply;
 *  - still crawlable. It is deliberately NOT disallowed in app/robots.ts,
 *    because a blocked page never gets read, so the noindex directive never
 *    gets obeyed, and a blocked-but-linked URL can still surface.
 *
 * No new design: this reuses the LegalPage template (Stan's Figma node 21:2)
 * that Privacy, Terms and Delivery already run on. A plainly set page of text
 * is the right answer for something one person reads once, and reusing the
 * template keeps it off the design sign-off gate entirely.
 *
 * Mark's steer, /peggy chat 30 Aug 2026: sell it a bit, and skip the detail.
 * So the copy leads with what an artist gains and leaves out the clauses that
 * only matter once they have signed (governing law, entire agreement, the
 * mechanics of cost apportionment).
 */
export const metadata: Metadata = {
  title: 'How selling prints with us works',
  description: 'What it costs, what you earn, who prints the work and what you keep.',
  robots: { index: false, follow: false },
};

const sections: LegalSection[] = SECTIONS.map((section, i) => ({
  heading: section.heading,
  body: (
    <>
      {section.body.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {i === SECTIONS.length - 1 && (
        <p>
          <Link href="/artists/apply" className="underline hover:text-neutral-900">
            Show us your work
          </Link>
        </p>
      )}
    </>
  ),
}));

export default function ArtistHowItWorksPage() {
  return (
    <LegalPage
      title="How selling prints with us works"
      lastUpdated={LAST_UPDATED}
      intro={<p>{INTRO}</p>}
      sections={sections}
    />
  );
}
