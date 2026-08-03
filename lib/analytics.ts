// Typed wrapper for Umami custom events (the script in app/layout.tsx exposes
// window.umami). Every event goes through here so the naming stays kebab-case
// and the window typing lives in one place. Safe to call from server-rendered
// code paths: it no-ops without a window or before the script loads.
//
// Event catalogue and payload conventions: see the behaviour-analytics ticket
// on the ScanArt board (2026-08-03). Payloads are small named properties,
// never PII, never card details.

type Umami = { track: (event: string, data?: Record<string, unknown>) => void };

export function track(event: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  (window as Window & { umami?: Umami }).umami?.track(event, data);
}
