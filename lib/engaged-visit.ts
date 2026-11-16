// An "engaged visit" is a visit that did something close to buying, counted
// once per page session (T-0516). Meta can only optimise for page views today
// because add-to-carts are too rare, so this gives round-two ads a frequent
// signal to optimise for.
//
// The first of these counts, and nothing fires again until a reload or new tab:
// - gallery: the photo gallery is opened on a product page;
// - second_product: a second, different product page is viewed;
// - time_60s: 60 seconds of visible time on the site (paused while the tab is hidden).
//
// State is in memory only: nothing is written to any storage, so it needs no
// consent. What is sent, and to whom, lives in lib/commerce-measurement.ts and
// lib/posthog.ts; this module only decides when.

export type EngagedTrigger = 'gallery' | 'second_product' | 'time_60s';

export const ENGAGED_VISIBLE_MS = 60_000;

const PRODUCT_PATH = /^\/(?:no\/)?product\/([^/?#]+)/;

/** The product slug for /product/... or /no/product/..., else null. The same
 * product in English and Norwegian counts as one product. */
export function productKey(pathname: string): string | null {
  const match = PRODUCT_PATH.exec(pathname);
  return match ? match[1].toLowerCase() : null;
}

type Timers = {
  set: (fn: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
  now: () => number;
};

const realTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export function createEngagedVisit(onEngaged: (trigger: EngagedTrigger) => void, timers: Timers = realTimers) {
  let done = false;
  let products = new Set<string>();
  let visibleMs = 0;
  let runningSince: number | null = null;
  let handle: unknown;

  const fire = (trigger: EngagedTrigger) => {
    if (done) return;
    done = true;
    if (handle !== undefined) timers.clear(handle);
    handle = undefined;
    runningSince = null;
    products = new Set();
    try { onEngaged(trigger); } catch { /* measurement must never break the shop */ }
  };

  const pause = () => {
    if (runningSince === null) return;
    visibleMs += timers.now() - runningSince;
    runningSince = null;
    if (handle !== undefined) timers.clear(handle);
    handle = undefined;
  };

  const resume = () => {
    if (done || runningSince !== null) return;
    runningSince = timers.now();
    handle = timers.set(() => { handle = undefined; runningSince = null; fire('time_60s'); }, Math.max(0, ENGAGED_VISIBLE_MS - visibleMs));
  };

  return {
    get engaged() { return done; },
    /** Start timing visible time, or pause it, to follow document.visibilityState. */
    setVisible(visible: boolean) { if (visible) resume(); else pause(); },
    /** Every page view, with its pathname. Only product pages count. */
    pageView(pathname: string) {
      if (done) return;
      const key = productKey(pathname);
      if (!key) return;
      products.add(key);
      if (products.size >= 2) fire('second_product');
    },
    /** The product gallery was opened. */
    galleryOpened() { fire('gallery'); },
    stop() { pause(); },
  };
}

// The one visit for this page session.
type Visit = ReturnType<typeof createEngagedVisit>;
let visit: Visit | null = null;
let sink: (trigger: EngagedTrigger) => void = () => {};

/** Called once by the tracker component with what to do at the moment of engagement. */
export function startEngagedVisit(onEngaged: (trigger: EngagedTrigger) => void): Visit {
  sink = onEngaged;
  visit ??= createEngagedVisit(trigger => sink(trigger));
  return visit;
}

/** For the gallery, which may open before or without the tracker mounting. */
export function noteGalleryOpened(): void {
  visit?.galleryOpened();
}

export function resetEngagedVisitForTest(): void {
  visit?.stop();
  visit = null;
  sink = () => {};
}
