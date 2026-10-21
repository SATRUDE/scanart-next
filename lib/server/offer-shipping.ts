import { quoteDelivery } from '@/lib/server/shipping-rates';
import { OFFER_SHIPPING_DESTINATIONS, type OfferShippingCountry } from '@/lib/offer-structured-data';

// GBP delivery for one unframed print of a size, to each Offer destination,
// asked of the same function checkout charges with (T-0158). Memoised per
// size for the life of the server process, so a build quotes each size once
// rather than once per product page and per language.

const cache = new Map<string, Promise<Partial<Record<OfferShippingCountry, number>>>>();

export function getOfferShippingRates(size: string | undefined): Promise<Partial<Record<OfferShippingCountry, number>>> {
  const key = size ?? '';
  let rates = cache.get(key);
  if (!rates) {
    rates = Promise.all(
      OFFER_SHIPPING_DESTINATIONS.map(async ({ country }) => {
        const quote = await quoteDelivery(country, 'GBP', [{ size, frame: 'no-frame', quantity: 1 }]);
        return [country, quote.amount] as const;
      })
    ).then(entries => Object.fromEntries(entries));
    // A failure is not cached: the next render tries again.
    rates.catch(() => cache.delete(key));
    cache.set(key, rates);
  }
  return rates;
}
