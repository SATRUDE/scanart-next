import { afterEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { matchesClientSecret, purchaseEvent, purchaseEventUuid, receiptFromIntent, sendPurchaseMeasurement } from './purchase-measurement';

function intent(changes: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent {
  return {
    id: 'pi_verifiedOrder', status: 'succeeded', livemode: true, amount: 90000, amount_received: 90000,
    currency: 'nok', client_secret: 'pi_verifiedOrder_secret_private',
    receipt_email: 'private@example.test', shipping: { name: 'Private Customer' },
    metadata: { measurement_version: '1', measurement_analytics: '1', order_items_1: 'hummer-og-vin~50x70cm~no-frame~1~800' },
    ...changes,
  } as Stripe.PaymentIntent;
}
function event(payment = intent()): Stripe.Event {
  return { id: 'evt_verified', type: 'payment_intent.succeeded', created: 1800000000, data: { object: payment } } as Stripe.Event;
}
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('verified purchase data', () => {
  it('uses the received amount and metadata quantity, never customer/card data', () => {
    const receipt = receiptFromIntent(intent({ amount_received: 74000 }));
    expect(receipt).toEqual({ orderId: 'pi_verifiedOrder', total: 740, currency: 'NOK', itemCount: 1 });
    expect(JSON.stringify(purchaseEvent(event()))).not.toMatch(/private|shipping|email|customer|client_secret/);
  });
  it('rejects attempts, pending/failed payments, test mode, old payments and corrupt order metadata', () => {
    for (const changes of [
      { status: 'processing' }, { status: 'requires_payment_method' }, { status: 'requires_action' },
      { livemode: false }, { amount_received: 0 }, { currency: 'xxx' }, { metadata: {} },
      { metadata: { measurement_version: '1', order_items_1: 'hummer~50x70~no-frame~0~800' } },
      { metadata: { measurement_version: '1', order_items_1: 'hummer~50x70~no-frame~1~800', order_items_truncated: '1' } },
    ]) expect(receiptFromIntent(intent(changes as Partial<Stripe.PaymentIntent>))).toBeNull();
  });
  it('respects opt-out metadata and handles only succeeded events', () => {
    expect(purchaseEvent(event(intent({ metadata: { ...intent().metadata, measurement_analytics: '0' } })))).toBeNull();
    expect(purchaseEvent({ ...event(), type: 'payment_intent.payment_failed' } as Stripe.Event)).toBeNull();
    expect(purchaseEvent({ ...event(), created: 0 })).toBeNull();
  });
  it('keeps the exact dedupe identity and timestamp on retries, without a made-up visitor session', () => {
    const first = purchaseEvent(event())!;
    expect(purchaseEvent(event())).toEqual(first);
    expect(first.uuid).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    expect(purchaseEventUuid('pi_anotherOrder')).not.toBe(first.uuid);
    expect(first.properties).toMatchObject({ $host: 'www.scandinavianart.co.uk', site: 'scanart', source: 'stripe-webhook', $process_person_profile: false, $ip: null });
    expect(first.properties).not.toHaveProperty('$session_id');
    expect(first.timestamp).toBe('2027-01-15T08:00:00.000Z');
  });
  it('requires possession of the exact client secret before releasing a receipt', () => {
    expect(matchesClientSecret('pi_order_secret_private', 'pi_order_secret_private')).toBe(true);
    expect(matchesClientSecret('pi_order_secret_private', 'pi_order_secret_wrongxx')).toBe(false);
    expect(matchesClientSecret(null, 'anything')).toBe(false);
    expect(matchesClientSecret('å', 'a')).toBe(false);
  });
});

describe('PostHog purchase delivery', () => {
  function configure() {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-project-token');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');
  }
  it('retries the identical event once, then stops without throwing into fulfilment', async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 503 }));
    vi.stubGlobal('fetch', fetcher);vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(sendPurchaseMeasurement(event())).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
  });
  it('does not send previews, opted-out or unconfigured events, or leak the token to another host', async () => {
    configure();const fetcher = vi.fn();vi.stubGlobal('fetch', fetcher);
    vi.stubEnv('VERCEL_ENV', 'preview');await sendPurchaseMeasurement(event());
    vi.stubEnv('VERCEL_ENV', 'production');vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://example.test');await sendPurchaseMeasurement(event());
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com');
    await sendPurchaseMeasurement(event(intent({ metadata: {} })));
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');await sendPurchaseMeasurement(event());
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('accepts an empty success response and does not retry permanent rejection', async () => {
    configure();const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(new Response('{}', { status: 400 }));
    vi.stubGlobal('fetch', fetcher);vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendPurchaseMeasurement(event());await sendPurchaseMeasurement(event());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
