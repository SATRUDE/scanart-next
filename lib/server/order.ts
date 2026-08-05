import { getAllProducts } from '@/lib/products';
import { getProductPrice } from '@/lib/pricing';
import { getFramePrice } from '@/config/frame';
import { getShippingRate } from '@/config/shipping';
import type { Country } from '@/contexts/LanguageContext';

// Server-side order maths: the single source of truth for what an order
// costs. The client's totals are display only; the payment intent amount is
// always recomputed here from the catalogue, so a tampered request cannot
// change what gets charged.
//
// Discount codes live in the DISCOUNT_CODES env var ("CODE:10,CODE2:15"),
// never in source: this repository is public, so any code committed here is
// published. No env var means no valid codes, which fails safe.

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
}

function parseDiscountCodes(): Record<string, number> {
  const raw = process.env.DISCOUNT_CODES || '';
  const codes: Record<string, number> = {};
  for (const entry of raw.split(',')) {
    const [code, pct] = entry.split(':').map(s => s?.trim());
    const percentage = Number(pct);
    if (code && Number.isFinite(percentage) && percentage > 0 && percentage <= 100) {
      codes[code.toUpperCase()] = percentage;
    }
  }
  return codes;
}

export function validateDiscountCode(code: string): { code: string; percentage: number } | null {
  const normalised = code.trim().toUpperCase();
  const percentage = parseDiscountCodes()[normalised];
  return percentage ? { code: normalised, percentage } : null;
}

export async function computeOrderAmount(
  items: OrderItemInput[],
  currency: Currency,
  countryCode: string,
  discountCode?: string
): Promise<ComputedOrder> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new Error('Invalid order items');
  }

  const products = await getAllProducts();
  const byId = new Map(products.map(p => [p.id, p]));

  let subtotal = 0;
  for (const item of items) {
    const product = byId.get(item.productId);
    const quantity = Math.floor(item.quantity);
    if (!product) throw new Error(`Unknown product: ${item.productId}`);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      throw new Error('Invalid quantity');
    }
    const unitPrice = getProductPrice(product, item.size, currency);
    if (!unitPrice) throw new Error(`No price for product: ${item.productId}`);
    const frameCost = item.frame ? getFramePrice(item.frame, currency) : 0;
    subtotal += (unitPrice + frameCost) * quantity;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  const shippingRate = getShippingRate(countryCode as Country | 'ELSEWHERE');
  const shipping = shippingRate ? shippingRate.costs[currency] || 0 : 0;

  const discount = discountCode ? validateDiscountCode(discountCode) : null;
  const discountAmount = discount
    ? Math.round(((subtotal * discount.percentage) / 100) * 100) / 100
    : 0;

  const amount = Math.round((subtotal + shipping - discountAmount) * 100) / 100;
  return { amount, subtotal, shipping, discount };
}
