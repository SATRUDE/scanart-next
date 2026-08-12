// The order metadata contract between this shop and the socialagent Orders
// page.
//
// A PaymentIntent only knows what we put on it. Until now it carried an amount
// and nothing else, so Stripe recorded that money had changed hands but not
// what was bought, by whom, or where it should ship. This encodes the order
// onto `metadata` at creation.
//
// Stripe's limits shape the format: 50 keys, a key at most 40 characters and a
// value at most 500. A JSON basket blows the value limit on a large cart, so
// items go in as a compact delimited string, chunked across numbered keys.
//
// DECODER LIVES IN socialagent (src/lib/server/order-metadata.ts). The two must
// agree; both sides carry the same tests over the same fixtures.

export const STRIPE_METADATA_VALUE_LIMIT = 500;

/** How many `order_items_N` chunks we will write (2,000 characters of basket). */
export const MAX_ITEM_CHUNKS = 4;

const ITEM_SEPARATOR = ';';
const FIELD_SEPARATOR = '~';

export interface MetadataItem {
  slug: string;
  size?: string;
  frame?: string;
  quantity: number;
  /** Unit price in major units, print plus frame, before any discount. */
  unitPrice: number;
}

export interface OrderMetadataInput {
  items: MetadataItem[];
  currency: string;
  subtotal: number;
  shipping: number;
  countryCode: string;
  discount?: { code: string; percentage: number } | null;
  discountAmount?: number;
}

/**
 * Strip the delimiters out of a field. Slugs and sizes are already tame, but
 * an encoded value that contained a "~" would silently shift every later field
 * along by one, which is the kind of bug that only shows up on the one order
 * that matters.
 */
function encodeField(value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const cleaned = String(value).replace(/[;~]/g, '');
  return cleaned === '' ? '-' : cleaned;
}

export function encodeOrderItems(items: MetadataItem[]): string {
  return items
    .map(item =>
      [
        encodeField(item.slug),
        encodeField(item.size),
        encodeField(item.frame),
        String(Math.max(1, Math.floor(item.quantity))),
        String(Math.round(item.unitPrice * 100) / 100),
      ].join(FIELD_SEPARATOR)
    )
    .join(ITEM_SEPARATOR);
}

/**
 * Split the basket across `order_items_1..N`. Splitting on the item boundary
 * rather than mid-string would be tidier, but the decoder simply concatenates
 * the chunks, so a plain character split is what keeps the two sides trivially
 * in agreement. A basket longer than the chunks we allow is truncated and
 * flagged, never silently shortened.
 */
export function chunkItems(encoded: string): Record<string, string> {
  const out: Record<string, string> = {};
  let remaining = encoded;
  for (let index = 1; index <= MAX_ITEM_CHUNKS && remaining.length > 0; index += 1) {
    out[`order_items_${index}`] = remaining.slice(0, STRIPE_METADATA_VALUE_LIMIT);
    remaining = remaining.slice(STRIPE_METADATA_VALUE_LIMIT);
  }
  if (remaining.length > 0) out.order_items_truncated = '1';
  return out;
}

function money(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Everything the Orders page needs to say what an order was. */
export function buildOrderMetadata(input: OrderMetadataInput): Record<string, string> {
  const metadata: Record<string, string> = {
    ...chunkItems(encodeOrderItems(input.items)),
    order_currency: input.currency.toUpperCase(),
    order_subtotal: money(input.subtotal),
    order_shipping: money(input.shipping),
    order_country: input.countryCode,
  };
  if (input.discount) {
    metadata.order_discount_code = input.discount.code;
    metadata.order_discount_amount = money(input.discountAmount ?? 0);
  }
  return metadata;
}

/** The one-line summary Stripe shows against the payment in its own dashboard. */
export function buildOrderDescription(items: MetadataItem[]): string {
  const described = items
    .map(item => {
      const name = item.slug.replace(/-/g, ' ');
      const parts = [name];
      if (item.size) parts.push(item.size);
      if (item.frame && item.frame !== 'no-frame') parts.push(`${item.frame} frame`);
      const line = parts.join(', ');
      return item.quantity > 1 ? `${line} x${item.quantity}` : line;
    })
    .join('; ');
  return described.length > 300 ? `${described.slice(0, 297)}...` : described;
}
