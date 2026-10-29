// The ingestion behind POST /api/rec (T-0411): checks one recording chunk from
// lib/recorder/client.ts and stores it in R2. Kept apart from the route file so
// it can be tested with a fake fetch and no network.
//
// What protects the endpoint, since it is public, in the order it is checked
// (nothing before step 7 touches R2):
// 1. Origin must be the production site, and Sec-Fetch-Site, when the browser
//    sends it, must be same-origin. Previews and localhost never record.
// 2. Crawler user agents are dropped.
// 3. A per-IP rate limit, in memory: the IP is turned into an HMAC with a key
//    made fresh by each instance and never written anywhere, so no IP address
//    is stored, even in memory, and the counter forgets it within the hour.
// 4. The body is capped at 192 KiB compressed: refused on its Content-Length
//    before reading, and reading stops the moment it passes the cap. 4 MiB
//    decompressed, so a gzip bomb is refused.
// 5. A well-formed envelope: a v4 UUID session id, a chunk number 0 to 119, a
//    start time in the last day, 1 to 20,000 rrweb-shaped events.
// 6. A per-session and overall rate limit (per instance, best effort).
// 7. The free-tier cap: every PUT is paid for from today's budget first
//    (lib/server/recording-budget.ts). Spent, or uncheckable: dropped, 429.
// 8. Each chunk is written once (If-None-Match: *); a repeat cannot overwrite.
//
// Every refusal is final: the recorder stops for the tab on any answer that is
// not 2xx, and nothing on either side retries.
//
// What is stored: the events, and once per recording a meta.json with the
// start time, country (Vercel's x-vercel-ip-country header), a coarse device,
// browser and OS read from the user agent, screen size and language. No IP
// address, no full user agent, nothing that names the visitor.

import crypto from 'node:crypto';
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
import { headObject, putObject, type R2Config } from './r2';
import { DailyBudget, type LeaseStore } from './recording-budget';

const BOT_UA = /bot|crawl|spider|slurp|headless|phantomjs|lighthouse|preview|facebookexternalhit|python|curl|wget|httpclient/i;

export type IngestDeps = {
  config: R2Config | null;
  fetch?: typeof fetch;
  now?: () => number;
  limiter?: RateLimiter;
  ipLimiter?: IpRateLimiter;
  budget?: DailyBudget;
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

/**
 * Per-IP limits without keeping IPs: the key is an HMAC of the address under a
 * random key that exists only in this instance's memory, so the map holds
 * opaque values that cannot be turned back into an address or matched across
 * instances, and they are swept when their window ends.
 */
export class IpRateLimiter {
  private readonly secret = crypto.randomBytes(32);
  private readonly perMinute: RateLimiter;
  private readonly newSessionsPerHour: RateLimiter;

  constructor(requestsPerMinute = 120, sessionsPerHour = 20) {
    this.perMinute = new RateLimiter(requestsPerMinute, Number.MAX_SAFE_INTEGER, 60_000);
    this.newSessionsPerHour = new RateLimiter(sessionsPerHour, Number.MAX_SAFE_INTEGER, 3_600_000);
  }

  key(ip: string): string {
    return crypto.createHmac('sha256', this.secret).update(ip).digest('base64url').slice(0, 22);
  }

  /** Every request counts against the per-minute limit. */
  allowRequest(ip: string, now: number): boolean {
    return this.perMinute.allow(this.key(ip), now);
  }

  /** A recording's first chunk also counts against the hourly limit on new
   * recordings. */
  allowNewSession(ip: string, now: number): boolean {
    return this.newSessionsPerHour.allow(this.key(ip), now);
  }
}

const defaultIpLimiter = new IpRateLimiter();

/** The client's address as Vercel reports it. Used only to rate-limit, as an
 * HMAC; never logged or stored. */
export function clientIp(headers: Headers): string {
  return (headers.get('x-forwarded-for') || '').split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';
}

let defaultBudget: { config: R2Config; budget: DailyBudget } | null = null;

function leaseStore(config: R2Config, doFetch: typeof fetch): LeaseStore {
  return {
    exists: key => headObject(config, key, doFetch),
    claim: key => putObject(config, key, new Uint8Array(), 'application/octet-stream', doFetch),
  };
}

function budgetFor(config: R2Config, doFetch: typeof fetch): DailyBudget {
  if (!defaultBudget || defaultBudget.config !== config) {
    defaultBudget = { config, budget: new DailyBudget(leaseStore(config, doFetch)) };
  }
  return defaultBudget.budget;
}

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

  const ip = clientIp(h);
  const ipLimiter = deps.ipLimiter ?? defaultIpLimiter;
  if (!ipLimiter.allowRequest(ip, now)) return { status: 429, reason: 'rate' };

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
  if (env.c === 0 && !ipLimiter.allowNewSession(ip, now)) return { status: 429, reason: 'rate' };

  const doFetch = deps.fetch ?? fetch;
  const data = zlib.gzipSync(JSON.stringify(env.e));
  if (data.byteLength > MAX_BODY_BYTES) return { status: 413, reason: 'too-large' };
  const meta = env.c === 0 ? Buffer.from(JSON.stringify(metaFor(env, h))) : null;

  // The free-tier cap: pay for every PUT before sending it (fail closed).
  const budget = deps.budget ?? budgetFor(deps.config, doFetch);
  if (!(await budget.reserve(meta ? 2 : 1, data.byteLength + (meta?.byteLength ?? 0)))) {
    return { status: 429, reason: 'budget' };
  }

  const put = await putObject(deps.config, chunkKey(env.s, env.t, env.c), data, 'application/gzip', doFetch);
  if (put === 'failed') return { status: 502, reason: 'storage' };
  if (put === 'exists') return { status: 409, reason: 'duplicate' };
  if (meta) await putObject(deps.config, metaKey(env.s, env.t), meta, 'application/json', doFetch);
  return { status: 204 };
}
