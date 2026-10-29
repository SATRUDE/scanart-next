// Typed wrapper for custom events. Every event goes through track(), which
// sends it to Umami (the script in app/site-document.tsx exposes window.umami)
// and to PostHog (lib/posthog.ts), with the same name and properties, so the
// naming stays kebab-case and the window typing lives in one place. Safe to
// call from server-rendered code paths: it no-ops without a window.
//
// Umami applies its own guards (data-domains, the umami.disabled flag, the
// crawler guard in lib/tracker-guard.ts) and drops an event fired before its
// script loads. PostHog applies the same rules in startPostHog() and queues an
// event fired before it loads (see capturePostHog). Umami is retired around
// 9 November 2026; then sendToUmami goes and track() is PostHog only.
//
// Event catalogue and payload conventions: see the behaviour-analytics ticket
// on the ScanArt board (2026-08-03). Payloads are small named properties,
// never PII, never card details.

import { capturePostHog } from '@/lib/posthog';

type Umami = { track: (event: string, data?: Record<string, unknown>) => void };

/** True once the Umami tracker script has loaded on this page. */
export function umamiReady(): boolean {
  return typeof window !== 'undefined' && Boolean((window as Window & { umami?: Umami }).umami);
}

/** Umami half of track(), for the one caller that waits for Umami itself
 * (TrackNotFound). Everything else calls track(). */
export function sendToUmami(event: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  (window as Window & { umami?: Umami }).umami?.track(event, data);
}

export function track(event: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  sendToUmami(event, data);
  capturePostHog(event, data);
}
