import { vatInside } from '@/config/tax';

// What the gallery keeps from an order, after everyone else is paid.
//
// Pure, so the checkout guard (lib/server/order-guard.ts) and the margin audit
// use the same sum. Money in is what the buyer pays. Money out:
//
//   Gelato     print (frame included) + delivery, from the swept ShippingRate
//              rows in the socialagent store, quoted in EUR.
//   Artist     60% of (print price + delivery fee the buyer pays
//              - Gelato's print cost - Gelato's delivery cost), the Artist
//              Agreement 8a and 13. The FRAME is the gallery's alone, so on a
//              framed line the artist's sum uses the unframed print's price
//              and cost. Never below zero: a loss is the gallery's, not a debt.
//   Card fee   Stripe, worst case for the currency (see CARD_FEE).
//   VAT / MVA  inside the price, at the destination's rate (config/tax.ts).
//
// Card fees and VAT come out of the gallery's 40%, not before the split.

export const ARTIST_SHARE = 0.6;

/**
 * Stripe's fee, worst case, because the card is not known when the payment is
 * set up. The account is a UK one settling in GBP (read 2026-10-07):
 * international cards are 3.25% + 20p, and a charge in any currency other
 * than GBP adds 2% for conversion. UK cards were seen at 1.9% + 20p.
 */
export const CARD_FEE = { percent: 0.0325, conversion: 0.02, fixedGbp: 0.2 } as const;

export interface CostRow {
  size: string;
  frame: string;
  /** EUR. */
  printCost: number;
  /** EUR, cheapest method, first item. */
  shipCost: number;
  /** EUR, what each further item adds. Null means charge it in full again. */
  shipCostAdditional: number | null;
}

export interface MarginLine {
  size?: string;
  /** 'no-frame' or absent for rolled; any frame id for framed. */
  frame?: string;
  quantity: number;
  /** The print alone, before any discount, in the order currency. */
  printPrice: number;
  /** What the frame adds, before any discount, in the order currency. 0 for rolled. */
  framePrice: number;
}

export interface MarginInput {
  country: string;
  currency: string;
  lines: MarginLine[];
  /** Delivery the buyer pays, order currency. */
  shipping: number;
  /**
   * What delivery would have cost the buyer for the same prints ROLLED. The
   * artist's sum uses this on framed lines (the heavier parcel is the frame's,
   * so the gallery's). Omitted means `shipping`, right for a rolled order and
   * generous to the artist on a framed one.
   */
  artistShipping?: number;
  /** The code applied, if any. UNFRAMED touches only rolled lines. */
  discount: { percentage: number; scope: 'ALL' | 'UNFRAMED' } | null;
  /** Gelato's prices for this destination. */
  costs: CostRow[];
  /** Units of the order currency per EUR. */
  perEur: number;
  /** Units of GBP per EUR, for the card fee's fixed 20p. */
  gbpPerEur: number;
  /** Count VAT inside the price. Default true. */
  countVat?: boolean;
}

export interface MarginResult {
  revenue: number;
  gelato: number;
  artist: number;
  cardFee: number;
  vat: number;
  net: number;
  /** Net as a share of what the buyer pays. */
  netPercent: number;
  /** Sizes priced from a stand-in row because this size has none of its own. */
  estimated: string[];
}

const isFramed = (frame?: string) => Boolean(frame) && frame !== 'no-frame';
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The row for this size and frame, or the dearest row for the frame when the
 * size has none (the same stand-in the delivery quote uses), or nothing.
 */
export function costFor(costs: CostRow[], size: string | undefined, framed: boolean): { row: CostRow; estimated: boolean } | null {
  const key = framed ? 'wood' : 'no-frame';
  const forFrame = costs.filter(c => c.frame === key);
  const exact = forFrame.find(c => c.size === size);
  if (exact) return { row: exact, estimated: false };
  const dearest = forFrame.reduce<CostRow | undefined>(
    (a, b) => (!a || b.printCost + b.shipCost > a.printCost + a.shipCost ? b : a),
    undefined
  );
  return dearest ? { row: dearest, estimated: true } : null;
}

/** Gelato's delivery: the dearest item at the first-item rate, every other at its additional rate. */
function deliveryCost(items: { first: number; additional: number | null }[]): number {
  if (!items.length) return 0;
  let dearest = 0;
  items.forEach((item, i) => {
    if (item.first > items[dearest].first) dearest = i;
  });
  return items.reduce((sum, item, i) => sum + (i === dearest ? item.first : (item.additional ?? item.first)), 0);
}

/** Null when the destination has no cost rows at all, so nothing honest can be said. */
export function galleryNet(input: MarginInput): MarginResult | null {
  const { lines, perEur, currency } = input;
  if (!(perEur > 0) || !(input.gbpPerEur > 0) || !lines.length) return null;

  const estimated: string[] = [];
  const pct = input.discount ? input.discount.percentage / 100 : 0;
  const discounts = (framed: boolean) => input.discount !== null && (input.discount.scope === 'ALL' || !framed);

  let revenueGoods = 0;
  let printCostAll = 0;
  let artistGoods = 0;
  const parcels: { first: number; additional: number | null }[] = [];
  const rolledParcels: { first: number; additional: number | null }[] = [];

  for (const line of lines) {
    const framed = isFramed(line.frame);
    const own = costFor(input.costs, line.size, framed);
    const rolled = framed ? costFor(input.costs, line.size, false) : own;
    if (!own || !rolled) return null;
    if (own.estimated || rolled.estimated) estimated.push(line.size ?? 'unknown size');

    const off = discounts(framed) ? pct : 0;
    const printPaid = line.printPrice * (1 - off);
    const framePaid = line.framePrice * (1 - off);
    revenueGoods += (printPaid + (framed ? framePaid : 0)) * line.quantity;
    printCostAll += own.row.printCost * line.quantity;
    // The artist's sale is the rolled print, as paid, less what Gelato
    // charges to print it rolled.
    artistGoods += (printPaid - rolled.row.printCost * perEur) * line.quantity;
    for (let i = 0; i < line.quantity; i++) {
      parcels.push({ first: own.row.shipCost, additional: own.row.shipCostAdditional });
      rolledParcels.push({ first: rolled.row.shipCost, additional: rolled.row.shipCostAdditional });
    }
  }

  const shipCostEur = deliveryCost(parcels);
  const gelato = (printCostAll + shipCostEur) * perEur;
  // The heavier framed parcel is the gallery's cost, so the artist's delivery
  // margin is judged against posting the prints rolled.
  const artistDelivery = (input.artistShipping ?? input.shipping) - deliveryCost(rolledParcels) * perEur;
  const artist = Math.max(0, artistGoods + artistDelivery) * ARTIST_SHARE;

  const revenue = revenueGoods + input.shipping;
  const conversion = currency.toUpperCase() === 'GBP' ? 0 : CARD_FEE.conversion;
  const cardFee = revenue * (CARD_FEE.percent + conversion) + CARD_FEE.fixedGbp * (perEur / input.gbpPerEur);
  const vat = input.countVat === false ? 0 : vatInside(revenue, input.country);
  const net = revenue - gelato - artist - cardFee - vat;

  return {
    revenue: r2(revenue),
    gelato: r2(gelato),
    artist: r2(artist),
    cardFee: r2(cardFee),
    vat: r2(vat),
    net: r2(net),
    netPercent: revenue > 0 ? Math.round((net / revenue) * 1000) / 10 : 0,
    estimated,
  };
}
