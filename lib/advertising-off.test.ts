// The shipped default: advertising measurement is off (config/advertising.ts).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { ADVERTISING_ENABLED } from '@/config/advertising';
import { AdvertisingConsent } from '@/components/AdvertisingConsent';
import { Footer } from '@/components/Footer';
import {
  ADVERTISING_CONSENT_KEY, ADVERTISING_PURCHASES_KEY, ADVERTISING_SETTINGS_EVENT, META_PURCHASES_KEY,
  clearAdvertisingLeftovers, loadConsentedAdvertising, openAdvertisingSettings, parseAdvertisingChoice,
  readAdvertisingRecord, saveAdvertisingChoice,
} from './advertising-consent';
import { measureConfirmedPurchase, trackAdvertisingCart, trackAdvertisingCheckoutStarted, trackMetaPurchase, trackPinterestPurchase } from './commerce-measurement';

const accepted = () => JSON.stringify({ version: 3, choice: 'accepted', savedAt: Date.now() });
const receipt = { orderId: 'pi_verifiedOrder', total: 740, currency: 'NOK', itemCount: 1 };
let storage: Map<string, string>;
let scripts: { src?: string }[];
let cookies: string[];
let events: string[];
let fetched: ReturnType<typeof vi.fn>;

beforeEach(() => {
  storage = new Map([[ADVERTISING_CONSENT_KEY, accepted()]]);
  scripts = []; cookies = []; events = [];
  fetched = vi.fn();
  vi.stubGlobal('window', {
    location: { hostname: 'www.scandinavianart.co.uk', reload: vi.fn() },
    screen: { width: 1920, height: 1080 },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    },
    dispatchEvent: (event: Event) => { events.push(event.type); return true; },
  });
  vi.stubGlobal('navigator', { webdriver: false, userAgent: 'Chrome', maxTouchPoints: 0 });
  vi.stubGlobal('document', {
    createElement: () => { const element = {}; scripts.push(element); return element; },
    head: { appendChild: vi.fn() },
    set cookie(value: string) { cookies.push(value); },
  });
  vi.stubGlobal('fetch', fetched);
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-project-token');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('advertising measurement is off', () => {
  it('ships with the switch off', () => {
    expect(ADVERTISING_ENABLED).toBe(false);
  });

  it('never reads an earlier yes, so it loads no Meta or Pinterest script', () => {
    expect(readAdvertisingRecord()).toBeNull();
    expect(parseAdvertisingChoice(readAdvertisingRecord())).toBeNull();
    loadConsentedAdvertising();
    expect(scripts).toEqual([]);
    const target = window as unknown as { pintrk?: unknown; fbq?: unknown };
    expect(target.pintrk).toBeUndefined();
    expect(target.fbq).toBeUndefined();
  });

  it('sends no basket, checkout or purchase event and makes no confirmation request', async () => {
    trackAdvertisingCart(800, 'NOK', 1);
    trackAdvertisingCheckoutStarted();
    trackPinterestPurchase(receipt);
    trackMetaPurchase(receipt);
    await measureConfirmedPurchase('pi_verifiedOrder_secret_private');
    expect(fetched).not.toHaveBeenCalled();
    expect(scripts).toEqual([]);
    expect(storage.has(ADVERTISING_PURCHASES_KEY)).toBe(false);
    expect(storage.has(META_PURCHASES_KEY)).toBe(false);
    expect(cookies).toEqual([]);
  });

  it('cannot save a choice or open the prompt', () => {
    const before = new Map(storage);
    expect(saveAdvertisingChoice('accepted')).toBe(false);
    expect(saveAdvertisingChoice('rejected')).toBe(false);
    openAdvertisingSettings();
    expect(storage).toEqual(before);
    expect(events).not.toContain(ADVERTISING_SETTINGS_EVENT);
  });

  it('removes what an earlier acceptance left behind, and writes nothing', () => {
    storage.set(ADVERTISING_PURCHASES_KEY, '["pi_old"]');
    storage.set(META_PURCHASES_KEY, '["pi_old"]');
    storage.set('sa-advertising-consent-v2', '{"version":2,"choice":"accepted","savedAt":1}');
    storage.set('sa-basket', 'kept');
    clearAdvertisingLeftovers();
    expect([...storage.keys()]).toEqual(['sa-basket']);
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.every(cookie => /=; Max-Age=0;/.test(cookie))).toBe(true);
    expect(cookies.some(cookie => cookie.startsWith('_fbp='))).toBe(true);
    expect(cookies.some(cookie => cookie.startsWith('_epik='))).toBe(true);
  });

  it('renders no advertising prompt in either language', () => {
    for (const locale of ['en', 'no'] as const) {
      const html = renderToStaticMarkup(createElement(AdvertisingConsent, { locale }));
      expect(html).toBe('');
    }
  });

  it('has no cookie settings entry in the footer', () => {
    const html = renderToStaticMarkup(createElement(Footer, { year: 2026, categorySlugs: [] }));
    expect(html).toContain('/privacy');
    expect(html).not.toMatch(/Cookie settings|Innstillinger for informasjonskapsler/);
  });
});
