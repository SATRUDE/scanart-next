import { countries, type Country } from '@/contexts/LanguageContext';

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

export type ShippingCountry = Country | 'ELSEWHERE';

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

export function getAddressFormat(country: ShippingCountry): AddressFormat {
  return FORMATS[country] ?? FORMATS.ELSEWHERE;
}

/**
 * The destinations the checkout offers, in the order they are shown.
 *
 * Deliberately the same five the shipping table prices, plus everywhere else.
 * The site promises worldwide delivery and the ELSEWHERE rate is real, so the
 * option has to exist; whether to offer a full country list instead is a
 * separate question, filed on the board rather than answered here.
 */
export interface Destination {
  code: ShippingCountry;
  name: string;
}

export const DESTINATIONS: Destination[] = [
  ...countries.map(c => ({ code: c.code as ShippingCountry, name: c.name })),
  { code: 'ELSEWHERE' as ShippingCountry, name: 'Somewhere else' },
];

/** The display name for a destination code, for the order record and Slack. */
export function destinationName(code: ShippingCountry): string {
  return DESTINATIONS.find(d => d.code === code)?.name ?? 'Somewhere else';
}

/**
 * Where to start the country field.
 *
 * The buyer has already told us where they are by choosing a currency and
 * language, so starting anywhere else makes them correct us. Defaulting to the
 * United States made a Norwegian buyer's first act on the form an act of
 * correction, on the page where we ask them to trust us with a card.
 */
export function defaultDestination(browsing: Country): ShippingCountry {
  return DESTINATIONS.some(d => d.code === browsing) ? browsing : 'ELSEWHERE';
}
