import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';
import { NOTRACK_COOKIE, NOTRACK_MAX_AGE, hasNotrackCookie, notrackChoice } from './notrack';
import { OPT_OUT_KEY, isOptedOut, shouldLoadPostHog } from './posthog';
import { TRACKER_GUARD_SCRIPT } from './tracker-guard';

const request = (path: string, cookie = '') =>
  new NextRequest(`https://www.scandinavianart.co.uk${path}`, {
    headers: { 'x-vercel-ip-country': 'GB', 'user-agent': 'Mozilla/5.0', ...(cookie ? { cookie } : {}) },
  });

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = String(v); },
    removeItem: (k: string) => { delete data[k]; },
  };
};

describe('?notrack=on / off', () => {
  it('reads only on and off', () => {
    expect(notrackChoice('?notrack=on')).toBe('on');
    expect(notrackChoice('?utm_source=x&notrack=off')).toBe('off');
    expect(notrackChoice('?notrack=1')).toBeNull();
    expect(notrackChoice('')).toBeNull();
  });

  it('finds the cookie among others, and nothing that only looks like it', () => {
    expect(hasNotrackCookie(`geo-country=GB; ${NOTRACK_COOKIE}=1`)).toBe(true);
    expect(hasNotrackCookie(`${NOTRACK_COOKIE}=0`)).toBe(false);
    expect(hasNotrackCookie(`x${NOTRACK_COOKIE}=1`)).toBe(false);
    expect(hasNotrackCookie(undefined)).toBe(false);
  });

  it('on any page, the server sets a 400-day cookie for on and clears it for off', () => {
    for (const path of ['/?notrack=on', '/product/sunday-brunch?notrack=on', '/no/journal?notrack=on']) {
      const cookie = proxy(request(path)).cookies.get(NOTRACK_COOKIE);
      expect(cookie?.value, path).toBe('1');
      expect(cookie?.maxAge, path).toBe(NOTRACK_MAX_AGE);
      expect(cookie?.path, path).toBe('/');
    }
    const off = proxy(request('/?notrack=off', `${NOTRACK_COOKIE}=1`)).headers.get('set-cookie') || '';
    expect(off).toMatch(new RegExp(`${NOTRACK_COOKIE}=;`));
    expect(proxy(request('/')).cookies.get(NOTRACK_COOKIE)).toBeUndefined();
  });

  it('also sets it on the one-off Norwegian redirect', () => {
    const r = new NextRequest('https://www.scandinavianart.co.uk/collection/kitchen?notrack=on', {
      headers: { 'x-vercel-ip-country': 'NO', 'user-agent': 'Mozilla/5.0' },
    });
    const res = proxy(r);
    expect(res.headers.get('location')).toContain('notrack=on');
    expect(res.cookies.get(NOTRACK_COOKIE)?.value).toBe('1');
  });

  it('keeps PostHog (and everything gated on it) off when the cookie is there', () => {
    const empty = () => memoryStorage();
    expect(isOptedOut(empty, () => `${NOTRACK_COOKIE}=1`)).toBe(true);
    expect(isOptedOut(empty, () => '')).toBe(false);
    expect(isOptedOut(() => memoryStorage({ [OPT_OUT_KEY]: '1' }), () => '')).toBe(true);
    // Blocked storage still honours the cookie.
    expect(isOptedOut(() => { throw new Error('blocked'); }, () => `${NOTRACK_COOKIE}=1`)).toBe(true);
    const optedOut = isOptedOut(empty, () => `${NOTRACK_COOKIE}=1`);
    expect(shouldLoadPostHog({ key: 'k', hostname: 'www.scandinavianart.co.uk', optedOut, bot: false })).toBe(false);
  });

  // The head script runs before Umami's tracker and copies the choice into
  // Umami's own flag, which is all Umami reads.
  const runHead = (search: string, cookie: string, storage = memoryStorage()) => {
    vm.runInNewContext(TRACKER_GUARD_SCRIPT, {
      window: {},
      navigator: { userAgent: 'Mozilla/5.0', maxTouchPoints: 5 },
      location: { search },
      document: { cookie },
      localStorage: storage,
    });
    return storage.data;
  };

  it('switches Umami off for ?notrack=on, and back on for ?notrack=off', () => {
    expect(runHead('?notrack=on', '')[OPT_OUT_KEY]).toBe('1');
    expect(runHead('?notrack=off', `${NOTRACK_COOKIE}=1`, memoryStorage({ [OPT_OUT_KEY]: '1' }))[OPT_OUT_KEY]).toBeUndefined();
  });

  it('puts Umami\'s flag back from the cookie if the browser cleared its storage', () => {
    expect(runHead('', `a=b; ${NOTRACK_COOKIE}=1`)[OPT_OUT_KEY]).toBe('1');
    expect(runHead('', 'a=b')[OPT_OUT_KEY]).toBeUndefined();
    // A flag Mark set by hand is never cleared without ?notrack=off.
    expect(runHead('', '', memoryStorage({ [OPT_OUT_KEY]: 'true' }))[OPT_OUT_KEY]).toBe('true');
  });
});
