import { EU_COUNTRIES } from '@/config/free-delivery';

// Who pays in euro (Mark, 24 Nov 2026, T-0573).
//
// Until then the shop knew five markets (GB, NO, US, DK, SE) and everyone else
// fell back to the UK list in pounds. An EU buyer paid GBP prices set for UK
// costs and UK VAT, and in the Netherlands, France, Finland, Ireland and Spain
// 101 of 264 order shapes missed Mark's margin rule. The euro list is priced
// for EU VAT and Gelato's EU costs instead.
//
// Denmark and Sweden are EU members with their own currency and their own
// price list, so they keep it. Every other member state is priced in euro,
// including the few that do not use it (Poland, Czechia, Hungary and so on):
// one list for the single market is simpler for a buyer than pounds, and the
// list is checked against the dearest VAT and delivery among all of them.

/** The cookie value, and the picker's code, for the euro price list. */
export const EURO_MARKET = 'EU';

/** The markets with their own currency and price list. */
const OWN_MARKETS = ['GB', 'NO', 'US', 'DK', 'SE'];

/** EU members priced in euro: every member state but Denmark and Sweden. */
export const EURO_COUNTRIES: readonly string[] = EU_COUNTRIES.filter(c => c !== 'DK' && c !== 'SE');

/** Whether a visitor from this country (ISO alpha-2) is priced in euro. */
export function paysInEuro(country: string | null | undefined): boolean {
  return !!country && EURO_COUNTRIES.includes(country.toUpperCase());
}

/** The price list a visitor from this country starts on (the `geo-country`
 *  cookie proxy.ts sets): their own market, the euro list for the EU outside
 *  Denmark and Sweden, and pounds for everyone else. */
export function marketFor(country: string): string {
  if (OWN_MARKETS.includes(country)) return country;
  if (paysInEuro(country)) return EURO_MARKET;
  return 'GB';
}

/** Where a euro visitor is, as proxy.ts saw it, so checkout can start the
 *  delivery country there rather than on the UK. */
export const WHERE_COOKIE = 'geo-where';

/** The euro visitor's own country from that cookie, or '' if unknown. Safe to
 *  call on the server, where there is no document. */
export function euroVisitorCountry(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`${WHERE_COOKIE}=([A-Za-z]{2})`));
  return match && paysInEuro(match[1]) ? match[1].toUpperCase() : '';
}
