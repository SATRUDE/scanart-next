// The wire format between the session recorder (lib/recorder/client.ts) and
// the ingestion route (app/api/rec/route.ts), and the object layout in R2
// (T-0411). Shared by both sides so a limit can only be changed in one place.
//
// One POST carries one chunk of one recording:
//
//   { v: 1, s: <session id>, c: <chunk index>, t: <recording start, ms>,
//     m: { w, h, l } (chunk 0 only: screen width, height, language),
//     e: [ ...rrweb events ] }
//
// gzipped in the browser (CompressionStream) and sent as
// application/x-rec+gzip, or, for the last small chunk sent while the page is
// being closed, as plain application/json, because compression is
// asynchronous and a closing page may not wait for it.
//
// Stored as sessions/YYYY-MM-DD/<session id>/<chunk>.json.gz, the date being
// the UTC day the recording started, so one recording stays under one prefix
// even across midnight. The object is the gzipped JSON array of events, the
// same shape as a row of Umami's session_replay table, so
// platform/bin/replay-timelines.mjs reads both the same way.

export const RECORDER_VERSION = 1;

/** The only host that records, as for Umami (data-domains) and PostHog. */
export const PRODUCTION_HOST = 'www.scandinavianart.co.uk';
export const PRODUCTION_ORIGIN = `https://${PRODUCTION_HOST}`;
export const INGEST_PATH = '/api/rec';

export const GZIP_CONTENT_TYPE = 'application/x-rec+gzip';
export const JSON_CONTENT_TYPE = 'application/json';

/** Share of page loads recorded: Umami's replay sample on 29 October 2026. */
export const SAMPLE_RATE = 0.3;
/** A recording stops after five minutes, as Umami's did. */
export const MAX_DURATION_MS = 5 * 60 * 1000;

/** Largest request body accepted, compressed. A full snapshot of the heaviest
 * page gzips to well under this. */
export const MAX_BODY_BYTES = 1024 * 1024;
/** Largest chunk accepted once decompressed, so a small gzip bomb is refused. */
export const MAX_RAW_BYTES = 10 * 1024 * 1024;
/** keepalive requests (sent while the page closes) are capped at 64 KiB by
 * browsers; stay under it. */
export const KEEPALIVE_MAX_BYTES = 60 * 1024;
export const MAX_EVENTS_PER_CHUNK = 20000;
/** Five minutes of recording at one flush every few seconds, plus the extra
 * chunks each full snapshot starts, is far below this. */
export const MAX_CHUNK_INDEX = 999;

const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export type RecMeta = { w?: number; h?: number; l?: string };
export type RecEvent = { type: number; timestamp: number; data?: unknown; [k: string]: unknown };
export type RecEnvelope = { v: 1; s: string; c: number; t: number; m?: RecMeta; e: RecEvent[] };

export function isSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID.test(value);
}

/** sessions/YYYY-MM-DD/<id>/<chunk>.json.gz, chunk zero-padded so a plain
 * listing comes back in order. */
export function chunkKey(sessionId: string, startedAt: number, chunk: number): string {
  return `${sessionPrefix(sessionId, startedAt)}${String(chunk).padStart(4, '0')}.json.gz`;
}

export function metaKey(sessionId: string, startedAt: number): string {
  return `${sessionPrefix(sessionId, startedAt)}meta.json`;
}

export function sessionPrefix(sessionId: string, startedAt: number): string {
  return `sessions/${new Date(startedAt).toISOString().slice(0, 10)}/${sessionId}/`;
}

/**
 * Checks a decoded body and returns the envelope, or the reason it is refused.
 * `now` is the server's clock: a recording must have started within the last
 * day and not in the future (with a few minutes' slack for a wrong clock).
 */
export function validateEnvelope(body: unknown, now: number): RecEnvelope | { error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'not-an-object' };
  const b = body as Record<string, unknown>;
  if (b.v !== RECORDER_VERSION) return { error: 'version' };
  if (!isSessionId(b.s)) return { error: 'session' };
  if (typeof b.c !== 'number' || !Number.isInteger(b.c) || b.c < 0 || b.c > MAX_CHUNK_INDEX) return { error: 'chunk' };
  if (typeof b.t !== 'number' || !Number.isFinite(b.t)) return { error: 'start' };
  if (b.t < now - 24 * 60 * 60 * 1000 || b.t > now + 10 * 60 * 1000) return { error: 'start' };
  if (!Array.isArray(b.e) || b.e.length === 0 || b.e.length > MAX_EVENTS_PER_CHUNK) return { error: 'events' };
  for (const ev of b.e) {
    if (!ev || typeof ev !== 'object') return { error: 'event' };
    const { type, timestamp } = ev as Record<string, unknown>;
    if (typeof type !== 'number' || !Number.isInteger(type) || type < 0 || type > 6) return { error: 'event' };
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return { error: 'event' };
  }
  let m: RecMeta | undefined;
  if (b.c === 0 && b.m && typeof b.m === 'object') {
    const raw = b.m as Record<string, unknown>;
    const dim = (n: unknown) => (typeof n === 'number' && Number.isInteger(n) && n > 0 && n < 20000 ? n : undefined);
    const lang = typeof raw.l === 'string' && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(raw.l) ? raw.l : undefined;
    m = { w: dim(raw.w), h: dim(raw.h), l: lang };
  }
  return { v: 1, s: b.s, c: b.c, t: b.t, m, e: b.e as RecEvent[] };
}
