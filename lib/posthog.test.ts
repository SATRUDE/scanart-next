import { describe, expect, it } from 'vitest';

import {
  POSTHOG_DEFAULT_HOST,
  PRODUCTION_HOST,
  isOptedOut,
  looksLikeBot,
  posthogConfig,
  shouldLoadPostHog,
} from './posthog';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const desktop = { userAgent: CHROME_WIN, maxTouchPoints: 0, webdriver: false };
const base = { key: 'phc_test', hostname: PRODUCTION_HOST, optedOut: false, bot: false };

describe('shouldLoadPostHog', () => {
  it('loads for a real visitor on the production host with a key', () => {
    expect(shouldLoadPostHog(base)).toBe(true);
  });

  it('never loads without a key', () => {
    expect(shouldLoadPostHog({ ...base, key: undefined })).toBe(false);
    expect(shouldLoadPostHog({ ...base, key: '' })).toBe(false);
  });

  it('stays off previews, localhost and the bare domain', () => {
    for (const hostname of ['localhost', 'y-git-branch.vercel.app', 'scandinavianart.co.uk']) {
      expect(shouldLoadPostHog({ ...base, hostname }), hostname).toBe(false);
    }
  });

  it('respects the umami.disabled opt-out and the bot guard', () => {
    expect(shouldLoadPostHog({ ...base, optedOut: true })).toBe(false);
    expect(shouldLoadPostHog({ ...base, bot: true })).toBe(false);
  });
});

describe('isOptedOut', () => {
  const store = (v: string | null) => () => ({ getItem: () => v });

  it('reads Umami’s flag', () => {
    expect(isOptedOut(store('1'))).toBe(true);
    expect(isOptedOut(store('true'))).toBe(true);
    expect(isOptedOut(store(null))).toBe(false);
  });

  it('treats blocked or missing storage as not opted out', () => {
    expect(isOptedOut(() => undefined)).toBe(false);
    expect(
      isOptedOut(() => {
        throw new Error('SecurityError');
      }),
    ).toBe(false);
  });
});

describe('looksLikeBot', () => {
  it('matches the Umami tracker guard on the October 2026 crawlers', () => {
    for (const [w, h] of [[1280, 1200], [1318, 1185], [1203, 1100]]) {
      expect(looksLikeBot(desktop, w, h), `${w}x${h}`).toBe(true);
    }
  });

  it('passes real screens, including 5:4 and touch devices', () => {
    expect(looksLikeBot(desktop, 1920, 1080)).toBe(false);
    expect(looksLikeBot(desktop, 1280, 1024)).toBe(false);
    expect(looksLikeBot({ ...desktop, maxTouchPoints: 5 }, 1200, 1200)).toBe(false);
  });

  it('drops automation', () => {
    expect(looksLikeBot({ ...desktop, webdriver: true }, 1920, 1080)).toBe(true);
    expect(looksLikeBot({ userAgent: 'HeadlessChrome/141' }, 1920, 1080)).toBe(true);
  });
});

describe('posthogConfig', () => {
  it('is cookieless, EU, no profiles, no recordings', () => {
    const c = posthogConfig(undefined);
    expect(c.api_host).toBe(POSTHOG_DEFAULT_HOST);
    expect(c.cookieless_mode).toBe('always');
    expect(c.person_profiles).toBe('never');
    expect(c.capture_pageview).toBe('history_change');
    expect(c.disable_session_recording).toBe(true);
    expect(c.session_recording.maskAllInputs).toBe(true);
  });

  it('takes the host from the env when set', () => {
    expect(posthogConfig('https://eu.i.posthog.com').api_host).toBe('https://eu.i.posthog.com');
  });
});
