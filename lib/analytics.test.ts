import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// posthog-js stand-in: records init and capture, never touches the network.
const ph = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));
vi.mock('posthog-js', () => ({ default: ph }));

import { track } from './analytics';
import { PRODUCTION_HOST, QUEUE_LIMIT, createEventQueue, eventQueue, startPostHog } from './posthog';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

type Page = { hostname?: string; optedOut?: boolean; screen?: [number, number]; webdriver?: boolean };

/** A fake browser page. requestIdleCallback is captured, so a test decides
 * when "PostHog has loaded" by calling the returned idle(). */
function page({ hostname = PRODUCTION_HOST, optedOut = false, screen = [1920, 1080], webdriver = false }: Page = {}) {
  let pending: (() => void) | undefined;
  const umami = { track: vi.fn() };
  vi.stubGlobal('window', {
    location: { hostname },
    localStorage: { getItem: (k: string) => (optedOut && k === 'umami.disabled' ? '1' : null) },
    screen: { width: screen[0], height: screen[1] },
    requestIdleCallback: (fn: () => void) => {
      pending = fn;
      return 1;
    },
    addEventListener: vi.fn(),
    umami,
  });
  vi.stubGlobal('document', { readyState: 'complete' });
  vi.stubGlobal('navigator', { userAgent: CHROME_WIN, maxTouchPoints: 0, webdriver });
  return {
    umami,
    /** Runs the deferred load step and waits for the dynamic import. */
    async idle() {
      pending?.();
      await vi.waitFor(() => expect(eventQueue().status).not.toBe('pending'));
    },
  };
}

function resetQueue() {
  delete (globalThis as Record<string, unknown>).__scanartPostHogQueue;
}

beforeEach(() => {
  resetQueue();
  ph.init.mockReset();
  ph.capture.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetQueue();
});

describe('track', () => {
  it('sends to Umami and, once loaded, to PostHog with the same name and properties', async () => {
    const p = page();
    startPostHog('phc_test', undefined);
    await p.idle();
    expect(ph.init).toHaveBeenCalledOnce();

    track('add-to-cart', { slug: 'stockholm', size: '50x70' });
    expect(p.umami.track).toHaveBeenCalledWith('add-to-cart', { slug: 'stockholm', size: '50x70' });
    expect(ph.capture).toHaveBeenCalledWith('add-to-cart', { slug: 'stockholm', size: '50x70' });
  });

  it('queues events fired before PostHog loads and sends them in order once it has', async () => {
    const p = page();
    startPostHog('phc_test', undefined);
    track('scroll-depth', { depth: 25 });
    track('cart-open');
    expect(ph.capture).not.toHaveBeenCalled();

    await p.idle();
    expect(ph.capture.mock.calls).toEqual([
      ['scroll-depth', { depth: 25 }],
      ['cart-open', undefined],
    ]);
    expect(eventQueue().size).toBe(0);
  });

  it('sends nothing to PostHog on a non-production host', async () => {
    for (const hostname of ['localhost', 'scanart-git-branch.vercel.app', 'scandinavianart.co.uk']) {
      resetQueue();
      const p = page({ hostname });
      startPostHog('phc_test', undefined);
      track('checkout');
      await p.idle();
      track('select-frame', { frame: 'oak' });
      expect(eventQueue().status, hostname).toBe('off');
    }
    expect(ph.init).not.toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it('sends nothing to PostHog with the umami.disabled opt-out flag', async () => {
    const p = page({ optedOut: true });
    startPostHog('phc_test', undefined);
    track('checkout');
    await p.idle();
    track('add-to-cart');
    expect(ph.init).not.toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it('sends nothing to PostHog for a crawler or an automated browser', async () => {
    for (const opts of [{ screen: [1280, 1200] as [number, number] }, { webdriver: true }]) {
      resetQueue();
      const p = page(opts);
      startPostHog('phc_test', undefined);
      track('gallery-image-view');
      await p.idle();
    }
    expect(ph.init).not.toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it('sends nothing to PostHog without a key', () => {
    page();
    startPostHog(undefined, undefined);
    track('checkout');
    expect(eventQueue().status).toBe('off');
    expect(ph.capture).not.toHaveBeenCalled();
  });

  it('is a no-op on the server', () => {
    expect(() => track('checkout', { a: 1 })).not.toThrow();
    expect(ph.capture).not.toHaveBeenCalled();
  });
});

describe('createEventQueue', () => {
  it('keeps only the most recent events while waiting', () => {
    const q = createEventQueue();
    for (let i = 0; i < QUEUE_LIMIT + 5; i++) q.capture(`e${i}`);
    expect(q.size).toBe(QUEUE_LIMIT);
    const sent: string[] = [];
    q.ready(e => sent.push(e));
    expect(sent[0]).toBe('e5');
    expect(sent).toHaveLength(QUEUE_LIMIT);
  });

  it('drops the queue and ignores later events once switched off', () => {
    const q = createEventQueue();
    q.capture('a');
    q.off();
    q.capture('b');
    const send = vi.fn();
    q.ready(send);
    expect(q.size).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
});
