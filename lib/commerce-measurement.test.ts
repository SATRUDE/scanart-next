import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADVERTISING_CONSENT_KEY, ADVERTISING_PURCHASES_KEY } from './advertising-consent';
import { measureConfirmedPinterestPurchase, purchaseAnalyticsAllowed, trackPinterestCart, trackPinterestCheckoutStarted, trackPinterestPurchase } from './commerce-measurement';

const receipt = { orderId: 'pi_verifiedOrder', total: 740, currency: 'NOK', itemCount: 1 };
let storage: Map<string, string>;
let tag: ReturnType<typeof vi.fn>;
let target: { location: { hostname: string }; screen: { width: number; height: number }; localStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void }; pintrk: ReturnType<typeof vi.fn> };
function accept() { storage.set(ADVERTISING_CONSENT_KEY, JSON.stringify({ version: 2, choice: 'accepted', savedAt: Date.now() })); }
beforeEach(() => {
  storage = new Map();tag = vi.fn();
  target = { location: { hostname: 'www.scandinavianart.co.uk' }, screen: { width: 1920, height: 1080 }, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); } }, pintrk: tag };
  vi.stubGlobal('window', target);vi.stubGlobal('navigator', { webdriver: false, userAgent: 'Chrome', maxTouchPoints: 0 });
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-project-token');
});
afterEach(() => { vi.unstubAllGlobals();vi.unstubAllEnvs(); });

describe('consented commerce events', () => {
  it('does not track or store a purchase without consent, after rejection, for opt-outs, bots or previews', async () => {
    const fetcher = vi.fn();vi.stubGlobal('fetch', fetcher);
    trackPinterestCart(800, 'NOK', 1);trackPinterestCheckoutStarted();trackPinterestPurchase(receipt);
    storage.set(ADVERTISING_CONSENT_KEY, JSON.stringify({ version: 2, choice: 'rejected', savedAt: Date.now() }));trackPinterestPurchase(receipt);
    accept();storage.set('umami.disabled', '1');trackPinterestPurchase(receipt);expect(purchaseAnalyticsAllowed()).toBe(false);
    storage.delete('umami.disabled');target.location.hostname = 'preview.vercel.app';trackPinterestPurchase(receipt);expect(purchaseAnalyticsAllowed()).toBe(false);
    target.location.hostname = 'www.scandinavianart.co.uk';vi.stubGlobal('navigator', { webdriver: true });trackPinterestPurchase(receipt);
    await measureConfirmedPinterestPurchase('never-sent');
    expect(tag).not.toHaveBeenCalled();expect(fetcher).not.toHaveBeenCalled();expect(storage.has(ADVERTISING_PURCHASES_KEY)).toBe(false);
  });
  it('keeps checkout start distinct from purchase and deduplicates a verified order', () => {
    accept();expect(purchaseAnalyticsAllowed()).toBe(true);
    trackPinterestCart(1600, 'NOK', 2);trackPinterestCheckoutStarted();
    trackPinterestPurchase(receipt);trackPinterestPurchase(receipt);
    expect(tag.mock.calls).toEqual([
      ['track', 'addtocart', { value: 1600, currency: 'NOK', order_quantity: 2 }],
      ['track', 'initiatecheckout'],
      ['track', 'checkout', { event_id: receipt.orderId, order_id: receipt.orderId, value: 740, currency: 'NOK', order_quantity: 1 }],
    ]);
  });
  it('rechecks consent after server verification and ignores unconfirmed/invalid receipts', async () => {
    accept();
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ confirmed: false })).mockResolvedValueOnce(Response.json({ confirmed: true, receipt: { ...receipt, total: -1 } }));
    vi.stubGlobal('fetch', fetcher);
    await measureConfirmedPinterestPurchase('pi_verifiedOrder_secret_private');await measureConfirmedPinterestPurchase('pi_verifiedOrder_secret_private');
    fetcher.mockImplementationOnce(async () => { storage.clear();return Response.json({ confirmed: true, receipt }); });
    await measureConfirmedPinterestPurchase('pi_verifiedOrder_secret_private');
    expect(tag).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[0][0]).toBe('/api/purchase-confirmation');
    expect(fetcher.mock.calls[0][1].method).toBe('POST');
  });
  it('fails closed when duplicate protection cannot be saved', () => {
    accept();target.localStorage.setItem = () => { throw Error('blocked'); };
    expect(() => trackPinterestPurchase(receipt)).not.toThrow();expect(tag).not.toHaveBeenCalled();
  });
  it('never lets a broken advertising script interrupt basket or checkout actions', () => {
    accept();tag.mockImplementation(() => { throw Error('advertising unavailable'); });
    expect(() => trackPinterestCart(800, 'NOK', 1)).not.toThrow();
    expect(() => trackPinterestCheckoutStarted()).not.toThrow();
  });
});
