'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

// Fires once per 404 view with the missing path and where the visitor came
// from: a broken inbound link or a steadily-hit dead URL is invisible without
// this, and a recurring path in the data is a redirect opportunity.
//
// The not-found page is small enough that it mounts BEFORE the deferred Umami
// script loads, and track() silently no-ops without window.umami, so a plain
// fire-on-mount loses the race and the event never sends (verified with a
// scripted visit 2026-08-04). Poll briefly until the tracker exists instead.
export function TrackNotFound() {
  const pathname = usePathname();

  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fire = () => {
      if ((window as Window & { umami?: unknown }).umami) {
        track('404', { path: pathname, referrer: document.referrer || 'direct' });
        return;
      }
      if (++tries < 20) timer = setTimeout(fire, 500);
    };
    fire();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
