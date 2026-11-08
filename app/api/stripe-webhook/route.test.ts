import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';

const mocks = vi.hoisted(() => ({
  callbacks: [] as Array<() => Promise<void>>,
  slack: vi.fn(), redemption: vi.fn(), measure: vi.fn(),
}));
vi.mock('next/server', async original => ({ ...await original<typeof import('next/server')>(), after: (callback: () => Promise<void>) => mocks.callbacks.push(callback) }));
vi.mock('@/lib/server/slack-order', () => ({ sendSlackOrder: mocks.slack }));
vi.mock('@/lib/server/discounts', () => ({ recordRedemption: mocks.redemption }));
vi.mock('@/lib/server/purchase-measurement', () => ({ sendPurchaseMeasurement: mocks.measure }));
import { POST } from './route';

const secret = 'whsec_test_fixture_only';
function signed(type = 'payment_intent.succeeded', invalid = false) {
  const payload = JSON.stringify({ id: 'evt_verified', object: 'event', type, created: 1800000000, data: { object: {
    id: 'pi_verifiedOrder', amount: 90000, amount_received: 90000, currency: 'nok',
    status: 'succeeded', livemode: true, metadata: { order_items_1: 'hummer-og-vin~50x70cm~no-frame~1~800' },
  } } });
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac('sha256', invalid ? 'wrong-fixture' : secret).update(`${timestamp}.${payload}`).digest('hex');
  const signature = `t=${timestamp},v1=${digest}`;
  return new Request('https://www.scandinavianart.co.uk/api/stripe-webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': signature } });
}
beforeEach(() => {
  mocks.callbacks.length = 0;mocks.slack.mockReset();mocks.redemption.mockReset();mocks.measure.mockReset();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fixture_only');vi.stubEnv('STRIPE_WEBHOOK_SECRET', secret);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs();vi.restoreAllMocks(); });

describe('signed purchase event boundary', () => {
  it('schedules measurement only after a signed succeeded event', async () => {
    expect((await POST(signed())).status).toBe(200);
    expect(mocks.slack).toHaveBeenCalledTimes(1);expect(mocks.measure).not.toHaveBeenCalled();
    expect(mocks.callbacks).toHaveLength(1);await mocks.callbacks[0]();
    expect(mocks.measure).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment_intent.succeeded', id: 'evt_verified' }));
  });
  it('does not measure forged, unrelated or failed events', async () => {
    expect((await POST(signed('payment_intent.succeeded', true))).status).toBe(400);
    expect((await POST(signed('payment_intent.payment_failed'))).status).toBe(200);
    expect(mocks.callbacks).toHaveLength(0);expect(mocks.measure).not.toHaveBeenCalled();expect(mocks.slack).not.toHaveBeenCalled();
  });
});
