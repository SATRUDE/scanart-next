'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { bannerStrings, isNoPath, noPathFor } from '@/lib/i18n';

// Persisted once the visitor makes a choice (X, "continue in English" or
// following the Norwegian link), so the suggestion is only ever made until
// they answer it. Never redirects: the visitor always chooses.
const STORAGE_KEY = 'sa-locale-banner-dismissed';

function prefersNorwegian(): boolean {
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some(l => /^(no|nb|nn)\b/i.test(l ?? ''));
}

/**
 * First-visit suggestion for Norwegian-speaking visitors: a slim dismissible
 * banner on English pages offering the Norwegian version. Renders nothing
 * until mounted (the decision needs navigator.language and localStorage, both
 * client-only), nothing on /no pages, and nothing once dismissed. The link
 * targets the /no twin of the current page when one exists, else /no.
 */
export function LocaleSuggestionBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Decide once after mount (deferred a tick so hydration completes with the
  // same empty markup the server sent). The component stays mounted in the
  // root layout across client-side navigation, so the decision holds until
  // the visitor answers it; hiding on /no pages is derived at render.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) return;
      } catch {
        return; // storage unavailable: never show rather than nag every visit
      }
      if (prefersNorwegian()) setVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || isNoPath(pathname)) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable: dismiss for this page view only
    }
    setVisible(false);
  };

  return (
    <div className="border-b border-border bg-neutral-100 text-neutral-900" lang="no">
      <div className="container mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-sm">
        <span>{bannerStrings.message}</span>
        <Link
          href={noPathFor(pathname) ?? '/no'}
          onClick={dismiss}
          className="font-medium underline underline-offset-2 hover:text-neutral-600 transition-colors"
        >
          {bannerStrings.cta}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          {bannerStrings.dismiss}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={bannerStrings.close}
          className="p-1 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
