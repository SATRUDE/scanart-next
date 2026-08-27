import type { Metadata } from 'next';
import Link from 'next/link';
import { ArtistApplyForm } from '@/components/ArtistApplyForm';
import { COPY } from '@/lib/artist-application';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Show us your work',
  description:
    'A small Scandinavian print gallery, taking on very few artists. Tell us about your work and a person will read it.',
  alternates: {
    canonical: '/artists/apply',
    languages: hreflangPair('/artists/apply'),
  },
  ...socialCard({
    title: 'Show us your work',
    description: 'Tell a small Scandinavian print gallery about your work.',
    path: '/artists/apply',
  }),
};

/**
 * The inbound half of artist acquisition. Viggo scouts the outbound half.
 *
 * Layout adapted from the Aneo/Joulia enquiry form on Mark's steer that a
 * reference from another client is LAYOUT ONLY and the skin stays ScanArt's.
 * Stan's design, 2026-08-21, frames 284:210 onward. His three departures from
 * the reference, all kept:
 *
 * 1. No card and no tint behind the form. SA is flat, and there is a
 *    functional reason too: the fields carry `input-background` #f9fafb, which
 *    only reads as "type here" against white. Tint the panel and the field
 *    fill stops working. The gutter buys the separation instead.
 * 2. The left column's second route is NOT "email us instead". An emailed
 *    application never reaches the review queue and cannot be triaged, so that
 *    slot holds the self-selection route instead: read who we already show and
 *    judge the fit before spending the time.
 * 3. Word markers rather than asterisks, since most fields are required and an
 *    asterisk needs a legend.
 *
 * The positioning is Mark's standing rule of 2026-08-05: curated expression of
 * interest, never open signup. Nothing here promises a place, and the copy
 * deliberately stops short of promising a reply, because whether we answer
 * every applicant is still an open decision and a live page is the wrong place
 * to commit to it.
 */
export default function ArtistApplyPage() {
  return (
    <div className="container mx-auto px-8 py-16">
      <nav aria-label="Breadcrumb" className="mb-10 text-sm text-muted-foreground">
        <Link href="/artists" className="hover:text-foreground">
          Artists
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground">Show us your work</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
        <div className="lg:col-span-1">
          <h1 className="text-3xl text-neutral-900">{COPY.h1}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{COPY.intro}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">{COPY.intro2}</p>

          <p className="mt-6 text-sm text-muted-foreground">{COPY.onlyRoute}</p>
        </div>

        <div className="lg:col-span-2">
          <ArtistApplyForm />
        </div>
      </div>
    </div>
  );
}
