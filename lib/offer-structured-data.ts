import { EU_COUNTRIES, FREE_DELIVERY_COUNTRIES, FREE_DELIVERY_THRESHOLD } from '@/config/free-delivery';
import type { PricedProduct } from '@/lib/pricing';

// The return policy and the shipping details on every product Offer (T-0158).
//
// Search Console's merchant listings warned on all twelve products for a
// missing returnMethod and on eleven for a missing shippingDetails (Peggy,
// 6 Oct). Both pages (English and Norwegian) build these from here, so the
// markup cannot drift between them, and the test validates the shape against
// Google's merchant-listing rules.

/** Where the policy and the free-delivery rule apply: UK, Norway, US, the EU. */
export const RETURN_POLICY_COUNTRIES = ['GB', 'NO', 'US', ...EU_COUNTRIES];

/**
 * The Delivery & Returns and Terms pages, as updated 21 Oct 2026: the right to
 * cancel within 14 days of receiving the order; made to order, so nothing is
 * sent back and the refund is issued on request by email. Nothing is ever
 * charged for a return, so FreeReturn. returnMethod is ReturnByMail, the
 * nearest of Google's three values (kiosk, store, mail) to "tell us by email,
 * keep the print": schema.org has no "no return needed" method.
 *
 * Not expressible, and so left to the pages: cancelling PART of an order that
 * then falls under the free-delivery minimum has the standard delivery charge
 * deducted from the refund. That is the outbound delivery, not a return fee,
 * so it does not make returnFees anything other than free.
 */
export function productReturnPolicy() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: RETURN_POLICY_COUNTRIES,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  };
}

/** The destinations the Offer describes, with the shop's transit estimate in
 *  business days (config/shipping.ts estimatedDays, the Help answer). These
 *  are the five markets checkout prices from Gelato's own rates. */
export const OFFER_SHIPPING_DESTINATIONS = [
  { country: 'GB', transit: [2, 3] },
  { country: 'NO', transit: [3, 5] },
  { country: 'SE', transit: [3, 5] },
  { country: 'DK', transit: [3, 5] },
  { country: 'US', transit: [5, 7] },
] as const;

export type OfferShippingCountry = (typeof OFFER_SHIPPING_DESTINATIONS)[number]['country'];

/** Made to order: 1 to 4 business days in production (Help, Delivery page). */
export const HANDLING_DAYS = [1, 4] as const;

/**
 * The size the Offer's price is: the lowest GBP price. The Offer states that
 * price, so its delivery has to be the delivery of that same print.
 */
export function lowestPricedSize(product: PricedProduct): string | undefined {
  const prices = product.prices;
  if (!prices) return undefined;
  let best: string | undefined;
  for (const [size, p] of Object.entries(prices)) {
    if (!p?.GBP) continue;
    if (best === undefined || p.GBP < prices[best].GBP) best = size;
  }
  return best;
}

/**
 * OfferShippingDetails for the Offer: ONE UNFRAMED print at the Offer's price.
 *
 * The free-delivery rule (config/free-delivery.ts) is free over GBP 100 with
 * nothing framed, to the UK, EU, Norway and US. schema.org has no way to say
 * "no framed print", and a basket threshold (ShippingConditions.orderValue)
 * would claim free delivery for framed orders too. The Offer already is the
 * unframed print (its price is the lowest, which is always unframed), so this
 * describes that print exactly as checkout would charge it on its own: free
 * when its own price reaches the threshold in a free-delivery country, the
 * real Gelato-derived rate otherwise. A framed print never appears here, so
 * nothing here can promise it free delivery.
 *
 * @param rates GBP delivery for one unframed print of that size, per country,
 *   from quoteDelivery. A country with no positive rate is left out rather
 *   than marked free: a zero from the store is a missing row, not a price.
 */
export function offerShippingDetails(priceGBP: number, rates: Partial<Record<OfferShippingCountry, number>>) {
  const freeByPrice = Math.round(priceGBP * 100) >= Math.round(FREE_DELIVERY_THRESHOLD.GBP * 100);
  return OFFER_SHIPPING_DESTINATIONS.flatMap(({ country, transit }) => {
    const rate = rates[country];
    if (!(typeof rate === 'number' && rate > 0)) return [];
    const free = freeByPrice && FREE_DELIVERY_COUNTRIES.has(country);
    return [
      {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: free ? 0 : rate, currency: 'GBP' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: country },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: HANDLING_DAYS[0], maxValue: HANDLING_DAYS[1], unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: transit[0], maxValue: transit[1], unitCode: 'DAY' },
        },
      },
    ];
  });
}
