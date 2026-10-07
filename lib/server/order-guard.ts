import { neon } from '@neondatabase/serverless';
import { GUARD_COUNTS_VAT } from '@/config/tax';
import type { ComputedOrder, Currency } from '@/lib/server/order';
import { galleryNet, type CostRow, type MarginResult } from '@/lib/server/order-margin';
import { quoteDelivery, type DeliveryItem } from '@/lib/server/shipping-rates';

// The last check before a payment is set up: never take an order that loses
// money (Mark, 2026-10-07).
//
// Refuses when
//   - any line's price, a framed line's frame price, or the delivery charge
//     resolves to zero or to nothing, or
//   - the gallery's net on the order, after Gelato, the artist's 60%, the
//     card fee and (when switched on) VAT, would be below zero.
//
// Prices are never changed here. A refused order is logged and posted to
// Slack so the price can be looked at; the buyer is told plainly and charged
// nothing.
//
// When the costs cannot be read (store down, a country never swept, no
// exchange rate) the margin cannot be judged. That is logged and alerted but
// NOT refused: delivery then comes from the static table, which was set to
// cover the dearest case, and refusing would turn a database blip into a shop
// that cannot sell. The zero checks still apply.

export class UnsafeOrderError extends Error {
  constructor(
    message: string,
    readonly reasons: string[],
    readonly margin: MarginResult | null
  ) {
    super(message);
    this.name = 'UnsafeOrderError';
  }
}

export interface GuardCosts {
  costs: CostRow[];
  perEur: number | null;
  gbpPerEur: number | null;
}

/** What the guard needs from the store. Injected in tests. */
export type CostLoader = (country: string, currency: Currency) => Promise<GuardCosts | null>;

export const loadGuardCosts: CostLoader = async (country, currency) => {
  const url = process.env.ARTICLES_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = neon(url);
    const [costs, fx] = await Promise.all([
      sql`SELECT "size", "frame", "printCost", "shipCost", "shipCostAdditional"
          FROM "ShippingRate" WHERE "country" = ${country}` as unknown as Promise<CostRow[]>,
      sql`SELECT "currency", "perEur" FROM "FxRate" WHERE "currency" IN (${currency}, 'GBP')` as unknown as Promise<
        { currency: string; perEur: number }[]
      >,
    ]);
    const rate = (c: string) => fx.find(f => f.currency === c)?.perEur ?? null;
    return { costs, perEur: rate(currency), gbpPerEur: rate('GBP') };
  } catch (error) {
    console.error('[order-guard] could not read costs:', error);
    return null;
  }
};

/** The zero checks, which need no costs. Pure. */
export function zeroProblems(order: Pick<ComputedOrder, 'lines' | 'shipping'>): string[] {
  const problems: string[] = [];
  const ok = (n: number) => typeof n === 'number' && Number.isFinite(n) && n > 0;
  for (const line of order.lines) {
    const what = `${line.size ?? 'unknown size'}${line.frame && line.frame !== 'no-frame' ? `, ${line.frame} frame` : ''}`;
    if (!ok(line.printPrice)) problems.push(`no price for ${what}`);
    if (line.frame && line.frame !== 'no-frame' && !ok(line.framePrice)) problems.push(`no frame price for ${what}`);
  }
  if (!ok(order.shipping)) problems.push('delivery came to zero');
  return problems;
}

export interface GuardResult {
  margin: MarginResult | null;
  /** Why the margin was not judged, when it was not. */
  unjudged?: string;
}

/**
 * Throws UnsafeOrderError when the order must not be taken. Returns the margin
 * otherwise (null when it could not be judged), for the log.
 */
export async function assertOrderIsSafe(
  order: ComputedOrder,
  country: string,
  currency: Currency,
  deps: {
    loadCosts?: CostLoader;
    deliver?: (country: string, currency: Currency, items: DeliveryItem[]) => Promise<{ amount: number }>;
    alert?: (text: string) => Promise<void>;
  } = {}
): Promise<GuardResult> {
  const loadCosts = deps.loadCosts ?? loadGuardCosts;
  const deliver = deps.deliver ?? quoteDelivery;
  const alert = deps.alert ?? sendGuardAlert;
  const summary = `${country} ${currency} ${order.lines
    .map(l => `${l.quantity}x ${l.size ?? '?'} ${l.frame ?? 'no-frame'}`)
    .join(', ')}, total ${order.amount}`;

  const zeros = zeroProblems(order);
  if (zeros.length) {
    await refuse(zeros, null);
  }

  const data = await loadCosts(country, currency);
  if (!data || !data.costs.length || !data.perEur || !data.gbpPerEur) {
    const why = !data ? 'costs unreadable' : !data.costs.length ? `no Gelato costs for ${country}` : 'no exchange rate';
    console.warn(`[order-guard] margin not judged (${why}): ${summary}`);
    await safely(alert(`Order margin NOT checked (${why}): ${summary}. Taken anyway.`));
    return { margin: null, unjudged: why };
  }

  // The artist's sum uses what delivery would cost the buyer for the same
  // prints rolled; the framed parcel's extra is the gallery's.
  const framed = order.lines.some(l => l.frame && l.frame !== 'no-frame');
  let artistShipping = order.shipping;
  if (framed) {
    try {
      const rolled = await deliver(
        country,
        currency,
        order.lines.map(l => ({ size: l.size, frame: 'no-frame', quantity: l.quantity }))
      );
      if (rolled.amount > 0) artistShipping = Math.min(rolled.amount, order.shipping);
    } catch {
      // Keep the framed figure: generous to the artist, so cautious for us.
    }
  }

  const margin = galleryNet({
    country,
    currency,
    lines: order.lines,
    shipping: order.shipping,
    artistShipping,
    discount: order.discount ? { percentage: order.discount.percentage, scope: order.discount.scope } : null,
    costs: data.costs,
    perEur: data.perEur,
    gbpPerEur: data.gbpPerEur,
    countVat: GUARD_COUNTS_VAT,
  });
  if (!margin) {
    console.warn(`[order-guard] margin not judged (no cost row for a line): ${summary}`);
    await safely(alert(`Order margin NOT checked (no cost row): ${summary}. Taken anyway.`));
    return { margin: null, unjudged: 'no cost row' };
  }
  if (margin.net < 0) {
    await refuse([`gallery net ${margin.net} ${currency}`], margin);
  }
  return { margin };

  async function refuse(reasons: string[], m: MarginResult | null): Promise<never> {
    const detail = m
      ? ` (pays ${m.revenue}: Gelato ${m.gelato}, artist ${m.artist}, card ${m.cardFee}, VAT ${m.vat}, net ${m.net})`
      : '';
    console.error(`[order-guard] REFUSED ${summary}: ${reasons.join('; ')}${detail}`);
    await safely(alert(`Checkout REFUSED an order: ${summary}. ${reasons.join('; ')}${detail}`));
    throw new UnsafeOrderError(
      'We cannot take this order as it stands. Nothing has been charged. Please email hello@scandinavianart.co.uk and we will sort it out.',
      reasons,
      m
    );
  }
}

async function safely(p: Promise<void>): Promise<void> {
  try {
    await p;
  } catch (error) {
    console.error('[order-guard] alert failed:', error);
  }
}

/** Posts to the same Slack channel as sales. Does nothing without a webhook. */
export async function sendGuardAlert(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `:warning: ${text}` }),
  });
}
