import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  BLOCK_SELECTOR,
  createSession,
  isSensitivePath,
  maskText,
  sampled,
  sendsPrivacySignal,
  shouldMaskText,
  shouldRecord,
  type RecordInput,
} from './guards';
import { PRODUCTION_HOST, SAMPLE_RATE } from './protocol';

const ok: RecordInput = {
  enabled: true,
  hostname: PRODUCTION_HOST,
  optedOut: false,
  bot: false,
  privacySignal: false,
  supported: true,
  sampled: true,
};

describe('who is recorded', () => {
  it('records an ordinary sampled visit on the production site', () => {
    expect(shouldRecord(ok)).toBe(true);
  });

  it('never records when switched off', () => {
    expect(shouldRecord({ ...ok, enabled: false })).toBe(false);
  });

  it('records only on the production host', () => {
    for (const hostname of ['scandinavianart.co.uk', 'localhost', 'scanart-next-git-x.vercel.app', '127.0.0.1']) {
      expect(shouldRecord({ ...ok, hostname }), hostname).toBe(false);
    }
  });

  it('respects the umami.disabled opt-out', () => {
    expect(shouldRecord({ ...ok, optedOut: true })).toBe(false);
  });

  it('skips crawlers', () => {
    expect(shouldRecord({ ...ok, bot: true })).toBe(false);
  });

  it('skips browsers that send a privacy signal', () => {
    expect(shouldRecord({ ...ok, privacySignal: true })).toBe(false);
  });

  it('skips browsers without the APIs it needs, rather than failing in them', () => {
    expect(shouldRecord({ ...ok, supported: false })).toBe(false);
  });

  it('skips page loads that were not sampled', () => {
    expect(shouldRecord({ ...ok, sampled: false })).toBe(false);
  });
});

describe('privacy signals', () => {
  it('reads Global Privacy Control', () => {
    expect(sendsPrivacySignal({ globalPrivacyControl: true })).toBe(true);
    expect(sendsPrivacySignal({ globalPrivacyControl: false })).toBe(false);
  });

  it('reads Do Not Track in each place browsers have put it', () => {
    expect(sendsPrivacySignal({ doNotTrack: '1' })).toBe(true);
    expect(sendsPrivacySignal({ msDoNotTrack: '1' })).toBe(true);
    expect(sendsPrivacySignal({}, { doNotTrack: '1' })).toBe(true);
  });

  it('records when Do Not Track is off or unspecified', () => {
    expect(sendsPrivacySignal({ doNotTrack: '0' })).toBe(false);
    expect(sendsPrivacySignal({ doNotTrack: 'unspecified' })).toBe(false);
    expect(sendsPrivacySignal({ doNotTrack: null })).toBe(false);
  });

  it('treats a browser that throws on reading as asking not to be recorded', () => {
    const nav = {};
    Object.defineProperty(nav, 'globalPrivacyControl', {
      get() {
        throw new Error('blocked');
      },
    });
    expect(sendsPrivacySignal(nav)).toBe(true);
  });
});

describe('sampling', () => {
  it('samples 30% of page loads, as Umami did', () => {
    expect(SAMPLE_RATE).toBe(0.3);
    expect(sampled(() => 0.29)).toBe(true);
    expect(sampled(() => 0.3)).toBe(false);
    expect(sampled(() => 0.99)).toBe(false);
  });

  it('comes out near 30% over many page loads', () => {
    let seed = 42;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    let hits = 0;
    for (let i = 0; i < 20000; i++) if (sampled(random)) hits++;
    expect(hits / 20000).toBeGreaterThan(0.28);
    expect(hits / 20000).toBeLessThan(0.32);
  });

  it('handles the edges', () => {
    expect(sampled(() => 0.999, 1)).toBe(true);
    expect(sampled(() => 0, 0)).toBe(false);
  });
});

describe('the in-memory session', () => {
  it('takes a random id and the start time, and numbers chunks from 0', () => {
    const s = createSession(() => 'id-1', () => 1000);
    expect(s.id).toBe('id-1');
    expect(s.startedAt).toBe(1000);
    expect([s.nextChunk(), s.nextChunk(), s.nextChunk()]).toEqual([0, 1, 2]);
  });

  it('gives every page load its own id and chunk count', () => {
    let n = 0;
    const a = createSession(() => `id-${++n}`, () => 1);
    const b = createSession(() => `id-${++n}`, () => 2);
    a.nextChunk();
    expect(a.id).not.toBe(b.id);
    expect(b.nextChunk()).toBe(0);
  });

  it('is never written to a cookie or browser storage by the recorder code', () => {
    // Reading the opt-out flag is the only storage access, and it lives in
    // lib/posthog.ts (isOptedOut). The recorder files must not touch storage.
    for (const file of ['guards.ts', 'client.ts', 'protocol.ts']) {
      const src = fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/\/\/.*$/gm, '');
      expect(src, file).not.toMatch(/document\.cookie|sessionStorage|indexedDB|localStorage\.setItem|\.setItem\(/);
    }
  });
});

describe('masking', () => {
  const el = (insideForm: boolean) => ({ closest: (sel: string) => (insideForm && sel.includes('form') ? {} : null) });

  it('masks every text on the checkout and order pages, in both languages', () => {
    for (const p of ['/checkout', '/no/checkout', '/order-confirmed', '/no/order-confirmed', '/checkout/x']) {
      expect(isSensitivePath(p), p).toBe(true);
      expect(shouldMaskText(el(false), p), p).toBe(true);
    }
  });

  it('leaves product and journal text readable', () => {
    for (const p of ['/', '/product/slingshot', '/no/journal', '/checkout-guide']) {
      expect(isSensitivePath(p), p).toBe(false);
      expect(shouldMaskText(el(false), p), p).toBe(false);
    }
  });

  it('masks text inside any form, wherever it is', () => {
    expect(shouldMaskText(el(true), '/feedback')).toBe(true);
  });

  it('masks when the element cannot be checked', () => {
    expect(shouldMaskText(null, '/')).toBe(true);
    expect(shouldMaskText({ closest: () => { throw new Error('x'); } }, '/')).toBe(true);
  });

  it('keeps the shape of the text', () => {
    expect(maskText('Jane Doe, 12 Hill St')).toBe('**** **** ** **** **');
  });

  it('blocks Stripe frames', () => {
    expect(BLOCK_SELECTOR).toContain('iframe[src*="stripe.com"]');
    expect(BLOCK_SELECTOR).toContain('iframe[name^="__privateStripe"]');
  });
});
