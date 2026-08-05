import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { computeOrderAmount, CURRENCIES, type Currency, type OrderItemInput } from '@/lib/server/order';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

// The client sends WHAT is being bought, never what it costs: the amount is
// recomputed server-side from the catalogue (lib/server/order.ts), so neither
// a tampered request body nor a client-side discount can change the charge.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, currency, countryCode, discountCode } = body as {
      items: OrderItemInput[];
      currency: string;
      countryCode: string;
      discountCode?: string;
    };

    const upperCurrency = String(currency || '').toUpperCase() as Currency;
    if (!CURRENCIES.includes(upperCurrency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }
    if (typeof countryCode !== 'string' || !countryCode) {
      return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
    }

    const order = await computeOrderAmount(items, upperCurrency, countryCode, discountCode);
    if (order.amount <= 0) {
      return NextResponse.json({ error: 'Order total invalid' }, { status: 400 });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.amount * 100),
      currency: upperCurrency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
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
