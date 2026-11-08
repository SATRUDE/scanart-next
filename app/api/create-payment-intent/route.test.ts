import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const create = vi.hoisted(() => vi.fn());
vi.mock('stripe', () => ({ default: class { paymentIntents = { create }; } }));
vi.mock('@/lib/server/order', async original => ({
  ...await original<typeof import('@/lib/server/order')>(),
  computeOrderAmount: vi.fn(async () => ({
    amount: 900, subtotal: 800, shipping: 100, discount: null, discountAmount: 0,
    items: [{ slug: 'hummer-og-vin', size: '50x70cm', frame: 'no-frame', quantity: 1, unitPrice: 800 }],
  })),
}));
import { POST } from './route';
beforeEach(() => {
  create.mockReset();create.mockResolvedValue({ client_secret: 'test-response' });
  vi.stubEnv('STRIPE_SECRET_KEY', 'fixture-only');vi.stubEnv('VERCEL_ENV', 'production');
});
afterEach(() => vi.unstubAllEnvs());

describe('purchase measurement eligibility does not price an order', () => {
  it('records only an explicit eligible browser in production, without accepting a browser total', async () => {
    for (const analyticsAllowed of [true, false, 'true', undefined]) {
      const response = await POST(new Request('https://www.scandinavianart.co.uk/api/create-payment-intent', {
        method: 'POST', body: JSON.stringify({ items: [], currency: 'NOK', countryCode: 'NO', total: 1, analyticsAllowed }),
      }));
      expect(response.status).toBe(200);
      const sent = create.mock.calls.at(-1)![0];
      expect(sent.amount).toBe(90000);
      expect(sent.metadata).toMatchObject({ measurement_version: '1', measurement_analytics: analyticsAllowed === true ? '1' : '0' });
    }
  });
  it('never enables server analytics in a preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    await POST(new Request('https://preview.example/api/create-payment-intent', { method: 'POST', body: JSON.stringify({ items: [], currency: 'NOK', countryCode: 'NO', analyticsAllowed: true }) }));
    expect(create.mock.calls[0][0].metadata.measurement_analytics).toBe('0');
  });
});
