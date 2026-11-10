import { createHash, timingSafeEqual } from 'node:crypto';
import type Stripe from 'stripe';
import type { PurchaseReceipt } from '@/lib/purchase-measurement';
import { cleanCampaign } from '@/lib/campaign';
import { POSTHOG_DEFAULT_HOST, PRODUCTION_HOST } from '@/lib/posthog';

/** Metadata is written by our pricing endpoint, not the browser's totals. */
export function receiptFromIntent(intent: Stripe.PaymentIntent): PurchaseReceipt | null {
  if (intent.status !== 'succeeded' || !intent.livemode || !Number.isSafeInteger(intent.amount_received) || intent.amount_received <= 0
    || intent.metadata.measurement_version !== '1'
    || !/^(gbp|nok|usd|dkk|sek)$/.test(intent.currency)
    || intent.metadata.order_items_truncated) return null;
  let encoded = '';
  for (let i = 1; i <= 4; i++) encoded += intent.metadata[`order_items_${i}`] || '';
  const lines = encoded.split(';').filter(Boolean);
  if (!lines.length) return null;
  let itemCount = 0;
  for (const line of lines) {
    const fields = line.split('~');
    const quantity = Number(fields[3]);
    const unitPrice = Number(fields[4]);
    if (fields.length !== 5 || !fields[0] || !Number.isInteger(quantity) || quantity < 1
      || !Number.isFinite(unitPrice) || unitPrice <= 0) return null;
    itemCount += quantity;
  }
  if (!Number.isSafeInteger(itemCount)) return null;
  return { orderId: intent.id, total: intent.amount_received / 100, currency: intent.currency.toUpperCase(), itemCount };
}

export function matchesClientSecret(actual: string | null, supplied: string): boolean {
  if (!actual) return false;
  const expected = Buffer.from(actual);
  const provided = Buffer.from(supplied);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

/** UUIDv5: stable for an order across webhook retries, not a visitor/session ID. */
export function purchaseEventUuid(orderId: string): string {
  const namespace = Buffer.from('6ba7b8109dad11d180b400c04fd430c8', 'hex');
  const bytes = createHash('sha1').update(namespace).update(`scandinavianart.co.uk/purchase/${orderId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function purchaseEvent(event: Stripe.Event) {
  if (event.type !== 'payment_intent.succeeded' || !Number.isInteger(event.created) || event.created <= 0) return null;
  const intent = event.data.object as Stripe.PaymentIntent;
  const receipt = receiptFromIntent(intent);
  if (!receipt || intent.metadata.measurement_analytics !== '1') return null;
  const uuid = purchaseEventUuid(receipt.orderId);
  return {
    event: 'purchase',
    uuid,
    // This anonymous entity is an ORDER. Never invent a customer or session.
    distinct_id: `order:${uuid}`,
    timestamp: new Date(event.created * 1000).toISOString(),
    properties: {
      ...receipt,
      // The same-visit ad campaign recorded when the payment was created, if
      // any. Revalidated here; absent on older payments and unattributed visits.
      ...cleanCampaign(intent.metadata),
      $host: PRODUCTION_HOST,
      site: 'scanart',
      source: 'stripe-webhook',
      $process_person_profile: false,
      $geoip_disable: true,
      $ip: null,
    },
  };
}

/** Bounded delivery after the webhook response. A vendor outage must not
 * delay a buyer or retry Slack/redemptions. PostHog deduplicates the same
 * UUID/name/timestamp/distinct_id; reports count distinct orderId as well. */
export async function sendPurchaseMeasurement(event: Stripe.Event): Promise<void> {
  if (process.env.VERCEL_ENV !== 'production') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const payload = purchaseEvent(event);
  if (!key || !payload) return;
  // This existing project uses PostHog EU cloud; never send a token to an
  // arbitrary host supplied by a request or unexpected configuration.
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || POSTHOG_DEFAULT_HOST).replace(/\/+$/, '');
  if (host !== POSTHOG_DEFAULT_HOST) return;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(`${host}/i/v0/e/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, ...payload }),
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        const result = await response.json().catch(() => null) as { quota_limited?: string[] } | null;
        if (result?.quota_limited?.length) console.error('[purchase-measurement] PostHog quota limited ingestion');
        return;
      }
      if (response.status < 500 && response.status !== 429) break;
    } catch { /* retry the exact event once, without logging credentials */ }
  }
  console.error('[purchase-measurement] PostHog delivery failed');
}
