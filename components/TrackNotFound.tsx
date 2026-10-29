'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sendToUmami, umamiReady } from '@/lib/analytics';
import { capturePostHog } from '@/lib/posthog';

// Fires once per 404 view with the missing path and where the visitor came
// from: a broken inbound link or a steadily-hit dead URL is invisible without
// this, and a recurring path in the data is a redirect opportunity.
//
// PostHog gets the event straight away: capturePostHog queues it until
// PostHog has loaded. Umami drops an event sent before its deferred script
// loads, and the not-found page is small enough to mount before it (verified
// with a scripted visit 2026-08-04), so the Umami half polls briefly until the
// tracker exists. The two halves together are what track() does; when Umami
// retires (about 9 November 2026) this becomes a plain track() on mount.
export function TrackNotFound() {
  const pathname = usePathname();

  useEffect(() => {
    const data = { path: pathname, referrer: document.referrer || 'direct' };
    capturePostHog('404', data);

    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fire = () => {
      if (umamiReady()) {
        sendToUmami('404', data);
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
