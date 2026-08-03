'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics';

// Field Web Vitals: real-visitor LCP/CLS/INP (plus FCP/TTFB) as Umami events,
// the only real-user performance signal available below CrUX's traffic
// threshold. PSI/Lighthouse stays the lab baseline; this is what devices
// actually experience. Values are rounded to keep payloads small: CLS is a
// unitless score (x1000 for integer precision), everything else is ms.
export function WebVitalsReporter() {
  useReportWebVitals(metric => {
    track('web-vitals', {
      metric: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      rating: metric.rating,
      path: window.location.pathname,
    });
  });

  return null;
}
