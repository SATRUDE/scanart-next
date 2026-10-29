// The session recorder (T-0411): rrweb in the browser, sending gzipped chunks
// to our own /api/rec, which stores them in Cloudflare R2 (EU). It replaces
// Umami's recorder.js, which recorded the same rrweb events into Umami's
// database and needed Umami's tracker session to run.
//
// rrweb comes from posthog-js, which is already a dependency and ships its
// rrweb build as posthog-js/dist/rrweb (ESM, exports `record` and
// `addCustomEvent`; no cookie or storage access, checked on 29 October 2026).
// That avoids adding a package. It is imported only after the guards pass and
// the page has loaded, so it is never in the first-load bundle and seven in
// ten visitors never download it.
//
// Off unless NEXT_PUBLIC_RECORDINGS is "on", so it can be deployed before the
// R2 bucket and keys exist. See guards.ts for who is recorded and what is
// hidden, and protocol.ts for the wire format.

import {
  BLOCK_SELECTOR,
  createSession,
  isOptedOut,
  looksLikeBot,
  maskText,
  sampled,
  sendsPrivacySignal,
  shouldMaskText,
  shouldRecord,
  type RecSession,
} from './guards';
import {
  GZIP_CONTENT_TYPE,
  INGEST_PATH,
  JSON_CONTENT_TYPE,
  KEEPALIVE_MAX_BYTES,
  MAX_BODY_BYTES,
  MAX_DURATION_MS,
  RECORDER_VERSION,
  type RecEnvelope,
  type RecEvent,
} from './protocol';

const FLUSH_INTERVAL_MS = 5000;
const FLUSH_EVENT_COUNT = 200;
/** Flush early once the buffer's JSON passes this, before compression. */
const FLUSH_RAW_BYTES = 512 * 1024;
const FULL_SNAPSHOT = 2;

type Rrweb = {
  record: (options: Record<string, unknown>) => (() => void) | undefined;
  addCustomEvent: (tag: string, payload: unknown) => void;
};

/** The guards, read from the live browser. */
export function recordingAllowed(enabled: string | undefined, random: () => number = Math.random): boolean {
  if (typeof window === 'undefined') return false;
  const supported =
    typeof fetch === 'function' &&
    typeof window.CompressionStream === 'function' &&
    typeof window.crypto?.randomUUID === 'function';
  return shouldRecord({
    enabled: enabled === 'on',
    hostname: window.location.hostname,
    optedOut: isOptedOut(() => window.localStorage),
    bot: looksLikeBot(navigator, window.screen?.width ?? 0, window.screen?.height ?? 0),
    privacySignal: sendsPrivacySignal(navigator as Navigator & { msDoNotTrack?: string }, window as Window & { doNotTrack?: string }),
    supported,
    sampled: sampled(random),
  });
}

async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** One recording: buffers rrweb events and posts them as numbered chunks. */
export class Recording {
  private buffer: RecEvent[] = [];
  private rawBytes = 0;
  private stopped = false;
  private sentMeta = false;
  stop: () => void = () => {};

  constructor(
    readonly session: RecSession,
    private readonly send: (body: BodyInit, contentType: string, keepalive: boolean) => Promise<Response | void>,
    private readonly meta: () => RecEnvelope['m'],
  ) {}

  get isStopped(): boolean {
    return this.stopped;
  }

  push(event: RecEvent): void {
    if (this.stopped) return;
    if (event.timestamp - this.session.startedAt > MAX_DURATION_MS) {
      this.end();
      return;
    }
    // A full snapshot starts its own chunk, so a replay can begin at it.
    if (event.type === FULL_SNAPSHOT && this.buffer.length) this.flush();
    this.buffer.push(event);
    this.rawBytes += approxSize(event);
    if (this.buffer.length >= FLUSH_EVENT_COUNT || this.rawBytes >= FLUSH_RAW_BYTES || event.type === FULL_SNAPSHOT) {
      this.flush();
    }
  }

  private envelope(events: RecEvent[]): RecEnvelope {
    const c = this.session.nextChunk();
    const env: RecEnvelope = { v: RECORDER_VERSION, s: this.session.id, c, t: this.session.startedAt, e: events };
    if (!this.sentMeta) {
      env.m = this.meta();
      this.sentMeta = true;
    }
    return env;
  }

  private take(): RecEvent[] {
    const events = this.buffer;
    this.buffer = [];
    this.rawBytes = 0;
    return events;
  }

  /** Normal flush: gzip, then post. */
  flush(): void {
    if (!this.buffer.length) return;
    const json = JSON.stringify(this.envelope(this.take()));
    void gzip(json)
      .then(body => {
        if (body.byteLength > MAX_BODY_BYTES) return; // too big to accept: drop this chunk
        return this.send(body as BodyInit, GZIP_CONTENT_TYPE, false).then(res => {
          // The server has no bucket yet, or refuses us: stop rather than keep posting.
          if (res && (res.status === 403 || res.status === 503)) this.end();
        });
      })
      .catch(() => {});
  }

  /** The page is closing: send what is left without waiting for compression,
   * if it is small enough for a keepalive request; otherwise try the normal way. */
  flushOnHide(): void {
    if (!this.buffer.length) return;
    const env = this.envelope(this.take());
    const json = JSON.stringify(env);
    if (json.length <= KEEPALIVE_MAX_BYTES) {
      void this.send(json, JSON_CONTENT_TYPE, true).catch(() => {});
    } else {
      void gzip(json)
        .then(body => (body.byteLength <= MAX_BODY_BYTES ? this.send(body as BodyInit, GZIP_CONTENT_TYPE, body.byteLength <= KEEPALIVE_MAX_BYTES) : undefined))
        .catch(() => {});
    }
  }

  end(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.flush();
    try {
      this.stop();
    } catch {
      // rrweb already gone
    }
  }
}

function approxSize(event: RecEvent): number {
  try {
    return JSON.stringify(event).length;
  } catch {
    return 0;
  }
}

/** rrweb options: Umami's recorder settings, with more masking. */
export function recordOptions(emit: (event: RecEvent) => void): Record<string, unknown> {
  return {
    emit,
    maskAllInputs: true,
    // Every text node goes through maskTextFn, which masks text in forms,
    // data-rec-mask and on the checkout and order pages, and leaves the rest.
    maskTextSelector: '*',
    maskTextFn: (text: string, element: HTMLElement | null) =>
      shouldMaskText(element, window.location.pathname) ? maskText(text) : text,
    blockSelector: BLOCK_SELECTOR,
    inlineStylesheet: true,
    slimDOMOptions: {
      script: true,
      comment: true,
      headMetaDescKeywords: true,
      headMetaSocial: true,
      headMetaRobots: true,
      headMetaHttpEquiv: true,
      headMetaAuthorship: true,
      headMetaVerification: true,
    },
    recordCanvas: false,
    recordCrossOriginIframes: false,
    // A fresh full snapshot every 30 seconds, as Umami's recorder took.
    checkoutEveryNms: 30000,
  };
}

let started = false;

/** Starts recording after the page has loaded, if this page load is recorded. */
export function startRecorder(enabled: string | undefined): void {
  if (typeof window === 'undefined' || started || enabled !== 'on') return;
  started = true;
  const go = () => {
    if (!recordingAllowed(enabled)) return;
    import('posthog-js/dist/rrweb')
      .then(mod => begin(mod as unknown as Rrweb))
      .catch(() => {
        // An ad blocker or a network failure: recording must never break the shop.
      });
  };
  const idle = () =>
    'requestIdleCallback' in window ? window.requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 1500);
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}

function begin(rrweb: Rrweb): void {
  const session = createSession(() => window.crypto.randomUUID(), () => Date.now());
  const send = (body: BodyInit, contentType: string, keepalive: boolean) =>
    fetch(INGEST_PATH, {
      method: 'POST',
      body,
      keepalive,
      credentials: 'omit',
      headers: { 'Content-Type': contentType },
    }).catch(() => undefined);
  const rec = new Recording(session, send, () => ({
    w: window.screen?.width || undefined,
    h: window.screen?.height || undefined,
    l: navigator.language || undefined,
  }));

  const stopFn = rrweb.record(recordOptions(event => rec.push(event)));
  rec.stop = () => stopFn?.();
  const timer = window.setInterval(() => (rec.isStopped ? window.clearInterval(timer) : rec.flush()), FLUSH_INTERVAL_MS);

  // Client-side navigations, as the url-change custom events Umami's recorder
  // wrote; platform/bin/replay-timelines.mjs reads them as page changes.
  let href = window.location.href;
  const onUrl = () => {
    if (window.location.href === href || rec.isStopped) return;
    href = window.location.href;
    try {
      rrweb.addCustomEvent('url-change', { url: href });
    } catch {
      // ignore
    }
  };
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method];
    history[method] = function (this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      onUrl();
      return result;
    } as History['pushState'];
  }
  window.addEventListener('popstate', onUrl);

  const hide = () => rec.flushOnHide();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hide();
  });
  window.addEventListener('pagehide', hide);
}
