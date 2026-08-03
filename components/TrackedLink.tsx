'use client';

import React from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';

interface TrackedLinkProps extends React.ComponentProps<typeof Link> {
  /** Umami event name fired on click, e.g. "homepage-section-click". */
  event: string;
  /** Small named payload for the event (no PII). */
  eventData?: Record<string, unknown>;
}

/**
 * next/link plus an Umami event on click. Exists so server components
 * (homepage sections, breadcrumbs, LandingCrossLinks, article browse links)
 * can emit click events without each growing its own client wrapper.
 * Navigation is never blocked: the event fires fire-and-forget.
 */
export function TrackedLink({ event, eventData, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={e => {
        track(event, eventData);
        onClick?.(e);
      }}
    />
  );
}
