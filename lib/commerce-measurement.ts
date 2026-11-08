import { ADVERTISING_PURCHASES_KEY, META_PURCHASES_KEY, loadConsentedMeta, loadConsentedPinterest, parseAdvertisingChoice, readAdvertisingRecord } from '@/lib/advertising-consent';
import { isOptedOut, looksLikeBot, shouldLoadPostHog } from '@/lib/posthog';
import { parsePurchaseReceipt, type PurchaseReceipt } from '@/lib/purchase-measurement';

type TagWindow = Window & { pintrk?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void };

export function purchaseAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  return shouldLoadPostHog({
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    hostname: window.location.hostname,
    optedOut: isOptedOut(() => window.localStorage),
    bot: looksLikeBot(navigator, window.screen?.width ?? 0, window.screen?.height ?? 0),
  });
}

function advertisingAllowed(): boolean {
  try {
    if (typeof window === 'undefined' || window.location.hostname !== 'www.scandinavianart.co.uk'
      || isOptedOut(() => window.localStorage)
      || looksLikeBot(navigator, window.screen?.width ?? 0, window.screen?.height ?? 0)
      || parseAdvertisingChoice(readAdvertisingRecord()) !== 'accepted') return false;
    return true;
  } catch { return false; }
}

function pinterestReady(): boolean {
  if (!advertisingAllowed()) return false;
  loadConsentedPinterest();
  return typeof (window as TagWindow).pintrk === 'function';
}
function metaReady(): boolean {
  if (!advertisingAllowed()) return false;
  loadConsentedMeta();
  return typeof (window as TagWindow).fbq === 'function';
}

export function trackPinterestCart(value: number, currency: string, quantity: number): void {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(quantity) || quantity < 1
    || !/^(GBP|NOK|USD|DKK|SEK)$/.test(currency) || !pinterestReady()) return;
  try { (window as TagWindow).pintrk?.('track', 'addtocart', { value, currency, order_quantity: quantity }); }
  catch { /* advertising cannot interrupt basket changes */ }
}

export function trackPinterestCheckoutStarted(): void {
  try { if (pinterestReady()) (window as TagWindow).pintrk?.('track', 'initiatecheckout'); }
  catch { /* advertising cannot interrupt checkout navigation */ }
}

/** Called only with the server-confirmed receipt. No replay when someone
 * accepts advertising later; no measurement storage before that acceptance. */
export function trackPinterestPurchase(receipt: PurchaseReceipt): void {
  if (!parsePurchaseReceipt(receipt) || !pinterestReady()) return;
  try {
    const raw = JSON.parse(window.localStorage.getItem(ADVERTISING_PURCHASES_KEY) || '[]');
    const seen: string[] = Array.isArray(raw) ? raw.filter(x => typeof x === 'string') : [];
    if (seen.includes(receipt.orderId)) return;
    // Fail closed if duplicate protection cannot be stored. Platform event_id
    // is stable too, including across tabs. No customer fields are sent.
    window.localStorage.setItem(ADVERTISING_PURCHASES_KEY, JSON.stringify([...seen.slice(-99), receipt.orderId]));
    (window as TagWindow).pintrk?.('track', 'checkout', {
      event_id: receipt.orderId,
      order_id: receipt.orderId,
      value: receipt.total,
      currency: receipt.currency,
      order_quantity: receipt.itemCount,
    });
  } catch { /* optional analytics must never interrupt order confirmation */ }
}

export async function measureConfirmedPurchase(clientSecret: string): Promise<void> {
  if (!advertisingAllowed()) return;
  try {
    const response = await fetch('/api/purchase-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret }),
      cache: 'no-store',
      keepalive: true,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return;
    const result = await response.json();
    const receipt = result.confirmed === true ? parsePurchaseReceipt(result.receipt) : null;
    if (receipt) {
      trackPinterestPurchase(receipt);
      trackMetaPurchase(receipt); // each rechecks consent after the request
    }
  } catch { /* the webhook remains the source of aggregate purchase counts */ }
}

export function trackAdvertisingCart(value: number, currency: string, quantity: number): void {
  trackPinterestCart(value, currency, quantity);
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(quantity) || quantity < 1
    || !/^(GBP|NOK|USD|DKK|SEK)$/.test(currency)) return;
  try {
    if (metaReady()) (window as TagWindow).fbq?.('track', 'AddToCart', { value, currency, num_items: quantity });
  } catch { /* advertising cannot interrupt basket changes */ }
}

export function trackAdvertisingCheckoutStarted(): void {
  trackPinterestCheckoutStarted();
  try { if (metaReady()) (window as TagWindow).fbq?.('track', 'InitiateCheckout'); }
  catch { /* advertising cannot interrupt checkout navigation */ }
}

/** This receipt can only come from the server's succeeded, live PaymentIntent
 * check. It contains no customer fields and is never replayed on later consent. */
export function trackMetaPurchase(receipt: PurchaseReceipt): void {
  if (!parsePurchaseReceipt(receipt)) return;
  try {
    if (!metaReady()) return;
    const raw = JSON.parse(window.localStorage.getItem(META_PURCHASES_KEY) || '[]');
    const seen: string[] = Array.isArray(raw) ? raw.filter(x => typeof x === 'string') : [];
    if (seen.includes(receipt.orderId)) return;
    window.localStorage.setItem(META_PURCHASES_KEY, JSON.stringify([...seen.slice(-99), receipt.orderId]));
    (window as TagWindow).fbq?.('track', 'Purchase', {
      value: receipt.total, currency: receipt.currency, num_items: receipt.itemCount,
    }, { eventID: receipt.orderId });
  } catch { /* optional measurement cannot interrupt order confirmation */ }
}
