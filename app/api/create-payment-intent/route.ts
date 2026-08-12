import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { computeOrderAmount, CURRENCIES, type Currency, type OrderItemInput } from '@/lib/server/order';
import { buildOrderDescription, buildOrderMetadata } from '@/lib/server/order-metadata';
import { isDeliverable } from '@/lib/address';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

interface CustomerInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

function trimmed(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.trim().slice(0, max);
  return clean || undefined;
}

// The client sends WHAT is being bought, never what it costs: the amount is
// recomputed server-side from the catalogue (lib/server/order.ts), so neither
// a tampered request body nor a client-side discount can change the charge.
//
// It also sends who is buying, and the order is recorded onto the
// PaymentIntent's metadata. Before that, a payment carried an amount and
// nothing else, so a completed order that never reached Slack left no record
// anywhere of what had been bought or where to send it.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, currency, countryCode, discountCode, customer } = body as {
      items: OrderItemInput[];
      currency: string;
      countryCode: string;
      discountCode?: string;
      customer?: CustomerInput;
    };

    const upperCurrency = String(currency || '').toUpperCase() as Currency;
    if (!CURRENCIES.includes(upperCurrency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }
    // Must be a real country, not merely a string. Pricing already refuses to
    // ship anything for free, but an order still has to be POSTABLE: a payment
    // carrying "ZZ" would take money for a parcel with nowhere to go.
    if (typeof countryCode !== 'string' || !isDeliverable(countryCode)) {
      return NextResponse.json(
        { error: 'Choose the country you want the print delivered to' },
        { status: 400 }
      );
    }

    const order = await computeOrderAmount(items, upperCurrency, countryCode, discountCode);
    if (order.amount <= 0) {
      return NextResponse.json({ error: 'Order total invalid' }, { status: 400 });
    }

    const email = trimmed(customer?.email, 200);
    const name = [trimmed(customer?.firstName, 100), trimmed(customer?.lastName, 100)]
      .filter(Boolean)
      .join(' ');
    const line1 = trimmed(customer?.address, 200);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.amount * 100),
      currency: upperCurrency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      description: buildOrderDescription(order.items),
      metadata: buildOrderMetadata({
        items: order.items,
        currency: upperCurrency,
        subtotal: order.subtotal,
        shipping: order.shipping,
        countryCode,
        discount: order.discount,
        discountAmount: order.discountAmount,
      }),
      // Stripe emails the buyer their own receipt, which is the only
      // confirmation they get today beyond the on-screen one.
      ...(email ? { receipt_email: email } : {}),
      // Shipping is what makes the payment fulfillable on its own. Stripe
      // requires a name and line1 together, so it is all or nothing.
      ...(name && line1
        ? {
            shipping: {
              name,
              address: {
                line1,
                city: trimmed(customer?.city, 100),
                state: trimmed(customer?.state, 100),
                postal_code: trimmed(customer?.zipCode, 40),
                country: countryCode.length === 2 ? countryCode : undefined,
              },
            },
          }
        : {}),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: order.amount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment setup failed';
    console.error('Error creating payment intent:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
