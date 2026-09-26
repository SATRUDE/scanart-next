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
  className?: string;
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
 * no card (V2 groups with space and a 1 px rule, never a box); and NO promise
 * of a reply. Stan's first copy said "we will reply either way"; that came out
 * because whether we answer every applicant is still an open decision, and
 * /artists/apply deliberately stops short of the same promise. The two must
 * not disagree, so if Mark ever decides yes, it goes back in every place.
 */
export function ArtistApplyBand({ heading, body, ctaLabel, href, source, locale, className = '' }: ArtistApplyBandProps) {
  // V2 (Figma CTA 12:132, "Are you an artist?" on Artists · desktop 143:241):
  // no box, a rule on top, the headline on 6 columns and the body with its one
  // Primary button on the next 5. Mobile stacks them under the rule. Still a
  // TrackedLink, so artist-apply-click keeps telling us which band converts.
  return (
    <section aria-labelledby="artist-apply" className={`page-grid gap-y-6 border-t border-ink pt-4 tab:pt-6 ${className}`}>
      <h2 id="artist-apply" className="col-span-full type-h2 tab:type-h1 desk:col-span-6">
        {heading}
      </h2>
      <div className="col-span-full flex flex-col items-start gap-group desk:col-span-5">
        <div className="type-body [&_a]:text-text-accent [&_a:hover]:text-brand">{body}</div>
        <TrackedLink
          event="artist-apply-click"
          eventData={locale ? { source, locale } : { source }}
          href={href}
          className="inline-flex items-center justify-center bg-ink px-6 py-4 type-label whitespace-nowrap text-on-primary transition-colors hover:bg-primary-hover"
        >
          {ctaLabel}
        </TrackedLink>
      </div>
    </section>
  );
}
