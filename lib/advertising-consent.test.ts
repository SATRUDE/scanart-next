import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADVERTISING_CONSENT_EVENT,
  ADVERTISING_CONSENT_KEY,
  CONSENT_LIFETIME_MS,
  loadConsentedPinterest,
  loadConsentedMeta,
  META_PIXEL_ID,
  META_PURCHASES_KEY,
  readAdvertisingRecord,
  parseAdvertisingChoice,
  saveAdvertisingChoice,
  subscribeToAdvertisingChoice,
} from './advertising-consent';

function saved(choice: string, savedAt = Date.now()) {
  return JSON.stringify({ version: 3, choice, savedAt });
}

let storage: Map<string, string>;
let append: ReturnType<typeof vi.fn>;
let reload = vi.fn<() => void>();
let cookies: string[];
let target: EventTarget & {
  localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  location: { hostname: string; reload: () => void };
  pintrk?: { queue: unknown[][] };
  fbq?: { queue: unknown[][] };
  screen?: { width: number; height: number };
};

beforeEach(() => {
  storage = new Map();
  append = vi.fn();
  reload = vi.fn<() => void>();
  cookies = [];
  target = Object.assign(new EventTarget(), {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    location: { hostname: 'www.scandinavianart.co.uk', reload },
    screen: { width: 1920, height: 1080 },
  });
  vi.stubGlobal('window', target);
  vi.stubGlobal('navigator', { webdriver: false, userAgent: 'Chrome', maxTouchPoints: 0 });
  vi.stubGlobal('document', {
    createElement: () => ({}),
    head: { appendChild: append },
    set cookie(value: string) { cookies.push(value); },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('advertising permission boundary', () => {
  it('requires a renewed yes for order measurement while respecting an earlier rejection', () => {
    storage.set('sa-advertising-consent-v1', JSON.stringify({ version: 1, choice: 'accepted', savedAt: Date.now() }));
    expect(parseAdvertisingChoice(readAdvertisingRecord())).toBeNull();
    loadConsentedPinterest();expect(append).not.toHaveBeenCalled();
    storage.set('sa-advertising-consent-v1', JSON.stringify({ version: 1, choice: 'rejected', savedAt: Date.now() }));
    expect(parseAdvertisingChoice(readAdvertisingRecord())).toBe('rejected');
  });
  it('renews v2 Pinterest-only yes and preserves valid v2 no but not expired no', () => {
    const v2 = (choice: string, savedAt = Date.now()) => JSON.stringify({ version: 2, choice, savedAt });
    storage.set('sa-advertising-consent-v2', v2('accepted'));
    expect(parseAdvertisingChoice(readAdvertisingRecord())).toBeNull();
    loadConsentedMeta();expect(append).not.toHaveBeenCalled();
    storage.set('sa-advertising-consent-v2', v2('rejected'));
    expect(parseAdvertisingChoice(readAdvertisingRecord())).toBe('rejected');
    storage.set('sa-advertising-consent-v2', v2('rejected', Date.now() - CONSENT_LIFETIME_MS));
    expect(parseAdvertisingChoice(readAdvertisingRecord())).toBeNull();
  });
  it('loads Meta once only after a renewed yes with automatic setup disabled before init and no customer data', () => {
    loadConsentedMeta();expect(append).not.toHaveBeenCalled();
    saveAdvertisingChoice('accepted');loadConsentedMeta();loadConsentedMeta();
    expect(append).toHaveBeenCalledTimes(1);
    expect(append.mock.calls[0][0].src).toBe('https://connect.facebook.net/en_US/fbevents.js');
    expect(target.fbq?.queue).toEqual([
      ['set', 'autoConfig', false, META_PIXEL_ID], ['set', 'smartSetup', false, META_PIXEL_ID],
      ['optOut', META_PIXEL_ID, 'AutomaticMatching'], ['optOut', META_PIXEL_ID, 'AutomaticMatchingForPartnerIntegrations'],
      ['init', META_PIXEL_ID], ['track', 'PageView'],
    ]);
  });
  it('suppresses Meta for opt-out, previews and automation even with a saved yes', () => {
    saveAdvertisingChoice('accepted');storage.set('umami.disabled', '1');loadConsentedMeta();
    storage.delete('umami.disabled');target.location.hostname = 'preview.vercel.app';loadConsentedMeta();
    target.location.hostname = 'www.scandinavianart.co.uk';vi.stubGlobal('navigator', { webdriver: true });loadConsentedMeta();
    expect(append).not.toHaveBeenCalled();expect(target.fbq).toBeUndefined();
  });
  it('withdraws a loaded Meta pixel, clears its dedupe references and first-party cookies', () => {
    saveAdvertisingChoice('accepted');loadConsentedMeta();
    storage.set(META_PURCHASES_KEY, '["pi_verifiedOrder"]');
    const stop = subscribeToAdvertisingChoice(vi.fn());saveAdvertisingChoice('rejected');
    expect(reload).toHaveBeenCalledOnce();expect(storage.has(META_PURCHASES_KEY)).toBe(false);
    expect(cookies.some(value => value.startsWith('_fbp=; Max-Age=0;'))).toBe(true);stop();
  });
  it('makes no Pinterest request before a choice, after rejection, or with invalid or expired storage', () => {
    for (const raw of [null, saved('rejected'), 'true', '{broken', saved('accepted', Date.now() - CONSENT_LIFETIME_MS), saved('accepted', Date.now() + 60000)]) {
      if (raw) storage.set(ADVERTISING_CONSENT_KEY, raw);
      else storage.clear();
      loadConsentedPinterest();
    }
    expect(append).not.toHaveBeenCalled();
    expect(target.pintrk).toBeUndefined();
  });

  it('loads only after an explicit saved yes, and never twice on remount', () => {
    expect(saveAdvertisingChoice('accepted')).toBe(true);
    loadConsentedPinterest();
    loadConsentedPinterest();
    expect(append).toHaveBeenCalledTimes(1);
    expect(append.mock.calls[0][0].src).toBe('https://s.pinimg.com/ct/core.js');
    expect((target.pintrk as { queue: unknown[][] }).queue).toEqual([
      ['load', '2613500774753'], ['page'],
    ]);
  });

  it('persists no before reloading an already-running tag, clears first-party cookies and unsubscribes', () => {
    saveAdvertisingChoice('accepted');
    loadConsentedPinterest();
    const callback = vi.fn();
    const stop = subscribeToAdvertisingChoice(callback);
    saveAdvertisingChoice('rejected');
    expect(parseAdvertisingChoice(storage.get(ADVERTISING_CONSENT_KEY)!)).toBe('rejected');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
    expect(cookies.some(value => value.startsWith('_pin_unauth=; Max-Age=0;'))).toBe(true);
    expect(cookies.some(value => value.includes('Domain=scandinavianart.co.uk'))).toBe(true);
    stop();
    target.dispatchEvent(new Event(ADVERTISING_CONSENT_EVENT));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload when rejecting before the tag has loaded', () => {
    const callback = vi.fn();
    const stop = subscribeToAdvertisingChoice(callback);
    saveAdvertisingChoice('rejected');
    expect(reload).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    stop();
  });

  it('fails closed if storage cannot persist an acceptance', () => {
    (target.localStorage as Storage).setItem = () => { throw new Error('blocked'); };
    expect(saveAdvertisingChoice('accepted')).toBe(false);
    loadConsentedPinterest();
    expect(append).not.toHaveBeenCalled();
  });

  it('can withdraw a previous acceptance when quota blocks writing a new choice', () => {
    saveAdvertisingChoice('accepted');
    (target.localStorage as Storage).setItem = () => { throw new Error('quota'); };
    expect(saveAdvertisingChoice('rejected')).toBe(true);
    expect(storage.has(ADVERTISING_CONSENT_KEY)).toBe(false);
    loadConsentedPinterest();
    expect(append).not.toHaveBeenCalled();
  });

  it('does not report withdrawal saved if an old acceptance cannot be removed', () => {
    saveAdvertisingChoice('accepted');
    (target.localStorage as Storage).setItem = () => { throw new Error('blocked'); };
    (target.localStorage as Storage).removeItem = () => { throw new Error('blocked'); };
    expect(saveAdvertisingChoice('rejected')).toBe(false);
  });
});
