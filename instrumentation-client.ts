// Client-side instrumentation, run by Next.js before hydration. Kept to a
// cheap check and a deferred dynamic import (see lib/posthog.ts and
// lib/recorder/client.ts), so it adds nothing measurable to first load. Umami
// is still loaded separately in app/site-document.tsx while the two run side
// by side.
import { captureCampaign } from '@/lib/campaign';
import { startPostHog } from '@/lib/posthog';
import { startRecorder } from '@/lib/recorder/client';

try {
  // Which ad this visit came from, read once from the landing URL and kept in
  // memory only (lib/campaign.ts), so a same-visit order can be credited to it.
  captureCampaign();
} catch {
  // Attribution must never stop the app from starting.
}

try {
  startPostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, process.env.NEXT_PUBLIC_POSTHOG_HOST);
} catch {
  // Analytics must never stop the app from starting.
}

try {
  // Session recordings to our own R2 bucket (T-0411); off unless
  // NEXT_PUBLIC_RECORDINGS is "on".
  startRecorder(process.env.NEXT_PUBLIC_RECORDINGS);
} catch {
  // Recording must never stop the app from starting.
}
