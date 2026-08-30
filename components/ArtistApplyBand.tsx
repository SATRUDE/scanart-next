import React from 'react';
import { TrackedLink } from '@/components/TrackedLink';

interface ArtistApplyBandProps {
  heading: string;
  /** ReactNode, not a string: the how-it-works copy carries a mailto link. */
  body: React.ReactNode;
  ctaLabel: string;
  /** Where the call to action goes: /artists/apply or its /no twin. */
  href: string;
  /** Umami `artist-apply-click` payload, so we can tell which band converts. */
  source: string;
  locale?: 'no';
}

/**
 * The "Are you an artist?" band: the inbound door for artist acquisition
 * (Viggo scouts the outbound half).
 *
 * Extracted 2026-08-30, when Mark asked for the same band at the foot of the
 * how-it-works page. It had been copy-pasted markup on app/(en)/artists and
 * app/(no)/no/artists, and a third copy is where a pattern like this quietly
 * drifts, so it is a component now and all three render the same thing.
 *
 * Design notes carried over from the original, both still load-bearing:
 * a flat muted band rather than a bordered card, because SA is flat by default
 * and a tint avoids leaning on the weak border token; and NO promise of a
 * reply. Stan's first copy said "we will reply either way"; that came out
 * because whether we answer every applicant is still an open decision, and
 * /artists/apply deliberately stops short of the same promise. The two must
 * not disagree, so if Mark ever decides yes, it goes back in every place.
 */
export function ArtistApplyBand({ heading, body, ctaLabel, href, source, locale }: ArtistApplyBandProps) {
  return (
    <section aria-labelledby="artist-apply" className="mt-16 rounded-xl bg-muted/30 p-6">
      <h2 id="artist-apply" className="text-lg font-medium mb-2">
        {heading}
      </h2>
      <div className="text-neutral-600">{body}</div>
      <TrackedLink
        event="artist-apply-click"
        eventData={locale ? { source, locale } : { source }}
        href={href}
        className="mt-4 inline-block underline underline-offset-2 hover:text-neutral-900"
      >
        {ctaLabel}
      </TrackedLink>
    </section>
  );
}
