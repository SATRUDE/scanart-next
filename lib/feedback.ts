// The feedback intercept's memory and its questions.
//
// Design: Stan's proposal of 2026-08-21, signed off by Mark the same day
// (SA Figma file piJ5xF6B7TKN9OqgxlaQkT, MECHANISM frame 276:210). The
// governing sentence is "it is hidden, then it invites, it never interrupts":
// a timer plus an engagement signal opens a small corner card that asks
// permission first, and the three questions only render if the visitor says
// yes.
//
// Everything here is pure and side-effect-free apart from the two storage
// helpers, so the parts worth being sure about are testable without a browser.

/** Storage keys. Each holds an ISO expiry date and NOTHING else: no visitor
 *  id, no cookie, so this adds nothing to the consent banner's remit. */
export const DISMISSED_KEY = 'sa_fb_dismissed';
export const DONE_KEY = 'sa_fb_done';
export const PAYMENT_TOUCHED_KEY = 'sa_fb_payment_touched';

/** Dismissing parks it for two months; answering retires it for a year. */
export const DISMISSED_DAYS = 60;
export const DONE_DAYS = 365;

/** Product page: both must be true, so a timer alone never fires. */
export const PRODUCT_DWELL_MS = 45_000;
export const PRODUCT_MIN_DEPTH = 50;

/** Checkout: any one of these, and only with no field ever focused. */
export const CHECKOUT_UNTOUCHED_MS = 90_000;
export const CHECKOUT_IDLE_MS = 20_000;

/** Suppression windows. */
export const FIELD_FOCUS_COOLDOWN_MS = 8_000;
export const CHECKOUT_ERROR_COOLDOWN_MS = 30_000;
export const CONSENT_QUEUE_GAP_MS = 5_000;
/** Below this the viewport is a landscape phone and there is nowhere to put it. */
export const MIN_VIEWPORT_HEIGHT = 480;
/** The on-screen keyboard is up if the visual viewport is this much shorter. */
export const KEYBOARD_HEIGHT_DELTA = 150;

export type Step = 'invitation' | 'q1' | 'q2' | 'q3' | 'thanks' | 'pill' | 'hidden';

export const Q1_ANSWERS = ['Yes', 'Nearly', 'No'] as const;

/**
 * Q2's options are not invented. Each maps to an open finding on the ScanArt
 * board, so every answer either points at something already known or at
 * something missed, and both are useful:
 *   price / delivery cost -> the flat delivery-rate table
 *   delivery time         -> the 5-6 day Norwegian route
 *   not sure about us     -> the checkout-trust finding
 *   size or frame         -> the size and framing questions in collection FAQs
 *   something broke       -> anything we have not seen
 */
export const Q2_ANSWERS = [
  'Just browsing',
  'Price',
  'Delivery cost',
  'Delivery time',
  'I was not sure about the shop',
  'I could not find the right size or frame',
  'Something did not work',
  'Other',
] as const;

export const COPY = {
  invitation: 'Could we ask you three quick questions?',
  invitationYes: 'Yes, happy to',
  invitationNo: 'Not now',
  pill: 'Give feedback',
  q1: 'Did you find what you were looking for?',
  q2: 'What stopped you buying today?',
  q3: 'Anything else you would tell us?',
  q3Placeholder: 'Optional, and read by a person',
  send: 'Send',
  skip: 'Skip',
  thanks: 'Thank you, that is genuinely useful.',
  close: 'Close',
  dismissAria: 'Dismiss this feedback request',
  stepOf: (n: number) => `${n} of 3`,
} as const;

/** An ISO date `days` from `now`, which is all a storage key ever holds. */
export function expiryFrom(now: Date, days: number): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

/** True when a stored expiry exists and has not passed. Unparseable or absent
 *  reads as "not suppressed": a corrupted key should not silence the form for
 *  ever, and asking again is the recoverable direction. */
export function isSuppressed(stored: string | null, now: Date): boolean {
  if (!stored) return false;
  const at = Date.parse(stored);
  if (Number.isNaN(at)) return false;
  return at > now.getTime();
}

export interface EligibilityInput {
  /** Milliseconds of ACTIVE time on this page: a background tab accrues none. */
  activeMs: number;
  /** Deepest scroll reached this page view, as a percentage. */
  maxDepth: number;
  /** Checkout only: has any form field ever been focused this page view. */
  anyFieldFocused?: boolean;
  /** Checkout only: ms since the last field blur, when the form is incomplete. */
  idleSinceBlurMs?: number;
  /** Checkout only: the visitor is navigating back out of checkout. */
  leavingCheckout?: boolean;
}

/** Product page: 45s of active time AND half the page read. */
export function productPageEligible(i: EligibilityInput): boolean {
  return i.activeMs >= PRODUCT_DWELL_MS && i.maxDepth >= PRODUCT_MIN_DEPTH;
}

/**
 * Checkout: only ever for someone who has not started filling it in.
 *
 * The 90-second arm is aimed at one real visitor, on 2026-08-11, who read the
 * whole checkout page and left 19 seconds later without touching a field. The
 * idle arm catches someone who began and stalled. Both are gated on the form
 * never having been focused, because anyone typing is mid-purchase and off
 * limits.
 */
export function checkoutEligible(i: EligibilityInput): boolean {
  if (i.anyFieldFocused) return false;
  if (i.leavingCheckout) return true;
  if (i.activeMs >= CHECKOUT_UNTOUCHED_MS) return true;
  return (i.idleSinceBlurMs ?? 0) >= CHECKOUT_IDLE_MS;
}

export interface SuppressionInput {
  dismissedUntil: string | null;
  doneUntil: string | null;
  /** The Stripe iframe has been focused at some point this tab's life. */
  paymentTouched: boolean;
  /** A checkout field has focus, or lost it within the cooldown. */
  fieldFocusedRecently: boolean;
  /** A payment is in flight: the site tells the buyer this can take a minute. */
  paymentInFlight: boolean;
  /** A checkout-error fired within the cooldown. */
  checkoutErrorRecently: boolean;
  /** The card's rect would overlap a primary CTA. Occlusion, not co-presence. */
  wouldOccludeCta: boolean;
  /** The cart sheet or the image lightbox is open. Both sit above this. */
  overlayOpen: boolean;
  /** The on-screen keyboard is up. */
  keyboardUp: boolean;
  /** The cookie-consent banner is showing and unanswered. */
  consentPending: boolean;
  viewportHeight: number;
  now: Date;
}

/**
 * Any one of these true means nothing renders. The list IS the design: what
 * keeps this safe next to a checkout is not the card's size but the number of
 * situations in which it refuses to appear.
 *
 * Returns the reason rather than a boolean so a decision can be explained,
 * which matters when someone asks in a month why nobody has been asked.
 */
export function suppressionReason(s: SuppressionInput): string | null {
  if (isSuppressed(s.doneUntil, s.now)) return 'already-answered';
  if (isSuppressed(s.dismissedUntil, s.now)) return 'recently-dismissed';
  if (s.paymentTouched) return 'payment-touched-this-session';
  if (s.paymentInFlight) return 'payment-in-flight';
  if (s.checkoutErrorRecently) return 'checkout-error-just-fired';
  if (s.fieldFocusedRecently) return 'form-field-in-use';
  if (s.overlayOpen) return 'overlay-open';
  if (s.keyboardUp) return 'keyboard-up';
  if (s.consentPending) return 'consent-unanswered';
  if (s.viewportHeight < MIN_VIEWPORT_HEIGHT) return 'viewport-too-short';
  if (s.wouldOccludeCta) return 'would-occlude-cta';
  return null;
}
