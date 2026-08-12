import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { recordRedemption } from '@/lib/server/discounts';
import { sendSlackOrder, type SlackOrderItem } from '@/lib/server/slack-order';

// The order's record of last resort.
//
// Until now, the only place a completed order's contents existed was a Slack
// message the customer's BROWSER sent after the card cleared. Close the tab,
// lose signal, or have that one request fail, and the money was taken with no
// record anywhere of what had been bought or where to ship it.
//
// Stripe retries this endpoint until it gets a 2xx, so the notification now
// survives everything the browser does not.
//
// Setup (Mark, once): Stripe dashboard, Developers, Webhooks, add an endpoint
// at https://www.scandinavianart.co.uk/api/stripe-webhook listening for
// payment_intent.succeeded, then put its signing secret in Vercel as
// STRIPE_WEBHOOK_SECRET. The browser-side notification stands down by itself
// the moment that variable exists, so there is never a gap and never a double.

export const runtime = 'nodejs';
// Signature verification needs the raw body exactly as sent.
export const dynamic = 'force-dynamic';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

function money(minor: number, currency: string): string {
  const zeroDecimal = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
  const major = zeroDecimal.includes(currency.toLowerCase()) ? minor : minor / 100;
  return major.toFixed(2);
}

/** Rebuild the order lines from the metadata the payment intent carries. */
function itemsFromMetadata(metadata: Record<string, string>, currency: string): SlackOrderItem[] {
  let encoded = '';
  for (let index = 1; index <= 4; index += 1) {
    const chunk = metadata[`order_items_${index}`];
    if (chunk === undefined) break;
    encoded += chunk;
  }
  if (!encoded) return [];

  return encoded
    .split(';')
    .filter(Boolean)
    .map(chunk => {
      const [slug, size, frame, quantity, unitPrice] = chunk.split('~');
      const qty = Number(quantity);
      const unit = Number(unitPrice);
      return {
        name: (slug || 'unknown').replace(/-/g, ' '),
        size: size && size !== '-' ? size : null,
        frame: frame && frame !== '-' && frame !== 'no-frame' ? frame : null,
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
        price: `${Number.isFinite(unit) ? unit.toFixed(2) : '?'} ${currency.toUpperCase()}`,
      };
    });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Not wired up yet. 404 rather than 500 so an accidental probe does not
    // look like an outage, and so Stripe stops retrying if it is pointed here
    // before the secret exists.
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 404 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    // Anyone can POST to this URL, so an unverified body is not an order.
    event = await getStripe().webhooks.constructEventAsync(body, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    console.error('[stripe-webhook] rejected:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const metadata = (intent.metadata ?? {}) as Record<string, string>;
  const currency = intent.currency.toUpperCase();

  try {
    await sendSlackOrder({
      orderId: intent.id,
      total: money(intent.amount_received || intent.amount, intent.currency),
      currency,
      discountCode: metadata.order_discount_code || null,
      customer: {
        email: intent.receipt_email ?? undefined,
        firstName: intent.shipping?.name ?? undefined,
        address: intent.shipping?.address?.line1 ?? undefined,
        city: intent.shipping?.address?.city ?? undefined,
        state: intent.shipping?.address?.state ?? undefined,
        zipCode: intent.shipping?.address?.postal_code ?? undefined,
        country: intent.shipping?.address?.country ?? metadata.order_country ?? undefined,
      },
      items: itemsFromMetadata(metadata, currency),
    });

    if (metadata.order_discount_code) {
      await recordRedemption(metadata.order_discount_code);
    }
  } catch (error) {
    // Tell Stripe it failed so it retries; a lost order notification is the
    // exact thing this endpoint exists to prevent.
    console.error('[stripe-webhook] could not record the order:', error);
    return NextResponse.json({ error: 'Could not record the order' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
