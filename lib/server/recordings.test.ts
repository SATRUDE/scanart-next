import { describe, expect, it, vi } from 'vitest';
import zlib from 'node:zlib';

import { RateLimiter, describeAgent, ingest } from './recordings';
import { r2ConfigFromEnv, r2Host, signRequest, type R2Config } from './r2';
import { GZIP_CONTENT_TYPE, JSON_CONTENT_TYPE, PRODUCTION_ORIGIN, chunkKey, metaKey } from '@/lib/recorder/protocol';

const NOW = Date.UTC(2026, 10, 2, 12, 0, 0);
const SID = '0b8f3c2e-5d1a-4c7b-9e2f-1a2b3c4d5e6f';
const config: R2Config = { accountId: 'acc123', accessKeyId: 'AKID', secretAccessKey: 'SECRET', bucket: 'scanart-recordings', jurisdiction: 'eu' };
const CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

function envelope(over: Record<string, unknown> = {}) {
  return { v: 1, s: SID, c: 0, t: NOW - 1000, m: { w: 390, h: 844, l: 'en-GB' }, e: [{ type: 4, timestamp: NOW - 900, data: {} }], ...over };
}

function req(body: unknown, headers: Record<string, string> = {}, gzip = true) {
  const raw = JSON.stringify(body);
  return new Request('https://www.scandinavianart.co.uk/api/rec', {
    method: 'POST',
    body: gzip ? zlib.gzipSync(raw) : raw,
    headers: {
      origin: PRODUCTION_ORIGIN,
      'sec-fetch-site': 'same-origin',
      'content-type': gzip ? GZIP_CONTENT_TYPE : JSON_CONTENT_TYPE,
      'user-agent': CHROME,
      'x-vercel-ip-country': 'GB',
      'x-forwarded-for': '203.0.113.9',
      ...headers,
    },
  });
}

function fakeR2(status = 200) {
  const puts: Array<{ url: string; headers: Record<string, string>; body: Uint8Array }> = [];
  const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    puts.push({ url: String(url), headers: init?.headers as Record<string, string>, body: init?.body as Uint8Array });
    return new Response(null, { status });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, puts };
}

const deps = (f: typeof fetch) => ({ config, fetch: f, now: () => NOW, limiter: new RateLimiter() });

describe('ingest', () => {
  it('stores the events gzipped under sessions/<day>/<id>/<chunk>.json.gz, plus meta on chunk 0', async () => {
    const r2 = fakeR2();
    const res = await ingest(req(envelope()), deps(r2.fetch));
    expect(res.status).toBe(204);
    expect(r2.puts).toHaveLength(2);
    expect(r2.puts[0].url).toBe(`https://acc123.eu.r2.cloudflarestorage.com/scanart-recordings/sessions/2026-11-02/${SID}/0000.json.gz`);
    expect(r2.puts[0].headers['if-none-match']).toBe('*');
    expect(JSON.parse(zlib.gunzipSync(r2.puts[0].body).toString())).toEqual([{ type: 4, timestamp: NOW - 900, data: {} }]);
    expect(r2.puts[1].url).toContain(`/sessions/2026-11-02/${SID}/meta.json`);
  });

  it('keeps no IP address and no full user agent in the meta', async () => {
    const r2 = fakeR2();
    await ingest(req(envelope()), deps(r2.fetch));
    const meta = JSON.parse(Buffer.from(r2.puts[1].body).toString());
    expect(meta).toMatchObject({ sessionId: SID, country: 'GB', device: 'mobile', browser: 'safari', os: 'ios', screen: '390x844', language: 'en-GB' });
    const text = JSON.stringify(meta);
    expect(text).not.toContain('203.0.113.9');
    expect(text).not.toContain('Mozilla');
  });

  it('writes no meta for later chunks', async () => {
    const r2 = fakeR2();
    const res = await ingest(req(envelope({ c: 7 })), deps(r2.fetch));
    expect(res.status).toBe(204);
    expect(r2.puts).toHaveLength(1);
    expect(r2.puts[0].url).toContain('/0007.json.gz');
  });

  it('accepts the plain JSON chunk sent while a page closes', async () => {
    const r2 = fakeR2();
    expect((await ingest(req(envelope({ c: 3 }), {}, false), deps(r2.fetch))).status).toBe(204);
  });

  it('refuses other origins, cross-site requests and requests with no origin', async () => {
    const r2 = fakeR2();
    expect((await ingest(req(envelope(), { origin: 'https://evil.example' }), deps(r2.fetch))).status).toBe(403);
    expect((await ingest(req(envelope(), { 'sec-fetch-site': 'cross-site' }), deps(r2.fetch))).status).toBe(403);
    const noOrigin = req(envelope());
    noOrigin.headers.delete('origin');
    expect((await ingest(noOrigin, deps(r2.fetch))).status).toBe(403);
    expect(r2.puts).toHaveLength(0);
  });

  it('drops crawlers without storing anything', async () => {
    const r2 = fakeR2();
    const res = await ingest(req(envelope(), { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }), deps(r2.fetch));
    expect(res.status).toBe(204);
    expect(r2.puts).toHaveLength(0);
  });

  it('answers 503 and stores nothing until R2 is configured', async () => {
    expect((await ingest(req(envelope()), { config: null })).status).toBe(503);
  });

  it('refuses bodies over the size limit, compressed or decompressed', async () => {
    const r2 = fakeR2();
    const big = Buffer.alloc(2 * 1024 * 1024, 0x61);
    const tooBig = new Request('https://www.scandinavianart.co.uk/api/rec', {
      method: 'POST',
      body: big,
      headers: { origin: PRODUCTION_ORIGIN, 'content-type': JSON_CONTENT_TYPE, 'user-agent': CHROME },
    });
    expect((await ingest(tooBig, deps(r2.fetch))).status).toBe(413);
    // A small gzip that expands past 10 MiB.
    const bomb = zlib.gzipSync(Buffer.alloc(12 * 1024 * 1024, 0x20));
    const bombReq = new Request('https://www.scandinavianart.co.uk/api/rec', {
      method: 'POST',
      body: bomb,
      headers: { origin: PRODUCTION_ORIGIN, 'content-type': GZIP_CONTENT_TYPE, 'user-agent': CHROME },
    });
    expect((await ingest(bombReq, deps(r2.fetch))).status).toBe(413);
    expect(r2.puts).toHaveLength(0);
  });

  it('refuses malformed envelopes', async () => {
    const r2 = fakeR2();
    const bad = [
      envelope({ s: 'not-a-uuid' }),
      envelope({ s: '../../etc' }),
      envelope({ c: -1 }),
      envelope({ c: 1000 }),
      envelope({ c: 1.5 }),
      envelope({ t: NOW - 3 * 24 * 3600 * 1000 }),
      envelope({ t: NOW + 3600 * 1000 }),
      envelope({ e: [] }),
      envelope({ e: [{ type: 9, timestamp: 1 }] }),
      envelope({ e: [{ type: 3 }] }),
      envelope({ v: 2 }),
    ];
    for (const b of bad) expect((await ingest(req(b), deps(r2.fetch))).status, JSON.stringify(b).slice(0, 80)).toBe(400);
    const wrongType = req(envelope(), { 'content-type': 'text/plain' });
    expect((await ingest(wrongType, deps(r2.fetch))).status).toBe(400);
    expect(r2.puts).toHaveLength(0);
  });

  it('never overwrites a chunk that is already stored', async () => {
    const r2 = fakeR2(412);
    expect((await ingest(req(envelope({ c: 2 })), deps(r2.fetch))).status).toBe(409);
  });

  it('reports a storage failure', async () => {
    const r2 = fakeR2(500);
    expect((await ingest(req(envelope({ c: 2 })), deps(r2.fetch))).status).toBe(502);
  });

  it('rate-limits one session', async () => {
    const r2 = fakeR2();
    const limiter = new RateLimiter(3, 100);
    const d = { config, fetch: r2.fetch, now: () => NOW, limiter };
    const codes = [];
    for (let c = 1; c <= 5; c++) codes.push((await ingest(req(envelope({ c })), d)).status);
    expect(codes).toEqual([204, 204, 204, 429, 429]);
  });
});

describe('RateLimiter', () => {
  it('opens a new window after a minute', () => {
    const l = new RateLimiter(1, 10);
    expect(l.allow('a', 0)).toBe(true);
    expect(l.allow('a', 1)).toBe(false);
    expect(l.allow('a', 60_000)).toBe(true);
  });

  it('caps all sessions together', () => {
    const l = new RateLimiter(10, 2);
    expect([l.allow('a', 0), l.allow('b', 0), l.allow('c', 0)]).toEqual([true, true, false]);
  });
});

describe('describeAgent', () => {
  it('reads coarse device, browser and OS', () => {
    expect(describeAgent(CHROME)).toEqual({ device: 'mobile', browser: 'safari', os: 'ios' });
    expect(
      describeAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0'),
    ).toEqual({ device: 'desktop', browser: 'edge', os: 'windows' });
    expect(describeAgent('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/141 Safari/537.36')).toMatchObject({
      device: 'tablet',
      os: 'android',
    });
  });
});

describe('R2', () => {
  it('needs all four env vars, and defaults to the EU jurisdiction', () => {
    expect(r2ConfigFromEnv({})).toBeNull();
    expect(r2ConfigFromEnv({ R2_ACCOUNT_ID: 'a', R2_ACCESS_KEY_ID: 'b', R2_SECRET_ACCESS_KEY: 'c' })).toBeNull();
    const c = r2ConfigFromEnv({ R2_ACCOUNT_ID: 'a', R2_ACCESS_KEY_ID: 'b', R2_SECRET_ACCESS_KEY: 'c', R2_RECORDINGS_BUCKET: 'd' });
    expect(c?.jurisdiction).toBe('eu');
    expect(r2Host(c!)).toBe('a.eu.r2.cloudflarestorage.com');
    expect(r2Host({ accountId: 'a', jurisdiction: 'default' })).toBe('a.r2.cloudflarestorage.com');
  });

  it('signs with SigV4 for region auto, without leaking the secret', () => {
    const signed = signRequest({
      config,
      method: 'PUT',
      key: chunkKey(SID, NOW, 0),
      headers: { 'content-type': 'application/gzip', 'if-none-match': '*' },
      body: new Uint8Array([1, 2, 3]),
      now: new Date(NOW),
    });
    expect(signed.headers.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKID\/20261102\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;if-none-match;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    expect(signed.headers['x-amz-date']).toBe('20261102T120000Z');
    expect(JSON.stringify(signed)).not.toContain('SECRET');
    expect(signed.headers.host).toBeUndefined();
  });

  it('puts meta and chunks in the same prefix', () => {
    expect(metaKey(SID, NOW)).toBe(`sessions/2026-11-02/${SID}/meta.json`);
    expect(chunkKey(SID, NOW, 12)).toBe(`sessions/2026-11-02/${SID}/0012.json.gz`);
  });
});
