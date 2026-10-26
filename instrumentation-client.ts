// Client-side instrumentation, run by Next.js before hydration. Kept to a
// cheap check and a deferred dynamic import (see lib/posthog.ts), so it adds
// nothing measurable to first load. Umami is still loaded separately in
// app/site-document.tsx while the two run side by side.
import { startPostHog } from '@/lib/posthog';

try {
  startPostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, process.env.NEXT_PUBLIC_POSTHOG_HOST);
} catch {
  // Analytics must never stop the app from starting.
}
