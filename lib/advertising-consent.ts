import { isOptedOut, looksLikeBot } from '@/lib/posthog';

// Versioned, purpose-specific permission. Unknown, damaged and expired choices
// all leave advertising off. This preference is the only storage we need before consent.
export const ADVERTISING_CONSENT_KEY = 'sa-advertising-consent-v3';
const LEGACY_CONSENT_KEYS = ['sa-advertising-consent-v2', 'sa-advertising-consent-v1'];
export const META_PIXEL_ID = '2148270909141839';
export const META_PURCHASES_KEY = 'sa-meta-purchases-v1';
export const ADVERTISING_PURCHASES_KEY = 'sa-pinterest-purchases-v1';
export const ADVERTISING_CONSENT_EVENT = 'sa-advertising-consent-changed';
export const ADVERTISING_SETTINGS_EVENT = 'sa-advertising-settings';
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
export type AdvertisingChoice = 'accepted' | 'rejected';

type PinterestTag = ((...args: unknown[]) => void) & { queue: unknown[][]; version: string };
type MetaTag = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push: MetaTag;
  loaded: boolean; version: string;
};
type AdvertisingWindow = Window & { pintrk?: PinterestTag; fbq?: MetaTag; _fbq?: MetaTag };

export function parseAdvertisingChoice(raw: string | null, now = Date.now()): AdvertisingChoice | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (record.version !== 3 || !['accepted', 'rejected'].includes(record.choice)) return null;
    if (!Number.isFinite(record.savedAt) || record.savedAt > now || now - record.savedAt >= CONSENT_LIFETIME_MS) return null;
    return record.choice;
  } catch { return null; }
}

export function readAdvertisingRecord(): string | null {
  try {
    const current = window.localStorage.getItem(ADVERTISING_CONSENT_KEY);
    if (current !== null) return current;
    // Earlier yes covered Pinterest only. A valid earlier no remains a no;
    // adding Meta always requires a renewed affirmative choice.
    for (const key of LEGACY_CONSENT_KEYS) {
      const legacy = JSON.parse(window.localStorage.getItem(key) || 'null');
      if ([1, 2].includes(legacy?.version) && legacy.choice === 'rejected'
        && parseAdvertisingChoice(JSON.stringify({ ...legacy, version: 3 })) === 'rejected') {
        return JSON.stringify({ ...legacy, version: 3 });
      }
    }
    return null;
  }
  catch { return null; }
}

export function subscribeToAdvertisingChoice(callback: () => void): () => void {
  const changed = () => {
    // A change in another tab must also stop an already-loaded advertising tag.
    if (((window as AdvertisingWindow).pintrk || (window as AdvertisingWindow).fbq) && parseAdvertisingChoice(readAdvertisingRecord()) !== 'accepted') {
      clearAdvertisingCookies();
      window.location.reload();
      return;
    }
    callback();
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key === ADVERTISING_CONSENT_KEY || LEGACY_CONSENT_KEYS.includes(event.key || '') || event.key === null) changed();
  };
  window.addEventListener('storage', storageChanged);
  window.addEventListener(ADVERTISING_CONSENT_EVENT, changed);
  return () => {
    window.removeEventListener('storage', storageChanged);
    window.removeEventListener(ADVERTISING_CONSENT_EVENT, changed);
  };
}

export function saveAdvertisingChoice(choice: AdvertisingChoice): boolean {
  const raw = JSON.stringify({ version: 3, choice, savedAt: Date.now() });
  try {
    window.localStorage.setItem(ADVERTISING_CONSENT_KEY, raw);
    if (readAdvertisingRecord() !== raw) throw new Error('Preference not saved');
  } catch {
    // Reject still works when storage is full or blocked: remove any earlier
    // acceptance. If even that fails, do not claim a successful withdrawal.
    if (choice === 'accepted') return false;
    try { window.localStorage.removeItem(ADVERTISING_CONSENT_KEY); } catch { /* read below fails closed */ }
    if (parseAdvertisingChoice(readAdvertisingRecord()) === 'accepted') return false;
  }
  if (choice === 'rejected') clearAdvertisingCookies();
  window.dispatchEvent(new Event(ADVERTISING_CONSENT_EVENT));
  return true;
}

/** Load no external script, pixel or preconnect until a saved yes exists. */
export function loadConsentedPinterest(): void {
  if (parseAdvertisingChoice(readAdvertisingRecord()) !== 'accepted') return;
  const target = window as AdvertisingWindow;
  if (target.pintrk) return;
  const queue: unknown[][] = [];
  const pintrk = Object.assign((...args: unknown[]) => { queue.push(args); }, { queue, version: '3.0' });
  target.pintrk = pintrk;
  pintrk('load', '2613500774753');
  pintrk('page');
  const script = document.createElement('script');
  script.id = 'consented-pinterest-tag';
  script.async = true;
  script.src = 'https://s.pinimg.com/ct/core.js';
  document.head.appendChild(script);
}

/** Explicit events only. Disable automatic form/page/product collection before
 * init and never provide advanced-matching data. No noscript bypass exists. */
export function loadConsentedMeta(): void {
  if (typeof window === 'undefined' || window.location.hostname !== 'www.scandinavianart.co.uk'
    || isOptedOut(() => window.localStorage)
    || looksLikeBot(navigator, window.screen?.width ?? 0, window.screen?.height ?? 0)) return;
  if (parseAdvertisingChoice(readAdvertisingRecord()) !== 'accepted') return;
  const target = window as AdvertisingWindow;
  if (target.fbq) return;
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as MetaTag;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  target.fbq = fbq;
  target._fbq = fbq;
  fbq('set', 'autoConfig', false, META_PIXEL_ID);
  fbq('set', 'smartSetup', false, META_PIXEL_ID);
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
  const script = document.createElement('script');
  script.id = 'consented-meta-pixel';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
}

export function loadConsentedAdvertising(): void {
  loadConsentedPinterest();
  loadConsentedMeta();
}

/** Remove our first-party copies; provider-domain cookies remain with providers. */
export function clearAdvertisingCookies(): void {
  try {
    window.localStorage.removeItem(ADVERTISING_PURCHASES_KEY);
    window.localStorage.removeItem(META_PURCHASES_KEY);
  } catch { /* optional ad storage */ }
  const names = ['_epik', '_derived_epik', '_pin_unauth', '_routing_id', '_pin_aem', '_fbp', '_fbc'];
  const host = window.location.hostname;
  const domains = ['', host, ...(host.endsWith('.scandinavianart.co.uk') ? ['scandinavianart.co.uk'] : [])];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

export function openAdvertisingSettings(): void {
  window.dispatchEvent(new Event(ADVERTISING_SETTINGS_EVENT));
}
