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

describe('same-visit campaign on the order', () => {
  const post = (campaign?: unknown) => POST(new Request('https://www.scandinavianart.co.uk/api/create-payment-intent', {
    method: 'POST', body: JSON.stringify({ items: [], currency: 'NOK', countryCode: 'NO', analyticsAllowed: true, ...(campaign === undefined ? {} : { campaign }) }),
  }));
  const utm = (metadata: Record<string, string>) => Object.fromEntries(Object.entries(metadata).filter(([key]) => key.startsWith('utm_')));

  it('stores validated campaign labels in the payment metadata', async () => {
    const response = await post({ utm_source: 'Meta', utm_medium: 'paid', utm_campaign: 'first-ads-2026-11-09', utm_content: 'vinkveld-room-static', utm_term: 'ignored', other: 'ignored' });
    expect(response.status).toBe(200);
    const sent = create.mock.calls.at(-1)![0];
    expect(utm(sent.metadata)).toEqual({ utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'first-ads-2026-11-09', utm_content: 'vinkveld-room-static' });
    expect(sent.metadata).toMatchObject({ measurement_version: '1', measurement_analytics: '1' });
    expect(sent.amount).toBe(90000);
  });

  it('drops malformed values and never fails checkout because of them', async () => {
    for (const campaign of [
      { utm_source: "me'ta", utm_medium: 'paid social', utm_campaign: 'x'.repeat(81), utm_content: 'vinkveld-æ' },
      { utm_source: 42, utm_medium: null, utm_campaign: ['a'], utm_content: { a: 1 } },
      'meta', 7, null, ['utm_source'], { measurement_analytics: '0', measurement_version: '9' },
    ]) {
      const response = await post(campaign);
      expect(response.status).toBe(200);
      const sent = create.mock.calls.at(-1)![0];
      expect(utm(sent.metadata)).toEqual({});
      expect(sent.metadata).toMatchObject({ measurement_version: '1', measurement_analytics: '1' });
    }
  });

  it('creates the same payment when there is no campaign at all', async () => {
    await post({ utm_source: 'meta' });
    const withCampaign = create.mock.calls.at(-1)![0];
    await post();
    const without = create.mock.calls.at(-1)![0];
    expect(utm(without.metadata)).toEqual({});
    const rest = Object.fromEntries(Object.entries(withCampaign.metadata).filter(([key]) => key !== 'utm_source'));
    expect(without).toEqual({ ...withCampaign, metadata: rest });
  });
});
