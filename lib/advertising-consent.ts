// Versioned, purpose-specific permission. Unknown, damaged and expired choices
// all leave advertising off. This preference is the only storage we need before consent.
export const ADVERTISING_CONSENT_KEY = 'sa-advertising-consent-v1';
export const ADVERTISING_CONSENT_EVENT = 'sa-advertising-consent-changed';
export const ADVERTISING_SETTINGS_EVENT = 'sa-advertising-settings';
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
export type AdvertisingChoice = 'accepted' | 'rejected';

type PinterestTag = ((...args: unknown[]) => void) & { queue: unknown[][]; version: string };
type PinterestWindow = Window & { pintrk?: PinterestTag };

export function parseAdvertisingChoice(raw: string | null, now = Date.now()): AdvertisingChoice | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (record.version !== 1 || !['accepted', 'rejected'].includes(record.choice)) return null;
    if (!Number.isFinite(record.savedAt) || record.savedAt > now || now - record.savedAt >= CONSENT_LIFETIME_MS) return null;
    return record.choice;
  } catch { return null; }
}

export function readAdvertisingRecord(): string | null {
  try { return window.localStorage.getItem(ADVERTISING_CONSENT_KEY); }
  catch { return null; }
}

export function subscribeToAdvertisingChoice(callback: () => void): () => void {
  const changed = () => {
    // A change in another tab must also stop an already-loaded advertising tag.
    if ((window as PinterestWindow).pintrk && parseAdvertisingChoice(readAdvertisingRecord()) !== 'accepted') {
      clearPinterestCookies();
      window.location.reload();
      return;
    }
    callback();
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key === ADVERTISING_CONSENT_KEY || event.key === null) changed();
  };
  window.addEventListener('storage', storageChanged);
  window.addEventListener(ADVERTISING_CONSENT_EVENT, changed);
  return () => {
    window.removeEventListener('storage', storageChanged);
    window.removeEventListener(ADVERTISING_CONSENT_EVENT, changed);
  };
}

export function saveAdvertisingChoice(choice: AdvertisingChoice): boolean {
  const raw = JSON.stringify({ version: 1, choice, savedAt: Date.now() });
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
  if (choice === 'rejected') clearPinterestCookies();
  window.dispatchEvent(new Event(ADVERTISING_CONSENT_EVENT));
  return true;
}

/** Load no external script, pixel or preconnect until a saved yes exists. */
export function loadConsentedPinterest(): void {
  if (parseAdvertisingChoice(readAdvertisingRecord()) !== 'accepted') return;
  const target = window as PinterestWindow;
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

/** We can remove our first-party copies, not cookies on Pinterest's domain. */
export function clearPinterestCookies(): void {
  const names = ['_epik', '_derived_epik', '_pin_unauth', '_routing_id', '_pin_aem'];
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
