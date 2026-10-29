// PostHog (EU cloud, cookieless), run alongside Umami for about two weeks
// before Umami is retired (Mark, 26 October 2026: Umami's Neon database keeps
// hitting the Free compute limit). instrumentation-client.ts calls
// startPostHog(); everything that decides whether to load lives here so it can
// be tested without a browser.
//
// What the setup does, and why:
//
// - cookieless_mode 'always': PostHog writes no cookie and nothing to local or
//   session storage, and counts visitors with a daily-salted hash on its own
//   servers, so the site needs no cookie banner. The PostHog project must also
//   have Settings > Project > Web analytics > "Enable cookieless tracking"
//   switched on, or every event sent from here is dropped at ingestion.
// - person_profiles 'never': PostHog's cookieless guide says this is how to
//   rule identification out entirely (identify() becomes a no-op). The shop has
//   no logins, so nothing is lost.
// - No session recordings and no surveys: PostHog disables both in cookieless
//   mode because they need browser storage. They are switched off here as well
//   so their bundles are never fetched. Inputs stay masked in case recordings
//   are ever turned on in a different mode.
// - Pageviews on first load and on every client-side route change
//   (capture_pageview 'history_change'), plus autocapture of clicks.
// - Loaded late: a dynamic import after the window load event and the next idle
//   moment, so posthog-js is not in the first-load bundle and cannot delay LCP
//   or hydration.
//
// It never loads when:
// - NEXT_PUBLIC_POSTHOG_KEY is unset (local builds, and production until the
//   key is added in Vercel);
// - the page is not on the production host (the same limit as Umami's
//   data-domains, so previews and localhost stay out);
// - the browser carries Umami's opt-out flag, localStorage `umami.disabled`,
//   which Mark has set in his own browsers;
// - the visitor looks like one of the crawlers lib/tracker-guard.ts keeps out
//   of Umami (the same rule, so the two tools count the same visits during the
//   overlap).
//
// Custom events: lib/analytics.ts track() sends every event to Umami and to
// capturePostHog() below. PostHog loads late, so an event fired before then
// (a 404, an early scroll-depth) waits in a small queue and is sent the moment
// posthog.init() returns. If PostHog is not going to load (no key, not the
// production host, opted out, a crawler, blocked), the queue is dropped and
// later events are ignored, so the same guards cover custom events as cover
// pageviews.

export const POSTHOG_DEFAULT_HOST = 'https://eu.i.posthog.com';
export const POSTHOG_UI_HOST = 'https://eu.posthog.com';
export const PRODUCTION_HOST = 'www.scandinavianart.co.uk';
export const OPT_OUT_KEY = 'umami.disabled';

type Nav = { webdriver?: boolean; userAgent?: string; maxTouchPoints?: number };
type Storage = { getItem(key: string): string | null };

/** True when Umami's opt-out flag is set in this browser. Same test as Umami's
 * tracker: any value at all counts. Unreadable storage counts as not set. */
export function isOptedOut(getStorage: () => Storage | undefined): boolean {
  try {
    return Boolean(getStorage()?.getItem(OPT_OUT_KEY));
  } catch {
    return false;
  }
}

/** The crawler rule from lib/tracker-guard.ts (T-0248), for PostHog. Keep the
 * two in step until Umami is retired, then this is the only copy. */
export function looksLikeBot(nav: Nav, width: number, height: number): boolean {
  if (nav.webdriver === true) return true;
  if (/HeadlessChrome|PhantomJS/.test(nav.userAgent || '')) return true;
  if ((nav.maxTouchPoints || 0) > 0) return false;
  if (!width || !height) return false;
  return width >= height && width * 5 < height * 6;
}

export function shouldLoadPostHog(input: {
  key: string | undefined;
  hostname: string;
  optedOut: boolean;
  bot: boolean;
}): boolean {
  return Boolean(input.key) && input.hostname === PRODUCTION_HOST && !input.optedOut && !input.bot;
}

export function posthogConfig(host: string | undefined) {
  return {
    api_host: host || POSTHOG_DEFAULT_HOST,
    ui_host: POSTHOG_UI_HOST,
    defaults: '2026-08-30',
    cookieless_mode: 'always',
    person_profiles: 'never',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: true,
    disable_surveys: true,
    session_recording: { maskAllInputs: true },
  } as const;
}

type Props = Record<string, unknown> | undefined;
type Capture = (event: string, props?: Props) => void;

/** Most events a visitor can fire before PostHog loads; beyond this the oldest
 * are dropped. A page fires a handful at most, so this only bounds a runaway. */
export const QUEUE_LIMIT = 30;

/**
 * Holds custom events until PostHog has loaded, then sends them. 'pending'
 * until startPostHog decides; 'ready' once init has returned; 'off' when
 * PostHog will not load on this page view, which drops everything.
 */
export function createEventQueue() {
  let status: 'pending' | 'ready' | 'off' = 'pending';
  let send: Capture | undefined;
  let queue: Array<[string, Props]> = [];
  return {
    get status() {
      return status;
    },
    get size() {
      return queue.length;
    },
    capture(event: string, props?: Props) {
      if (status === 'ready') send?.(event, props);
      else if (status === 'pending') {
        queue.push([event, props]);
        if (queue.length > QUEUE_LIMIT) queue.shift();
      }
    },
    ready(capture: Capture) {
      if (status !== 'pending') return;
      status = 'ready';
      send = capture;
      const waiting = queue;
      queue = [];
      for (const [event, props] of waiting) capture(event, props);
    },
    off() {
      status = 'off';
      queue = [];
    },
  };
}

// One queue per page, kept on the window rather than in module scope so the
// instrumentation-client entry and the app code always share it, whichever
// chunk each ends up in.
const QUEUE_KEY = '__scanartPostHogQueue';
type EventQueue = ReturnType<typeof createEventQueue>;

export function eventQueue(): EventQueue {
  const g = globalThis as typeof globalThis & { [QUEUE_KEY]?: EventQueue };
  return (g[QUEUE_KEY] ??= createEventQueue());
}

/** Sends a custom event to PostHog, or queues it until PostHog has loaded.
 * Does nothing when PostHog is not going to load on this page view. */
export function capturePostHog(event: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    eventQueue().capture(event, props);
  } catch {
    // Analytics must never break the shop.
  }
}

/** Loads PostHog after the page has finished loading, if it should load at all. */
export function startPostHog(key: string | undefined, host: string | undefined): void {
  if (typeof window === 'undefined') return;
  const queue = eventQueue();
  if (!key) return queue.off();
  const go = () => {
    const ok = shouldLoadPostHog({
      key,
      hostname: window.location.hostname,
      optedOut: isOptedOut(() => window.localStorage),
      bot: looksLikeBot(navigator, window.screen?.width ?? 0, window.screen?.height ?? 0),
    });
    if (!ok) return queue.off();
    import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(key, posthogConfig(host));
        queue.ready((event, props) => posthog.capture(event, props));
      })
      .catch(() => {
        // An ad blocker or a network failure: analytics must never break the shop.
        queue.off();
      });
  };
  const idle = () =>
    'requestIdleCallback' in window ? window.requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 1500);
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}
