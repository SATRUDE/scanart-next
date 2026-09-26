import type { Currency } from '@/lib/pricing';

// The delivery guide the shop shows before checkout: a "from" price per
// destination, in every currency the shop sells in.
//
// The numbers are computed on the server (lib/server/delivery-guide.ts) from
// the same socialagent store that checkout charges from, then passed down as
// plain props. This file only holds the shape and the formatting, so the
// basket panel and the product page (both client components) can use it
// without pulling the database client into the browser.

export const GUIDE_CURRENCIES: Currency[] = ['GBP', 'NOK', 'USD', 'DKK', 'SEK'];

/** The five priced markets, then everywhere else. */
export const GUIDE_DESTINATIONS = ['GB', 'NO', 'SE', 'DK', 'US', 'ELSEWHERE'] as const;
export type GuideDestination = (typeof GUIDE_DESTINATIONS)[number];

/**
 * The cheapest delivery for one unframed print, per destination and currency.
 * A framed print costs more, and more prints cost more: these are floors.
 */
export type DeliveryGuide = Record<GuideDestination, Record<Currency, number>>;

/**
 * "£5.99", "£6", "$6.50", "100 kr". Pence stay visible when there are any,
 * because these are exact prices from the store, not rounded ones; Norwegian
 * copy writes the decimal with a comma.
 */
export function formatDeliveryPrice(amount: number, currency: Currency, locale: 'en' | 'no' = 'en'): string {
  if (currency === 'NOK' || currency === 'DKK' || currency === 'SEK') {
    const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    return `${locale === 'no' ? n.replace('.', ',') : n} kr`;
  }
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const symbol = currency === 'GBP' ? '£' : '$';
  return `${symbol}${locale === 'no' ? n.replace('.', ',') : n}`;
}

/**
 * "UK £5.99, Norway and Denmark £7, …, rest of world £8": destinations that
 * cost the same joined, cheapest first, rest of world always named on its own.
 */
export function deliveryGuideLine(
  guide: DeliveryGuide,
  currency: Currency,
  regions: Record<string, string>,
  and: string,
  locale: 'en' | 'no' = 'en'
): string {
  const groups: { names: string[]; cost: number; elsewhere: boolean }[] = [];
  for (const code of GUIDE_DESTINATIONS) {
    const cost = guide[code][currency];
    const name = regions[code] ?? code;
    const elsewhere = code === 'ELSEWHERE';
    const same = !elsewhere && groups.find(g => g.cost === cost && !g.elsewhere);
    if (same) same.names.push(name);
    else groups.push({ names: [name], cost, elsewhere });
  }
  const join = (names: string[]) =>
    names.length > 1 ? `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}` : names[0];
  return groups
    .sort((a, b) => Number(a.elsewhere) - Number(b.elsewhere) || a.cost - b.cost)
    .map(g => `${join(g.names)} ${formatDeliveryPrice(g.cost, currency, locale)}`)
    .join(', ');
}

/** The cheapest delivery anywhere outside the UK: "worldwide from …". */
export function worldwideFrom(guide: DeliveryGuide, currency: Currency): number {
  return Math.min(...GUIDE_DESTINATIONS.filter(code => code !== 'GB').map(code => guide[code][currency]));
}

/**
 * The Help groups with one answer swapped for its priced version, so the
 * page and its FAQPage JSON-LD are built from the same list and say the same.
 */
export function withAnswer<G extends { items: { q: string; a: string }[] }>(groups: G[], q: string, a: string): G[] {
  return groups.map(g => ({ ...g, items: g.items.map(item => (item.q === q ? { ...item, a } : item)) }));
}
