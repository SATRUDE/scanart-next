import { NextResponse } from 'next/server';

async function sendSlackNotification(orderData: any) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) return;

  const { customer, items, total, currency, orderId, discountCode } = orderData;

  const itemsList = items.map((item: any) =>
    `\u2022 ${item.name} (${item.size}) - Qty: ${item.quantity} - ${item.price}`
  ).join('\n');

  const message: any = {
    text: "*New Sale Completed!*",
    blocks: [
      { type: "header", text: { type: "plain_text", text: "New Sale Completed!", emoji: true } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Order ID:*\n${orderId || 'N/A'}` },
          { type: "mrkdwn", text: `*Total:*\n${total} ${currency.toUpperCase()}` },
          { type: "mrkdwn", text: `*Customer:*\n${customer.firstName} ${customer.lastName}` },
          { type: "mrkdwn", text: `*Email:*\n${customer.email}` },
        ],
      },
      { type: "section", text: { type: "mrkdwn", text: `*Items:*\n${itemsList}` } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Shipping Address:*\n${customer.address}\n${customer.city}, ${customer.state} ${customer.zipCode}\n${customer.country}` },
        ],
      },
    ],
  };

  if (discountCode) {
    message.blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Discount Applied:*\n${discountCode}` } });
  }

  await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    await sendSlackNotification(orderData);
    return NextResponse.json({ success: true, message: 'Order processed and notification sent' });
  } catch (error: any) {
    console.error('Error processing order completion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
