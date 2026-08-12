import { NextResponse } from 'next/server';
import { sendSlackOrder, shouldNotifyFromBrowser, type SlackOrder } from '@/lib/server/slack-order';

// The browser's "the card cleared" call.
//
// This was the ONLY record of a completed order's contents, which made it a
// single point of failure sitting in the customer's browser. The Stripe
// webhook is the record now (app/api/stripe-webhook), and this route stands
// down as soon as that webhook is configured, so exactly one Slack message is
// sent per order and there is never a gap in between.
export async function POST(request: Request) {
  try {
    const orderData = (await request.json()) as SlackOrder;

    if (!shouldNotifyFromBrowser()) {
      return NextResponse.json({
        success: true,
        message: 'The Stripe webhook records this order.',
        notified: false,
      });
    }

    await sendSlackOrder(orderData);
    return NextResponse.json({ success: true, notified: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Order notification failed';
    console.error('Error processing order completion:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
