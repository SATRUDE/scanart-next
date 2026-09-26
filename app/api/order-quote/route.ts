import { NextResponse } from 'next/server';
import { computeOrderAmount, CURRENCIES, type Currency, type OrderItemInput } from '@/lib/server/order';
import { isDeliverable } from '@/lib/address';

// What the order will cost, from the same function the payment is charged
// with (lib/server/order.ts), so the checkout can show the real delivery
// price before the buyer pays.
//
// Why it exists: since 2026-08-12 the server charges delivery from the
// Gelato-swept and hand-set prices in the socialagent store, while the
// checkout kept showing the old config/shipping.ts table. The payment step
// refuses any charge that disagrees with the total on screen, so every order
// outside "UK, unframed, in pounds" was being refused with "Order total
// changed". Showing this quote makes the two the same number by construction.
//
// Creates nothing and charges nothing: no Stripe call, no record.
export async function POST(request: Request) {
  try {
    const { items, currency, countryCode, discountCode } = (await request.json()) as {
      items: OrderItemInput[];
      currency: string;
      countryCode: string;
      discountCode?: string;
    };
    const upperCurrency = String(currency || '').toUpperCase() as Currency;
    if (!CURRENCIES.includes(upperCurrency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }
    if (typeof countryCode !== 'string' || !isDeliverable(countryCode)) {
      return NextResponse.json({ error: 'Choose the country you want the print delivered to' }, { status: 400 });
    }
    const order = await computeOrderAmount(items, upperCurrency, countryCode, discountCode);
    return NextResponse.json({
      subtotal: order.subtotal,
      shipping: order.shipping,
      discountAmount: order.discountAmount,
      amount: order.amount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not price the order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
