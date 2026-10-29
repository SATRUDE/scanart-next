import { describe, expect, it, vi } from 'vitest';
import zlib from 'node:zlib';

import { Recording, recordOptions } from './client';
import { createSession } from './guards';
import { GZIP_CONTENT_TYPE, JSON_CONTENT_TYPE, MAX_DURATION_MS, type RecEnvelope } from './protocol';

type Sent = { body: BodyInit; contentType: string; keepalive: boolean };

function setup() {
  const sent: Sent[] = [];
  const send = vi.fn(async (body: BodyInit, contentType: string, keepalive: boolean) => {
    sent.push({ body, contentType, keepalive });
    return new Response(null, { status: 204 });
  });
  const session = createSession(() => '0b8f3c2e-5d1a-4c7b-9e2f-1a2b3c4d5e6f', () => 1_000_000);
  const rec = new Recording(session, send, () => ({ w: 390, h: 844, l: 'en-GB' }));
  return { rec, sent, send };
}

function decode(s: Sent): RecEnvelope {
  if (s.contentType === GZIP_CONTENT_TYPE) return JSON.parse(zlib.gunzipSync(s.body as Uint8Array).toString());
  return JSON.parse(s.body as string);
}

const settle = () => new Promise(r => setTimeout(r, 20));

describe('Recording', () => {
  it('sends a full snapshot as its own gzipped chunk, with the session and screen on chunk 0', async () => {
    const { rec, sent } = setup();
    rec.push({ type: 4, timestamp: 1_000_010, data: { href: 'https://x/', width: 1, height: 1 } });
    rec.push({ type: 2, timestamp: 1_000_011, data: {} });
    await settle();
    expect(sent).toHaveLength(2);
    const [first, second] = sent.map(decode);
    expect(first.c).toBe(0);
    expect(first.s).toBe('0b8f3c2e-5d1a-4c7b-9e2f-1a2b3c4d5e6f');
    expect(first.t).toBe(1_000_000);
    expect(first.m).toEqual({ w: 390, h: 844, l: 'en-GB' });
    expect(first.e.map(e => e.type)).toEqual([4]);
    expect(second.c).toBe(1);
    expect(second.m).toBeUndefined();
    expect(second.e.map(e => e.type)).toEqual([2]);
    expect(sent.every(s => s.contentType === GZIP_CONTENT_TYPE && !s.keepalive)).toBe(true);
  });

  it('batches small events until flushed', async () => {
    const { rec, sent } = setup();
    for (let i = 0; i < 10; i++) rec.push({ type: 3, timestamp: 1_000_100 + i, data: { source: 1 } });
    await settle();
    expect(sent).toHaveLength(0);
    rec.flush();
    await settle();
    expect(sent).toHaveLength(1);
    expect(decode(sent[0]).e).toHaveLength(10);
  });

  it('flushes on its own once the batch is large', async () => {
    const { rec, sent } = setup();
    for (let i = 0; i < 200; i++) rec.push({ type: 3, timestamp: 1_000_100 + i, data: { source: 1 } });
    await settle();
    expect(sent).toHaveLength(1);
  });

  it('sends what is left as plain JSON with keepalive when the page closes', async () => {
    const { rec, sent } = setup();
    rec.push({ type: 3, timestamp: 1_000_100, data: { source: 2 } });
    rec.flushOnHide();
    expect(sent).toHaveLength(1);
    expect(sent[0].contentType).toBe(JSON_CONTENT_TYPE);
    expect(sent[0].keepalive).toBe(true);
    expect(decode(sent[0]).e).toHaveLength(1);
  });

  it('stops after five minutes', async () => {
    const { rec, sent } = setup();
    const stop = vi.fn();
    rec.stop = stop;
    rec.push({ type: 3, timestamp: 1_000_100, data: {} });
    rec.push({ type: 3, timestamp: 1_000_000 + MAX_DURATION_MS + 1, data: {} });
    await settle();
    expect(stop).toHaveBeenCalledOnce();
    expect(rec.isStopped).toBe(true);
    expect(sent).toHaveLength(1);
    expect(decode(sent[0]).e).toHaveLength(1);
    rec.push({ type: 3, timestamp: 1_000_200, data: {} });
    rec.flush();
    await settle();
    expect(sent).toHaveLength(1);
  });

  it('stops when the server says it is not configured or refuses the origin', async () => {
    const { rec } = setup();
    (rec as unknown as { send: unknown }).send = async () => new Response(null, { status: 503 });
    rec.push({ type: 3, timestamp: 1_000_100, data: {} });
    rec.flush();
    await settle();
    expect(rec.isStopped).toBe(true);
  });
});

describe('recordOptions', () => {
  it('keeps Umami recorder behaviour and adds masking and blocking', () => {
    const o = recordOptions(() => {});
    expect(o.maskAllInputs).toBe(true);
    expect(o.maskTextSelector).toBe('*');
    expect(typeof o.maskTextFn).toBe('function');
    expect(String(o.blockSelector)).toContain('stripe');
    expect(o.recordCanvas).toBe(false);
    expect(o.recordCrossOriginIframes).toBe(false);
    expect(o.checkoutEveryNms).toBe(30000);
    expect(o.inlineStylesheet).toBe(true);
  });
});

describe('rrweb from posthog-js', () => {
  it('exports record and addCustomEvent', async () => {
    const src = await import('node:fs').then(fs =>
      fs.readFileSync(require.resolve('posthog-js/dist/rrweb.js'), 'utf8'),
    );
    expect(src).toMatch(/\bas record\b/);
    expect(src).toMatch(/\bas addCustomEvent\b/);
    expect(src).not.toMatch(/localStorage|sessionStorage|document\.cookie|indexedDB/);
  });
});
