import { neon } from '@neondatabase/serverless';
import { getShippingRate } from '@/config/shipping';
import { shippingZoneFor } from '@/lib/address';
import type { Currency } from '@/lib/server/order';

// What delivery costs, from Gelato's own prices.
//
// The shop used to charge from a six-row table written by hand, shaped like
// distance from the UK, with one rate for a rolled print and a framed one
// twenty-two times its weight. Live quotes on 2026-08-12 showed what that was
// doing: 89 kr charged to send a framed A1 to Oslo that costs 244 kr to post,
// and 12.99 USD charged to send a rolled one to New York that costs 5.90.
//
// Prices now come from the socialagent store, swept from Gelato whenever Mark
// presses the button on the Costs page, and read here at request time exactly
// as discount codes are. No Gelato call in the checkout, so nothing for a
// buyer to wait on and nothing to break if Gelato is down.
//
// Everything fails towards charging MORE. A missing row, an unconvertible
// currency, a database that is down: each falls back to config/shipping.ts,
// which is a safety net now rather than a price list.

/** Covers exchange-rate movement and however long since the last sweep. */
export const BUFFER = 0.08;

/**
 * What each currency rounds up to.
 *
 * Always UP, so rounding can never take the price below cost. The kroner
 * currencies go to the nearest 5 and the rest to the nearest 0.50, because
 * 250.05 kr is not a number anyone would write on a delivery line.
 */
const ROUND_TO: Record<Currency, number> = {
  NOK: 5,
  SEK: 5,
  DKK: 5,
  GBP: 0.5,
  USD: 0.5,
};

export interface DeliveryItem {
  size?: string;
  frame?: string;
  quantity: number;
}

export interface DeliveryQuote {
  amount: number;
  /** Where the number came from, so a surprise can be traced. */
  source: 'gelato' | 'set-by-hand' | 'fallback';
  /** How stale the swept prices are, in days. */
  ageDays?: number;
}

interface RateRow {
  size: string;
  frame: string;
  shipCost: number;
  shipCostAdditional: number | null;
  quotedAt: string | Date;
}

function databaseUrl(): string | undefined {
  return process.env.ARTICLES_DATABASE_URL ?? process.env.DATABASE_URL;
}

export function roundUp(amount: number, currency: Currency): number {
  const step = ROUND_TO[currency] ?? 0.5;
  return Math.round(Math.ceil(amount / step) * step * 100) / 100;
}

/**
 * A cost turned into a price: add the buffer, round up to the next whole euro,
 * then take a penny off. 5.51 becomes 5.99 (Mark, 2026-08-12). This is the
 * number the Costs page shows in the delivery columns, so the two agree.
 *
 * Guarded, because a cost landing exactly on a whole number would otherwise
 * round to a penny below itself: the one input where "round up" rounds down.
 */
export function priceFromCost(cost: number, buffer = BUFFER): number {
  const nearlyWhole = Math.ceil(cost * (1 + buffer)) - 0.01;
  const price = nearlyWhole >= cost ? nearlyWhole : Math.ceil(cost) + 0.99;
  return Math.round(price * 100) / 100;
}

/**
 * Gelato charges first item + additional x (n-1), and the two are nothing
 * alike: a second rolled print adds about a tenth of the first, a second
 * framed one about half. So the dearest thing in the basket pays the
 * first-item price and everything else pays its own additional rate.
 *
 * An item with no additional rate recorded pays full price again, which
 * overcharges rather than undercharges.
 */
export function combineDelivery(
  items: { first: number; additional: number | null; quantity: number }[]
): number {
  const expanded = items.flatMap(item =>
    Array.from({ length: Math.max(1, Math.floor(item.quantity)) }, () => item)
  );
  if (!expanded.length) return 0;

  let dearestIndex = 0;
  expanded.forEach((item, index) => {
    if (item.first > expanded[dearestIndex].first) dearestIndex = index;
  });

  let total = expanded[dearestIndex].first;
  expanded.forEach((item, index) => {
    if (index === dearestIndex) return;
    total += item.additional ?? item.first;
  });
  return Math.round(total * 100) / 100;
}

/** The hand-written table, used when the store cannot answer. */
function fallback(countryCode: string, currency: Currency): number {
  const rate = getShippingRate(shippingZoneFor(countryCode));
  return rate ? rate.costs[currency] || 0 : 0;
}

/**
 * What to charge for delivery.
 *
 * Never throws and never returns nothing: a database that is down, a country
 * with no rows, or a missing exchange rate all fall back to the old table.
 */
export async function quoteDelivery(
  countryCode: string,
  currency: Currency,
  items: DeliveryItem[]
): Promise<DeliveryQuote> {
  const url = databaseUrl();
  if (!url || !items.length) {
    return { amount: fallback(countryCode, currency), source: 'fallback' };
  }

  try {
    const sql = neon(url);
    const [rates, overrides, fx] = await Promise.all([
      sql`SELECT "size", "frame", "shipCost", "shipCostAdditional", "quotedAt"
          FROM "ShippingRate" WHERE "country" = ${countryCode}` as unknown as Promise<RateRow[]>,
      sql`SELECT "size", "frame", "price" FROM "DeliveryPrice"
          WHERE "country" = ${countryCode} AND "currency" = ${currency}` as unknown as Promise<
        { size: string; frame: string; price: number }[]
      >,
      sql`SELECT "perEur" FROM "FxRate" WHERE "currency" = ${currency}` as unknown as Promise<
        { perEur: number }[]
      >,
    ]);

    const perEur = fx[0]?.perEur;
    if (!rates.length || !perEur) {
      return { amount: fallback(countryCode, currency), source: 'fallback' };
    }

    const priced: { first: number; additional: number | null; quantity: number }[] = [];
    let usedOverride = false;

    for (const item of items) {
      const frame = item.frame && item.frame !== 'no-frame' ? 'wood' : 'no-frame';
      // Matched on size as well as frame, and on the currency the buyer is
      // paying in, because that is what the price was typed in.
      const override = overrides.find(o => o.size === item.size && o.frame === frame);

      if (override) {
        // A price Mark set is charged exactly as typed: no buffer, no
        // conversion, no rounding up on top of it. Gelato's cost is the guide
        // he set it against, not a floor to be applied again here.
        usedOverride = true;
        priced.push({ first: override.price, additional: override.price, quantity: item.quantity });
        continue;
      }

      // Matched on size AND frame; an unknown size takes the dearest row for
      // that frame, because a size we cannot identify is not a reason to post
      // something cheaply.
      const exact = rates.find(r => r.size === item.size && r.frame === frame);
      const forFrame = rates.filter(r => r.frame === frame);
      const row =
        exact ??
        forFrame.reduce<RateRow | undefined>((a, b) => (!a || b.shipCost > a.shipCost ? b : a), undefined);
      if (!row) return { amount: fallback(countryCode, currency), source: 'fallback' };

      // Costs become prices HERE, per row, so a single print is charged the
      // exact figure the Costs page shows against its size rather than that
      // figure recomputed from a different direction.
      // Converted here rather than on the total, because the basket can hold
      // both a price Mark set (already in the buyer's currency) and one
      // derived from a cost (in euros).
      priced.push({
        first: roundUp(priceFromCost(row.shipCost) * perEur, currency),
        additional:
          row.shipCostAdditional === null
            ? null
            : roundUp(priceFromCost(row.shipCostAdditional) * perEur, currency),
        quantity: item.quantity,
      });
    }

    // No rounding on the total. Every item was either typed by Mark, and is
    // charged exactly as typed, or was rounded when it was converted just
    // above. Rounding again would quietly move a price he set.
    const amount = combineDelivery(priced);

    const oldest = rates.reduce(
      (acc, r) => Math.min(acc, new Date(r.quotedAt).getTime()),
      Number.POSITIVE_INFINITY
    );

    return {
      amount,
      source: usedOverride ? 'set-by-hand' : 'gelato',
      ageDays: Math.floor((Date.now() - oldest) / 86_400_000),
    };
  } catch (error) {
    console.error('[shipping-rates] falling back to the static table:', error);
    return { amount: fallback(countryCode, currency), source: 'fallback' };
  }
}
