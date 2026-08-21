'use client';

import React from 'react';
import { track } from '@/lib/analytics';

interface OutboundLinkProps {
  href: string;
  /** Slug of the article the link sits in, so a click can be attributed. */
  articleSlug?: string;
  /** The link's own text, which for a book link is the title. */
  label?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * An external link in article body copy, with an Umami event on click.
 *
 * Exists because NotionBlockRenderer is a server component and cannot attach a
 * handler, the same reason TrackedLink exists for next/link.
 *
 * Why we want this at all: the six journal pieces about Nordic art and design
 * books are the site's biggest earner of search impressions and its worst
 * converter, and they send readers out to Amazon, Dewi Lewis, Setanta and
 * others. Until now nothing recorded whether anyone followed those links, so
 * "should we sell books" and "would an affiliate programme ever clear Amazon's
 * three-sales-in-180-days bar" were both unanswerable. This makes them
 * measurable without an affiliate account, a disclosure obligation or a
 * third-party script.
 *
 * The payload is deliberately small and carries no PII: the destination host
 * rather than the full URL, the article it was clicked from, and the link's own
 * text, which for a book link is the title and is therefore the thing that
 * identifies WHICH book someone wanted.
 */
export function OutboundLink({ href, articleSlug, label, className, children }: OutboundLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        track('outbound-click', {
          host: outboundHost(href),
          ...(articleSlug ? { article: articleSlug } : {}),
          ...(label ? { label: label.slice(0, 80) } : {}),
        });
      }}
    >
      {children}
    </a>
  );
}

/**
 * The destination's hostname, without a leading www., for grouping in Umami.
 * Returns 'unparsed' rather than throwing: a malformed href in article copy
 * should cost the event's precision, never the reader's click.
 */
export function outboundHost(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'unparsed';
  }
}
