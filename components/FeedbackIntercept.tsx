'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { track } from '@/lib/analytics';
import { scrollDepthPercent } from '@/lib/scroll-depth';
import {
  COPY,
  DISMISSED_DAYS,
  DISMISSED_KEY,
  DONE_DAYS,
  DONE_KEY,
  FIELD_FOCUS_COOLDOWN_MS,
  KEYBOARD_HEIGHT_DELTA,
  PAYMENT_TOUCHED_KEY,
  Q1_ANSWERS,
  Q2_ANSWERS,
  checkoutEligible,
  expiryFrom,
  productPageEligible,
  suppressionReason,
  type Step,
} from '@/lib/feedback';

/**
 * The feedback intercept: "it is hidden, then it invites, it never interrupts."
 *
 * Stan's design of 2026-08-21, signed off by Mark the same day (SA Figma
 * piJ5xF6B7TKN9OqgxlaQkT, MECHANISM frame 276:210). Two decisions in it are
 * load-bearing and should not be quietly undone later:
 *
 * 1. THE INVITATION IS NOT THE FORM. One line and two buttons; the three
 *    questions only render once the visitor says yes. That is what makes it
 *    safe near a checkout, and it is why there is no "1 of 3" until step one:
 *    showing progress before consent asks for commitment nobody gave.
 * 2. NO MODAL ON CHECKOUT, EVER. A modal there would need to convert about 30%
 *    of the three people who reach checkout in a month to yield one answer,
 *    while risking 100% of the only conversions the shop has. Nothing here
 *    traps focus until the visitor has asked for the form, and on a small
 *    screen at checkout only the pill is offered.
 *
 * The suppression list in lib/feedback.ts is the design, not a safety net.
 */
export function FeedbackIntercept({ placement }: { placement: 'product' | 'checkout' }) {
  // Keyed on the path so a client-side navigation REMOUNTS this rather than
  // resetting it. That is what makes every per-view signal below a plain ref
  // with no reset logic, and it avoids setting state inside an effect.
  const pathname = usePathname();
  return <FeedbackInterceptForPath key={pathname} placement={placement} pathname={pathname} />;
}

function FeedbackInterceptForPath({
  placement,
  pathname,
}: {
  placement: 'product' | 'checkout';
  pathname: string;
}) {
  const [step, setStep] = useState<Step>('hidden');
  const [q1, setQ1] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Engagement signals, all reset per page view.
  const activeMs = useRef(0);
  const maxDepth = useRef(0);
  const anyFieldFocused = useRef(false);
  const lastBlurAt = useRef<number | null>(null);
  const lastFieldFocusAt = useRef<number | null>(null);
  const checkoutErrorAt = useRef<number | null>(null);
  const paymentInFlight = useRef(false);
  const leaving = useRef(false);

  const post = useCallback(
    (stepName: 'q1' | 'q2' | 'q3', answer: string) => {
      track('feedback-answer', { step: stepName, placement });
      // Fire and forget: a failed send must never block the next question.
      void fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepName, answer, path: pathname, placement }),
      }).catch(() => {});
    },
    [pathname, placement]
  );

  const remember = (key: string, days: number) => {
    try {
      window.localStorage.setItem(key, expiryFrom(new Date(), days));
    } catch {
      // Private mode or blocked storage: the form simply asks again next time,
      // which is the recoverable direction.
    }
  };

  const dismiss = useCallback((reason: string) => {
    remember(DISMISSED_KEY, DISMISSED_DAYS);
    track('feedback-dismissed', { reason, placement });
    setStep('pill');
  }, [placement]);

  // --- signals -------------------------------------------------------------
  useEffect(() => {
    let raf = 0;
    const tick = window.setInterval(() => {
      if (document.visibilityState === 'visible') activeMs.current += 1000;
    }, 1000);

    const measure = () => {
      raf = 0;
      const d = scrollDepthPercent(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
      if (d > maxDepth.current) maxDepth.current = d;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();

    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.matches('input, textarea, select') || t.isContentEditable);

    const onFocusIn = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      anyFieldFocused.current = true;
      lastFieldFocusAt.current = Date.now();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      lastBlurAt.current = Date.now();
      lastFieldFocusAt.current = Date.now();
    };
    // The Stripe card field is a cross-origin iframe, so focus inside it is
    // invisible to us. A window blur while an iframe is the active element is
    // the honest proxy, and it suppresses for the whole tab with no timer.
    const onWindowBlur = () => {
      if (document.activeElement?.tagName === 'IFRAME') {
        try {
          window.sessionStorage.setItem(PAYMENT_TOUCHED_KEY, '1');
        } catch {}
      }
    };
    const onPopState = () => {
      leaving.current = true;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  // --- the decision --------------------------------------------------------
  useEffect(() => {
    if (step !== 'hidden') return;
    const id = window.setInterval(() => {
      const now = new Date();
      let dismissedUntil: string | null = null;
      let doneUntil: string | null = null;
      let paymentTouched = false;
      try {
        dismissedUntil = window.localStorage.getItem(DISMISSED_KEY);
        doneUntil = window.localStorage.getItem(DONE_KEY);
        paymentTouched = window.sessionStorage.getItem(PAYMENT_TOUCHED_KEY) === '1';
      } catch {}

      const vv = window.visualViewport;
      const reason = suppressionReason({
        dismissedUntil,
        doneUntil,
        paymentTouched,
        fieldFocusedRecently:
          lastFieldFocusAt.current !== null &&
          Date.now() - lastFieldFocusAt.current < FIELD_FOCUS_COOLDOWN_MS,
        paymentInFlight: paymentInFlight.current,
        checkoutErrorRecently: checkoutErrorAt.current !== null,
        // Occlusion is the test, not co-presence: a card in dead space beside a
        // visible Add to Cart is fine, a card over it is not.
        wouldOccludeCta: overlapsPrimaryCta(cardRef.current),
        overlayOpen: document.querySelector('[data-state="open"][role="dialog"]') !== null,
        keyboardUp: !!vv && window.innerHeight - vv.height > KEYBOARD_HEIGHT_DELTA,
        consentPending: document.querySelector('[data-consent-pending]') !== null,
        viewportHeight: window.innerHeight,
        now,
      });
      if (reason) return;

      const input = {
        activeMs: activeMs.current,
        maxDepth: maxDepth.current,
        anyFieldFocused: anyFieldFocused.current,
        idleSinceBlurMs: lastBlurAt.current ? Date.now() - lastBlurAt.current : 0,
        leavingCheckout: leaving.current,
      };
      const ready = placement === 'checkout' ? checkoutEligible(input) : productPageEligible(input);
      if (ready) {
        // Stan's call, and worth keeping: on a small screen at checkout there
        // is nowhere safe for a card on a 390x844 viewport, and our mobile
        // checkout population is roughly two sessions a month, so the yield
        // does not justify the risk. Those visitors get the pill only, and can
        // open it if they want to.
        const pillOnly = placement === 'checkout' && window.innerWidth < 640;
        setStep(pillOnly ? 'pill' : 'invitation');
        track('feedback-shown', { placement, form: pillOnly ? 'pill' : 'card' });
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [step, placement]);

  // Escape dismisses from anywhere, which is 2.1.2 and also just manners.
  useEffect(() => {
    if (step === 'hidden' || step === 'pill') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss('escape');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, dismiss]);

  if (step === 'hidden') return null;

  const isForm = step === 'q1' || step === 'q2' || step === 'q3';

  if (step === 'pill') {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setStep('invitation')}
          className="h-[34px] rounded-full border border-border bg-card px-4 text-xs text-muted-foreground shadow-sm hover:text-foreground"
        >
          {COPY.pill}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      // z-40 deliberately: the cart sheet and the image lightbox are z-50 and
      // must always be able to cover this.
      className="fixed bottom-4 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg motion-safe:animate-in motion-safe:slide-in-from-bottom-2 sm:w-80"
      // The invitation is an aside, not a dialog: it must not steal focus.
      // Once the visitor has asked for the form it becomes a dialog on small
      // screens only, which is where it fills the viewport.
      role={isForm ? 'dialog' : 'complementary'}
      aria-live={step === 'invitation' ? 'polite' : undefined}
      aria-label={isForm ? COPY.invitation : undefined}
      aria-modal={undefined}
    >
      <button
        type="button"
        onClick={() => dismiss('close-button')}
        aria-label={COPY.dismissAria}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2"
      >
        <X className="h-4 w-4" />
      </button>

      {isForm && (
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          {COPY.stepOf(step === 'q1' ? 1 : step === 'q2' ? 2 : 3)}
        </p>
      )}

      {step === 'invitation' && (
        <>
          <p className="pr-6 text-sm text-foreground">{COPY.invitation}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setStep('q1')}>
              {COPY.invitationYes}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => dismiss('not-now')}>
              {COPY.invitationNo}
            </Button>
          </div>
        </>
      )}

      {step === 'q1' && (
        <>
          <p className="pr-6 text-sm text-foreground">{COPY.q1}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Q1_ANSWERS.map(a => (
              <Button
                key={a}
                size="sm"
                variant="outline"
                onClick={() => {
                  setQ1(a);
                  post('q1', a);
                  setStep('q2');
                }}
              >
                {a}
              </Button>
            ))}
          </div>
        </>
      )}

      {step === 'q2' && (
        <>
          <p className="pr-6 text-sm text-foreground">{COPY.q2}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {Q2_ANSWERS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  post('q2', a);
                  setStep('q3');
                }}
                className="rounded border border-border px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary focus-visible:outline focus-visible:outline-2"
              >
                {a}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'q3' && (
        <>
          <p className="pr-6 text-sm text-foreground">{COPY.q3}</p>
          <Textarea
            className="mt-2 text-sm"
            rows={3}
            value={freeText}
            placeholder={COPY.q3Placeholder}
            onChange={e => setFreeText(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (freeText.trim()) post('q3', freeText.trim());
                remember(DONE_KEY, DONE_DAYS);
                setStep('thanks');
              }}
            >
              {COPY.send}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                remember(DONE_KEY, DONE_DAYS);
                setStep('thanks');
              }}
            >
              {COPY.skip}
            </Button>
          </div>
        </>
      )}

      {step === 'thanks' && (
        <>
          <p className="pr-6 text-sm text-foreground">{COPY.thanks}</p>
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => setStep('hidden')}>
            {COPY.close}
          </Button>
        </>
      )}
      {q1 !== null && <span className="sr-only" data-q1={q1} />}
    </div>
  );
}

/** True when the card's rect intersects any element marked as a primary CTA.
 *  Occlusion is the test, not co-presence: sitting beside a visible Add to
 *  Cart is fine, sitting over it is not. */
function overlapsPrimaryCta(card: HTMLElement | null): boolean {
  if (!card) return false;
  const a = card.getBoundingClientRect();
  return Array.from(document.querySelectorAll('[data-primary-cta]')).some(el => {
    const b = el.getBoundingClientRect();
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  });
}
