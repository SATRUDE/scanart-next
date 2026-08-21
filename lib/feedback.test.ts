import { describe, it, expect } from 'vitest';
import {
  CHECKOUT_IDLE_MS,
  CHECKOUT_UNTOUCHED_MS,
  DISMISSED_DAYS,
  MIN_VIEWPORT_HEIGHT,
  PRODUCT_DWELL_MS,
  PRODUCT_MIN_DEPTH,
  Q1_ANSWERS,
  Q2_ANSWERS,
  checkoutEligible,
  expiryFrom,
  isSuppressed,
  productPageEligible,
  suppressionReason,
  type SuppressionInput,
} from './feedback';

const NOW = new Date('2026-09-01T12:00:00.000Z');

/** Nothing suppressed, so each test can turn on exactly one thing. */
const clear = (): SuppressionInput => ({
  dismissedUntil: null,
  doneUntil: null,
  paymentTouched: false,
  fieldFocusedRecently: false,
  paymentInFlight: false,
  checkoutErrorRecently: false,
  wouldOccludeCta: false,
  overlayOpen: false,
  keyboardUp: false,
  consentPending: false,
  viewportHeight: 900,
  now: NOW,
});

describe('feedback triggers', () => {
  it('needs BOTH dwell and depth on a product page, so a timer alone never fires', () => {
    expect(productPageEligible({ activeMs: PRODUCT_DWELL_MS, maxDepth: PRODUCT_MIN_DEPTH })).toBe(true);
    expect(productPageEligible({ activeMs: PRODUCT_DWELL_MS, maxDepth: 49 })).toBe(false);
    expect(productPageEligible({ activeMs: PRODUCT_DWELL_MS - 1, maxDepth: 100 })).toBe(false);
  });

  it('never asks anyone who has touched the checkout form', () => {
    // The strongest rule in the design: typing means mid-purchase, off limits,
    // whatever the timers say.
    expect(
      checkoutEligible({ activeMs: 10 * CHECKOUT_UNTOUCHED_MS, maxDepth: 100, anyFieldFocused: true })
    ).toBe(false);
    expect(
      checkoutEligible({ activeMs: 0, maxDepth: 0, anyFieldFocused: true, leavingCheckout: true })
    ).toBe(false);
  });

  it('asks the 2026-08-11 visitor: whole page read, no field touched', () => {
    expect(
      checkoutEligible({ activeMs: CHECKOUT_UNTOUCHED_MS, maxDepth: 100, anyFieldFocused: false })
    ).toBe(true);
  });

  it('asks on back-navigation out of checkout, and on a long idle', () => {
    expect(checkoutEligible({ activeMs: 0, maxDepth: 0, leavingCheckout: true })).toBe(true);
    expect(checkoutEligible({ activeMs: 0, maxDepth: 0, idleSinceBlurMs: CHECKOUT_IDLE_MS })).toBe(true);
    expect(checkoutEligible({ activeMs: 0, maxDepth: 0, idleSinceBlurMs: CHECKOUT_IDLE_MS - 1 })).toBe(false);
  });
});

describe('feedback suppression', () => {
  it('renders when nothing is suppressing it', () => {
    expect(suppressionReason(clear())).toBeNull();
  });

  it.each<[keyof SuppressionInput, unknown, string]>([
    ['paymentTouched', true, 'payment-touched-this-session'],
    ['paymentInFlight', true, 'payment-in-flight'],
    ['checkoutErrorRecently', true, 'checkout-error-just-fired'],
    ['fieldFocusedRecently', true, 'form-field-in-use'],
    ['overlayOpen', true, 'overlay-open'],
    ['keyboardUp', true, 'keyboard-up'],
    ['consentPending', true, 'consent-unanswered'],
    ['wouldOccludeCta', true, 'would-occlude-cta'],
    ['viewportHeight', MIN_VIEWPORT_HEIGHT - 1, 'viewport-too-short'],
  ])('suppresses on %s and says why', (key, value, reason) => {
    expect(suppressionReason({ ...clear(), [key]: value })).toBe(reason);
  });

  it('puts a submitted answer ahead of everything, so nobody is asked twice', () => {
    const s = { ...clear(), doneUntil: expiryFrom(NOW, 365), dismissedUntil: expiryFrom(NOW, 60) };
    expect(suppressionReason(s)).toBe('already-answered');
  });

  it('lets a lapsed dismissal through rather than silencing for ever', () => {
    const lapsed = new Date(NOW.getTime() - 1000).toISOString();
    expect(suppressionReason({ ...clear(), dismissedUntil: lapsed })).toBeNull();
  });
});

describe('the stored expiry, which is all a key ever holds', () => {
  it('is an ISO date the given number of days out', () => {
    expect(expiryFrom(NOW, DISMISSED_DAYS)).toBe('2026-10-31T12:00:00.000Z');
  });

  it('reads a future date as suppressed and a past one as not', () => {
    expect(isSuppressed(expiryFrom(NOW, 1), NOW)).toBe(true);
    expect(isSuppressed(expiryFrom(NOW, -1), NOW)).toBe(false);
  });

  it('treats absent or corrupted storage as NOT suppressed', () => {
    // Recoverable direction: a mangled key should mean "ask again", never
    // "never ask this person anything".
    expect(isSuppressed(null, NOW)).toBe(false);
    expect(isSuppressed('not a date', NOW)).toBe(false);
    expect(isSuppressed('', NOW)).toBe(false);
  });
});

describe('the questions', () => {
  it('offers Other on Q2, so an answer we did not predict is still possible', () => {
    expect(Q2_ANSWERS).toContain('Other');
  });

  it('keeps Q1 to three one-tap answers', () => {
    expect(Q1_ANSWERS).toHaveLength(3);
  });
});
