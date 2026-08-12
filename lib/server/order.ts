import { getAllProducts } from '@/lib/products';
import { getProductPrice } from '@/lib/pricing';
import { getFramePrice } from '@/config/frame';
import { getShippingRate } from '@/config/shipping';
import { lookupDiscountCode, type DiscountLookup } from '@/lib/server/discounts';
import type { MetadataItem } from '@/lib/server/order-metadata';
import { shippingZoneFor } from '@/lib/address';

// Server-side order maths: the single source of truth for what an order
// costs. The client's totals are display only; the payment intent amount is
// always recomputed here from the catalogue, so a tampered request cannot
// change what gets charged.
//
// Discount codes live in the socialagent store (lib/server/discounts.ts).
// They were in the DISCOUNT_CODES env var until 2026-08-12; that var could
// never say how often a code had been redeemed, and had in fact never been set
// in production, so every code a buyer typed was rejected. Either way the rule
// is unchanged: no code found means no discount, which fails safe, and no
// working code is ever committed to this public repository.

export type Currency = 'GBP' | 'NOK' | 'USD' | 'DKK' | 'SEK';
export const CURRENCIES: Currency[] = ['GBP', 'NOK', 'USD', 'DKK', 'SEK'];

export interface OrderItemInput {
  productId: string;
  size?: string;
  frame?: string;
  quantity: number;
}

export interface ComputedOrder {
  amount: number;
  subtotal: number;
  shipping: number;
  discount: { code: string; percentage: number } | null;
  discountAmount: number;
  /** The priced lines, ready to be recorded onto the PaymentIntent. */
  items: MetadataItem[];
}

export async function computeOrderAmount(
  items: OrderItemInput[],
  currency: Currency,
  countryCode: string,
  discountCode?: string,
  // Injected so the maths can be tested without a database. Production always
  // uses the store; see lib/server/discounts.ts.
  lookup: DiscountLookup = lookupDiscountCode
): Promise<ComputedOrder> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new Error('Invalid order items');
  }

  const products = await getAllProducts();
  const byId = new Map(products.map(p => [p.id, p]));

  let subtotal = 0;
  // Built here rather than from the request body, because this is the only
  // place that knows what each line actually costs. It becomes the order
  // recorded on the PaymentIntent, so what Stripe carries is what we charged,
  // not what the browser said it was buying.
  const resolved: MetadataItem[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    const quantity = Math.floor(item.quantity);
    if (!product) throw new Error(`Unknown product: ${item.productId}`);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      throw new Error('Invalid quantity');
    }
    const unitPrice = getProductPrice(product, item.size, currency);
    if (!unitPrice) throw new Error(`No price for product: ${item.productId}`);
    const frameCost = item.frame ? getFramePrice(item.frame, item.size, currency) : 0;
    subtotal += (unitPrice + frameCost) * quantity;
    resolved.push({
      slug: product.slug,
      size: item.size,
      frame: item.frame,
      quantity,
      unitPrice: Math.round((unitPrice + frameCost) * 100) / 100,
    });
  }
  subtotal = Math.round(subtotal * 100) / 100;

  // Every country maps to a zone that HAS a rate. An unrecognised code lands
  // on Rest of World, never on nothing: getShippingRate returns undefined for
  // a code it does not know, and turning that into zero meant a request
  // carrying `countryCode: "ZZ"` was quietly charged no delivery at all.
  const shippingRate = getShippingRate(shippingZoneFor(countryCode));
  const shipping = shippingRate ? shippingRate.costs[currency] || 0 : 0;

  const discount = discountCode ? await lookup(discountCode) : null;
  const discountAmount = discount
    ? Math.round(((subtotal * discount.percentage) / 100) * 100) / 100
    : 0;

  const amount = Math.round((subtotal + shipping - discountAmount) * 100) / 100;
  return { amount, subtotal, shipping, discount, discountAmount, items: resolved };
}
