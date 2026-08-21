'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';
import { scrollDepthPercent } from '@/lib/scroll-depth';

const THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * Fires an Umami "scroll-depth" event (depth: 25 | 50 | 75 | 100) once per
 * threshold per page view; Umami records the page URL with the event. The
 * fired set resets on every route change so client-side navigation counts as
 * a fresh view. At most four events per view, so no firehose. A page too
 * short to scroll fires 100 immediately, which honestly means "saw it all".
 */
export function ScrollDepth() {
  const pathname = usePathname();
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    fired.current = new Set();
    let ticking = false;

    const measure = () => {
      ticking = false;
      const doc = document.documentElement;
      const depth = scrollDepthPercent(window.scrollY, doc.scrollHeight, window.innerHeight);
      for (const t of THRESHOLDS) {
        if (depth >= t && !fired.current.has(t)) {
          fired.current.add(t);
          track('scroll-depth', { depth: t });
        }
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(measure);
      }
    };

    // Initial measure catches short pages (and the 25% an above-fold view of
    // a short page already represents) without waiting for a scroll.
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return null;
}
