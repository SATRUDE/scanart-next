// Who is recorded, how a recording is identified, and what it hides (T-0411).
// Pure functions, so every rule is tested without a browser
// (lib/recorder/guards.test.ts); lib/recorder/client.ts wires them up.
//
// The rules are the ones Umami's recorder applied, plus the privacy signals:
//
// - production host only (previews and localhost never record);
// - not when the browser carries the umami.disabled opt-out flag, which Mark
//   has set in his own browsers (read only; nothing is ever written);
// - not for the crawler shapes lib/tracker-guard.ts keeps out of Umami (the
//   same looksLikeBot rule PostHog uses);
// - not when the browser sends Global Privacy Control or Do Not Track, as the
//   privacy page promises (T-0410);
// - about 30% of page loads, decided once per page load.
//
// Nothing here touches cookies, localStorage or sessionStorage beyond reading
// the opt-out flag. The session id lives in memory for the life of the tab's
// page: a client-side navigation keeps it, a reload or a new tab starts a new
// recording. That is the price of storing nothing, and it is accepted.

import { isOptedOut, looksLikeBot } from '@/lib/posthog';
import { PRODUCTION_HOST, SAMPLE_RATE } from './protocol';

export { isOptedOut, looksLikeBot };

type PrivacyNav = { globalPrivacyControl?: boolean; doNotTrack?: string | null; msDoNotTrack?: string | null };

/** True when the browser asks not to be tracked: Global Privacy Control, or
 * Do Not Track set to "1" in any of the places browsers have put it. A browser
 * that throws on reading counts as asking, so the doubt goes to the visitor. */
export function sendsPrivacySignal(nav: PrivacyNav, win?: { doNotTrack?: string | null }): boolean {
  try {
    if (nav.globalPrivacyControl === true) return true;
    return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || win?.doNotTrack === '1';
  } catch {
    return true;
  }
}

/** Decided once per page load: true for about `rate` of them. */
export function sampled(random: () => number, rate: number = SAMPLE_RATE): boolean {
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return random() < rate;
}

export type RecordInput = {
  enabled: boolean;
  hostname: string;
  optedOut: boolean;
  bot: boolean;
  privacySignal: boolean;
  /** fetch, crypto.randomUUID and CompressionStream all exist. */
  supported: boolean;
  sampled: boolean;
};

export function shouldRecord(input: RecordInput): boolean {
  return (
    input.enabled &&
    input.hostname === PRODUCTION_HOST &&
    !input.optedOut &&
    !input.bot &&
    !input.privacySignal &&
    input.supported &&
    input.sampled
  );
}

/**
 * The recording's identity: a random id and its start time, held in memory
 * only. Never written to a cookie or to storage, never derived from anything
 * about the visitor, and never linked to Umami's or PostHog's session.
 */
export type RecSession = { id: string; startedAt: number; nextChunk: () => number };

export function createSession(randomUUID: () => string, now: () => number): RecSession {
  let chunk = 0;
  return { id: randomUUID(), startedAt: now(), nextChunk: () => chunk++ };
}

// What a recording hides. rrweb masks every input's value already
// (maskAllInputs). On top of that, all text inside a form, inside anything
// marked data-rec-mask, and anywhere on the checkout and order pages is
// replaced with asterisks of the same length, so the layout still reads.

/** Pages whose text is all masked: the checkout and the order confirmation,
 * in both languages. */
const SENSITIVE_PATH = /^\/(no\/)?(checkout|order-confirmed)(\/|$)/;

export const MASK_SELECTOR = 'form, [data-rec-mask]';

/** Elements rrweb leaves out entirely, drawn as an empty box of the same
 * size: Stripe's payment iframes (cross-origin, so never readable anyway, but
 * blocked by name as well) and anything marked data-rec-block. */
export const BLOCK_SELECTOR = [
  'iframe[src*="stripe.com"]',
  'iframe[src*="stripe.network"]',
  'iframe[name^="__privateStripe"]',
  '.StripeElement',
  '[data-rec-block]',
].join(', ');

export function isSensitivePath(pathname: string): boolean {
  return SENSITIVE_PATH.test(pathname);
}

type Closest = { closest?: (selector: string) => unknown } | null;

/** Whether a piece of text should be masked, given the element it sits in and
 * the page it is on. An element that cannot be checked is masked. */
export function shouldMaskText(element: Closest, pathname: string): boolean {
  if (isSensitivePath(pathname)) return true;
  if (!element || typeof element.closest !== 'function') return true;
  try {
    return Boolean(element.closest(MASK_SELECTOR));
  } catch {
    return true;
  }
}

export function maskText(text: string): string {
  return text.replace(/\S/g, '*');
}
