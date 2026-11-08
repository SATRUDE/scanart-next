import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const retrieve = vi.hoisted(() => vi.fn());
vi.mock('stripe', () => ({ default: class { paymentIntents = { retrieve }; } }));
import { POST } from './route';

const clientSecret = 'pi_verifiedOrder_secret_private';
const payment = {
  id: 'pi_verifiedOrder', client_secret: clientSecret, status: 'succeeded', livemode: true,
  amount_received: 74000, currency: 'nok', receipt_email: 'private@example.test',
  metadata: { measurement_version: '1', order_items_1: 'hummer-og-vin~50x70cm~no-frame~1~800' },
};
function request(body: unknown) { return new Request('https://www.scandinavianart.co.uk/api/purchase-confirmation', { method: 'POST', body: JSON.stringify(body) }); }
beforeEach(() => { retrieve.mockReset();retrieve.mockResolvedValue(payment);vi.stubEnv('STRIPE_SECRET_KEY', 'test-key'); });
afterEach(() => vi.unstubAllEnvs());

describe('purchase receipt capability', () => {
  it('returns only real server values after matching the exact client secret', async () => {
    const response = await POST(request({ clientSecret, total: 1 }));
    expect(await response.json()).toEqual({ confirmed: true, receipt: { orderId: payment.id, total: 740, currency: 'NOK', itemCount: 1 } });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(retrieve).toHaveBeenCalledWith(payment.id);
  });
  it('refuses wrong secrets and returns no order or customer data', async () => {
    const response = await POST(request({ clientSecret: 'pi_verifiedOrder_secret_wrong' }));
    expect(response.status).toBe(403);expect(await response.json()).toEqual({ confirmed: false });
  });
  it('never turns processing, failed or test payments into a confirmed purchase', async () => {
    for (const changes of [{ status: 'processing' }, { status: 'requires_payment_method' }, { livemode: false }, { metadata: {} }]) {
      retrieve.mockResolvedValue({ ...payment, ...changes });
      expect(await (await POST(request({ clientSecret }))).json()).toEqual({ confirmed: false });
    }
  });
  it('does not call Stripe for malformed secrets, and fails closed on read errors', async () => {
    expect((await POST(request({ clientSecret: 'bad' }))).status).toBe(400);expect(retrieve).not.toHaveBeenCalled();
    retrieve.mockRejectedValue(Error('private provider details'));
    expect(await (await POST(request({ clientSecret }))).json()).toEqual({ confirmed: false });
  });
});
