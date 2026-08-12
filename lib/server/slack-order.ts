// The "New sale" Slack message.
//
// Extracted so the Stripe webhook and the browser-side notification build the
// same message from the same code. Which of the two actually sends it is
// decided in one place: see `shouldNotifyFromBrowser` below.

export interface SlackOrderItem {
  name: string;
  size?: string | null;
  frame?: string | null;
  quantity: number;
  price: string;
}

export interface SlackOrder {
  orderId?: string;
  total: string;
  currency: string;
  discountCode?: string | null;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  items: SlackOrderItem[];
}

export function buildSlackOrderMessage(order: SlackOrder): Record<string, unknown> {
  const customer = order.customer ?? {};
  const itemsList = order.items.length
    ? order.items
        .map(item => {
          const bits = [item.name];
          if (item.size) bits.push(item.size);
          if (item.frame) bits.push(item.frame);
          return `• ${bits.join(', ')} - Qty: ${item.quantity} - ${item.price}`;
        })
        .join('\n')
    : 'No line detail recorded on this payment.';

  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
  const address = [
    customer.address,
    [customer.city, customer.state, customer.zipCode].filter(Boolean).join(' '),
    customer.country,
  ]
    .filter(Boolean)
    .join('\n');

  const blocks: Record<string, unknown>[] = [
    { type: 'header', text: { type: 'plain_text', text: 'New Sale Completed!', emoji: true } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Order ID:*\n${order.orderId || 'N/A'}` },
        { type: 'mrkdwn', text: `*Total:*\n${order.total} ${order.currency.toUpperCase()}` },
        { type: 'mrkdwn', text: `*Customer:*\n${name || 'not recorded'}` },
        { type: 'mrkdwn', text: `*Email:*\n${customer.email || 'not recorded'}` },
      ],
    },
    { type: 'section', text: { type: 'mrkdwn', text: `*Items:*\n${itemsList}` } },
  ];

  if (address) {
    blocks.push({
      type: 'section',
      fields: [{ type: 'mrkdwn', text: `*Shipping Address:*\n${address}` }],
    });
  }
  if (order.discountCode) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Discount Applied:*\n${order.discountCode}` },
    });
  }

  return { text: '*New Sale Completed!*', blocks };
}

export async function sendSlackOrder(order: SlackOrder): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSlackOrderMessage(order)),
  });
}

/**
 * Exactly one sender, ever.
 *
 * The webhook is the better record: Stripe retries it until it succeeds, so it
 * survives the customer closing the tab, which the browser-side call does not.
 * But the webhook only exists once STRIPE_WEBHOOK_SECRET is configured, and
 * "no notification at all" is far worse than "a slightly less reliable one".
 * So the browser keeps notifying until the webhook is wired up, and stands
 * down the moment it is.
 */
export function shouldNotifyFromBrowser(env: NodeJS.ProcessEnv = process.env): boolean {
  return !env.STRIPE_WEBHOOK_SECRET;
}
