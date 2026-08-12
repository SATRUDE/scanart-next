import { describe, it, expect } from 'vitest';
import { buildSlackOrderMessage, shouldNotifyFromBrowser } from './slack-order';

const ORDER = {
  orderId: 'pi_123',
  total: '1401.00',
  currency: 'nok',
  customer: {
    firstName: 'Ida',
    lastName: 'Nordby',
    email: 'ida@example.com',
    address: 'Motbakkene 2A',
    city: 'Oslo',
    zipCode: '0284',
    country: 'NO',
  },
  items: [{ name: 'birdie brown', size: 'A1', frame: 'wood', quantity: 1, price: '1312.00 NOK' }],
};

describe('shouldNotifyFromBrowser', () => {
  // Exactly one Slack message per order, always. The browser covers it until
  // the webhook exists and stands down the moment it does.
  it('has the browser notify while no webhook is configured', () => {
    expect(shouldNotifyFromBrowser({} as unknown as NodeJS.ProcessEnv)).toBe(true);
  });

  it('stands the browser down once the webhook is configured', () => {
    const env = { STRIPE_WEBHOOK_SECRET: 'whsec_x' } as unknown as NodeJS.ProcessEnv;
    expect(shouldNotifyFromBrowser(env)).toBe(false);
  });
});

describe('buildSlackOrderMessage', () => {
  it('leads with the total and who bought it', () => {
    const message = buildSlackOrderMessage(ORDER) as { blocks: { fields?: { text: string }[] }[] };
    const fields = message.blocks[1].fields ?? [];
    expect(fields.map(f => f.text).join('\n')).toContain('1401.00 NOK');
    expect(fields.map(f => f.text).join('\n')).toContain('Ida Nordby');
    expect(fields.map(f => f.text).join('\n')).toContain('ida@example.com');
  });

  it('lists what to print', () => {
    const message = buildSlackOrderMessage(ORDER) as { blocks: { text?: { text: string } }[] };
    const items = message.blocks[2].text?.text ?? '';
    expect(items).toContain('birdie brown, A1, wood');
    expect(items).toContain('Qty: 1');
  });

  it('says so plainly when a payment carries no line detail, rather than showing nothing', () => {
    const message = buildSlackOrderMessage({ ...ORDER, items: [] }) as { blocks: { text?: { text: string } }[] };
    expect(message.blocks[2].text?.text).toContain('No line detail recorded');
  });

  it('says "not recorded" instead of printing undefined at Mark', () => {
    const message = buildSlackOrderMessage({ total: '10.00', currency: 'gbp', items: [] }) as {
      blocks: { fields?: { text: string }[] }[];
    };
    const fields = (message.blocks[1].fields ?? []).map(f => f.text).join('\n');
    expect(fields).toContain('not recorded');
    expect(fields).not.toContain('undefined');
  });

  it('omits the address block entirely when there is no address', () => {
    const message = buildSlackOrderMessage({ total: '10.00', currency: 'gbp', items: [] }) as {
      blocks: { fields?: { text: string }[] }[];
    };
    const all = JSON.stringify(message);
    expect(all).not.toContain('Shipping Address');
  });

  it('mentions a discount only when one was used', () => {
    expect(JSON.stringify(buildSlackOrderMessage(ORDER))).not.toContain('Discount Applied');
    expect(JSON.stringify(buildSlackOrderMessage({ ...ORDER, discountCode: 'SUMMER10' }))).toContain(
      'Discount Applied'
    );
  });
});
