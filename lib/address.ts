import { shippingRates } from '@/config/shipping';
import { ALL_COUNTRIES, countryName, isKnownCountry } from '@/lib/countries';

// Deliberately no import from contexts/LanguageContext: that module is
// 'use client', and this one is used by the payment API, where pulling a
// client module in breaks the build. The list of countries with their own
// shipping rate lives in config/shipping.ts, which is the real source of
// truth for it anyway.

// What a shipping address looks like in each country we deliver to.
//
// The checkout asked every buyer for a "State" and a "ZIP Code", both
// required, with the country defaulting to the United States. Norway has
// neither of those things, and on 2026-08-11 a Norwegian buyer stopped on that
// exact card twice after having already read the whole page once.
//
// So the form is described per destination rather than assumed. Nothing here
// touches pricing or payment: shipping RATES stay in config/shipping.ts, and
// this is only about what the buyer is asked to type.

/** The zones config/shipping.ts prices: five countries plus everywhere else. */
export type ShippingCountry = 'GB' | 'NO' | 'US' | 'DK' | 'SE' | 'ELSEWHERE';

export interface AddressFormat {
  /** What the postal code is called where the buyer lives. */
  postalLabel: string;
  /** An example, shown as the field's placeholder. */
  postalExample: string;
  /**
   * Whether the country has a state or province that belongs in an address.
   * Most of Europe does not, and asking is worse than useless: it is a
   * required field with no correct answer.
   */
  hasRegion: boolean;
  /** What that region is called, where there is one. */
  regionLabel?: string;
}

const FORMATS: Record<ShippingCountry, AddressFormat> = {
  GB: { postalLabel: 'Postcode', postalExample: 'SW1A 1AA', hasRegion: false },
  NO: { postalLabel: 'Postnummer', postalExample: '0284', hasRegion: false },
  DK: { postalLabel: 'Postnummer', postalExample: '1050', hasRegion: false },
  SE: { postalLabel: 'Postnummer', postalExample: '111 29', hasRegion: false },
  US: { postalLabel: 'ZIP Code', postalExample: '10001', hasRegion: true, regionLabel: 'State' },
  // Everywhere else: ask for a postal code, do not guess at a region. A buyer
  // whose country has one can put it in the address line.
  ELSEWHERE: { postalLabel: 'Postal code', postalExample: '', hasRegion: false },
};

/**
 * Takes any country code, not just a priced one: the picker offers 267
 * countries and only five have their own entry here. Anything unrecognised
 * gets the neutral form, never a crash and never an American one.
 */
export function getAddressFormat(country: string): AddressFormat {
  return FORMATS[country as ShippingCountry] ?? FORMATS.ELSEWHERE;
}

/**
 * The countries the checkout offers: all of them.
 *
 * The site promises worldwide delivery and it means it, so the picker has to
 * let someone say where they actually live. The five countries with their own
 * shipping rate are listed first because they are most of our traffic;
 * everything else follows alphabetically.
 *
 * A picker that stopped at six was the old shape, and it forced a German buyer
 * to choose "Somewhere else", which recorded no country at all on the payment.
 * Gelato cannot post a print to that.
 */
export interface Destination {
  code: string;
  name: string;
  /** True for the five with their own rate, so the picker can group them. */
  priced: boolean;
}

const PRICED_CODES: string[] = shippingRates
  .map(rate => rate.countryCode as string)
  .filter(code => code !== 'ELSEWHERE');

export const DESTINATIONS: Destination[] = [
  ...PRICED_CODES.map(code => ({ code, name: countryName(code) ?? code, priced: true })),
  ...ALL_COUNTRIES.filter(c => !PRICED_CODES.includes(c.code)).map(c => ({
    code: c.code,
    name: c.name,
    priced: false,
  })),
];

/** The display name for a country code, for the order record and Slack. */
export function destinationName(code: string): string {
  return countryName(code) ?? code;
}

/**
 * Which shipping zone a country is priced in.
 *
 * Five countries have their own rate; everywhere else pays the Rest of World
 * rate. Crucially an UNRECOGNISED code also lands on Rest of World rather than
 * on nothing: config/shipping.ts returns undefined for a code it does not
 * know, and the old caller turned that into zero, so `countryCode: "ZZ"`
 * bought free delivery. The server sets the price, so it must have a price for
 * every input.
 */
export function shippingZoneFor(code: string): ShippingCountry {
  if (PRICED_CODES.includes(code)) return code as ShippingCountry;
  return 'ELSEWHERE';
}

/** Whether a code is a real country we can address a parcel to. */
export function isDeliverable(code: string): boolean {
  return isKnownCountry(code);
}

/**
 * Where to start the country field.
 *
 * The buyer has already told us where they are by choosing a currency and
 * language, so starting anywhere else makes them correct us. Defaulting to the
 * United States made a Norwegian buyer's first act on the form an act of
 * correction, on the page where we ask them to trust us with a card.
 */
export function defaultDestination(browsing: string): string {
  return DESTINATIONS.some(d => d.code === browsing) ? browsing : 'GB';
}
