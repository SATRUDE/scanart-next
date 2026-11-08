import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { matchesClientSecret, receiptFromIntent } from '@/lib/server/purchase-measurement';

export const dynamic = 'force-dynamic';

/** A client secret is a bearer capability. Accept it only in a POST body,
 * never a URL/log, and return only the non-personal measurement receipt. */
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const { clientSecret } = await request.json();
    if (typeof clientSecret !== 'string' || clientSecret.length > 256
      || !/^pi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+$/.test(clientSecret)) {
      return NextResponse.json({ confirmed: false }, { status: 400, headers });
    }
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ confirmed: false }, { status: 503, headers });
    const stripe = new Stripe(key);
    const intent = await stripe.paymentIntents.retrieve(clientSecret.split('_secret_')[0]);
    if (!matchesClientSecret(intent.client_secret, clientSecret)) {
      return NextResponse.json({ confirmed: false }, { status: 403, headers });
    }
    const receipt = receiptFromIntent(intent);
    if (!receipt) return NextResponse.json({ confirmed: false }, { headers });
    return NextResponse.json({ confirmed: true, receipt }, { headers });
  } catch {
    return NextResponse.json({ confirmed: false }, { status: 400, headers });
  }
}
