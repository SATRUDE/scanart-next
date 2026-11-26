// Mark's own devices out of the shop's numbers (Mark, 26 Nov 2026: his iPhone
// checkout on 23 Nov counted in the funnel). No visible UI: two URLs.
//
//   any page + ?notrack=on    this browser stops being measured, for good
//   any page + ?notrack=off   it is measured again
//
// How it holds:
// - proxy.ts answers either URL with a first-party cookie, NOTRACK_COOKIE,
//   for 400 days (the longest a browser keeps one). It is set by the server,
//   so Safari's seven-day cap on cookies and storage written by scripts does
//   not apply to it, and every later visit renews nothing it needs to.
// - isOptedOut() in lib/posthog.ts reads that cookie as well as Umami's own
//   flag, localStorage `umami.disabled`. That one check already gates PostHog
//   (it never loads, so it sends nothing at all), the order's server-side
//   purchase event, the session recorder and the ad pixels.
// - The inline head script in lib/tracker-guard.ts copies the choice into
//   `umami.disabled` before anything else runs, because Umami's own tracker
//   only reads that flag. `?notrack=off` clears both.
//
// Not a privacy control for visitors, and not secret: anyone who finds the
// parameter can only switch off their own measurement.

export const NOTRACK_PARAM = 'notrack';
export const NOTRACK_COOKIE = 'sa-notrack';
/** 400 days, the most Chrome allows a cookie to last; others allow longer. */
export const NOTRACK_MAX_AGE = 400 * 24 * 60 * 60;

/** 'on' or 'off' from a URL's query string, or null when it says neither. */
export function notrackChoice(search: string): 'on' | 'off' | null {
  const value = new URLSearchParams(search).get(NOTRACK_PARAM);
  return value === 'on' || value === 'off' ? value : null;
}

/** True when a Cookie header or document.cookie carries the opt-out. */
export function hasNotrackCookie(cookie: string | undefined | null): boolean {
  return (cookie || '').split(/;\s*/).includes(`${NOTRACK_COOKIE}=1`);
}
