// The ingestion behind POST /api/rec (T-0411): checks one recording chunk from
// lib/recorder/client.ts and stores it in R2. Kept apart from the route file so
// it can be tested with a fake fetch and no network.
//
// What protects the endpoint, since it is public:
// - Origin must be the production site, and Sec-Fetch-Site, when the browser
//   sends it, must be same-origin. Previews and localhost never record.
// - Crawler user agents are dropped.
// - The body is capped (1 MiB compressed, 10 MiB decompressed) and must be a
//   well-formed envelope: a v4 UUID session id, a chunk number up to 999, a
//   start time in the last day, 1 to 20,000 rrweb-shaped events.
// - Each chunk is written once (If-None-Match: *); a repeat cannot overwrite.
// - A per-instance rate limit per session and overall. It is best-effort
//   (each serverless instance counts on its own) and keyed on the session id,
//   because we do not read or keep IP addresses.
//
// What is stored: the events, and once per recording a meta.json with the
// start time, country (Vercel's x-vercel-ip-country header), a coarse device,
// browser and OS read from the user agent, screen size and language. No IP
// address, no full user agent, nothing that names the visitor.

import zlib from 'node:zlib';
import {
  GZIP_CONTENT_TYPE,
  JSON_CONTENT_TYPE,
  MAX_BODY_BYTES,
  MAX_RAW_BYTES,
  PRODUCTION_ORIGIN,
  RECORDER_VERSION,
  SAMPLE_RATE,
  chunkKey,
  metaKey,
  validateEnvelope,
  type RecEnvelope,
} from '@/lib/recorder/protocol';
import { putObject, type R2Config } from './r2';

const BOT_UA = /bot|crawl|spider|slurp|headless|phantomjs|lighthouse|preview|facebookexternalhit|python|curl|wget|httpclient/i;

export type IngestDeps = {
  config: R2Config | null;
  fetch?: typeof fetch;
  now?: () => number;
  limiter?: RateLimiter;
};

export type IngestResult = { status: number; reason?: string };

/** Fixed-window counters, per instance. */
export class RateLimiter {
  private windows = new Map<string, { start: number; count: number }>();
  constructor(
    private readonly perSession = 40,
    private readonly overall = 1200,
    private readonly windowMs = 60_000,
  ) {}

  allow(sessionId: string, now: number): boolean {
    if (this.windows.size > 5000) this.sweep(now);
    return this.hit('*', this.overall, now) && this.hit(sessionId, this.perSession, now);
  }

  private hit(key: string, limit: number, now: number): boolean {
    const w = this.windows.get(key);
    if (!w || now - w.start >= this.windowMs) {
      this.windows.set(key, { start: now, count: 1 });
      return true;
    }
    w.count++;
    return w.count <= limit;
  }

  private sweep(now: number): void {
    for (const [k, w] of this.windows) if (now - w.start >= this.windowMs) this.windows.delete(k);
  }
}

const defaultLimiter = new RateLimiter();

/** Reads at most `max` bytes of the body; null if it is longer. */
export async function readCapped(request: Request, max: number): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > max) return null;
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

export function decodeBody(bytes: Uint8Array, contentType: string): unknown {
  const type = contentType.split(';')[0].trim().toLowerCase();
  let text: string;
  if (type === GZIP_CONTENT_TYPE) {
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) throw new Error('not-gzip');
    text = zlib.gunzipSync(bytes, { maxOutputLength: MAX_RAW_BYTES }).toString('utf8');
  } else if (type === JSON_CONTENT_TYPE) {
    text = Buffer.from(bytes).toString('utf8');
  } else {
    throw new Error('content-type');
  }
  return JSON.parse(text);
}

/** Coarse device, browser and OS from a user agent. Only these three words
 * are kept; the user agent itself is not stored. */
export function describeAgent(ua: string): { device: string; browser: string; os: string } {
  const device = /iPad|Tablet|(Android(?!.*Mobile))/i.test(ua) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /Edg\//.test(ua)
    ? 'edge'
    : /SamsungBrowser/.test(ua)
      ? 'samsung'
      : /Firefox\/|FxiOS/.test(ua)
        ? 'firefox'
        : /OPR\/|Opera/.test(ua)
          ? 'opera'
          : /Chrome\/|CriOS/.test(ua)
            ? 'chrome'
            : /Safari\//.test(ua)
              ? 'safari'
              : 'other';
  const os = /iPhone|iPad|iPod/.test(ua)
    ? 'ios'
    : /Android/.test(ua)
      ? 'android'
      : /Mac OS X|Macintosh/.test(ua)
        ? 'macos'
        : /Windows/.test(ua)
          ? 'windows'
          : /CrOS/.test(ua)
            ? 'chromeos'
            : /Linux/.test(ua)
              ? 'linux'
              : 'other';
  return { device, browser, os };
}

export function metaFor(env: RecEnvelope, headers: Headers) {
  const country = headers.get('x-vercel-ip-country');
  return {
    sessionId: env.s,
    startedAt: new Date(env.t).toISOString(),
    recorder: `scanart-rrweb/${RECORDER_VERSION}`,
    sampleRate: SAMPLE_RATE,
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    ...describeAgent(headers.get('user-agent') || ''),
    screen: env.m?.w && env.m?.h ? `${env.m.w}x${env.m.h}` : null,
    language: env.m?.l ?? null,
  };
}

export async function ingest(request: Request, deps: IngestDeps): Promise<IngestResult> {
  const now = (deps.now ?? Date.now)();
  const h = request.headers;

  if (!deps.config) return { status: 503, reason: 'not-configured' };
  if (h.get('origin') !== PRODUCTION_ORIGIN) return { status: 403, reason: 'origin' };
  const site = h.get('sec-fetch-site');
  if (site && site !== 'same-origin') return { status: 403, reason: 'origin' };
  if (BOT_UA.test(h.get('user-agent') || '')) return { status: 204, reason: 'bot' };

  const bytes = await readCapped(request, MAX_BODY_BYTES);
  if (!bytes) return { status: 413, reason: 'too-large' };

  let body: unknown;
  try {
    body = decodeBody(bytes, h.get('content-type') || '');
  } catch (e) {
    const tooBig = e instanceof RangeError || (e as { code?: string })?.code === 'ERR_BUFFER_TOO_LARGE';
    return { status: tooBig ? 413 : 400, reason: tooBig ? 'too-large' : 'bad-body' };
  }
  const env = validateEnvelope(body, now);
  if ('error' in env) return { status: 400, reason: env.error };

  if (!(deps.limiter ?? defaultLimiter).allow(env.s, now)) return { status: 429, reason: 'rate' };

  const doFetch = deps.fetch ?? fetch;
  const data = zlib.gzipSync(JSON.stringify(env.e));
  const put = await putObject(deps.config, chunkKey(env.s, env.t, env.c), data, 'application/gzip', doFetch);
  if (put === 'failed') return { status: 502, reason: 'storage' };
  if (put === 'exists') return { status: 409, reason: 'duplicate' };

  if (env.c === 0) {
    const meta = Buffer.from(JSON.stringify(metaFor(env, h)));
    await putObject(deps.config, metaKey(env.s, env.t), meta, 'application/json', doFetch);
  }
  return { status: 204 };
}
