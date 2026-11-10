// The one switch for advertising measurement (Meta Pixel and Pinterest tag).
//
// Off since 10 November 2026 (Mark: the shop does not need advertising
// cookies, so it should not ask about them). While this is false:
// - the "Advertising cookies" prompt never renders, and the footer has no
//   "Cookie settings" entry;
// - no Meta or Pinterest script is requested, no advertising cookie or
//   storage is written, and no browser event is sent to either provider;
// - a choice saved by an earlier visit is not read, and is cleared.
//
// The consent machinery (lib/advertising-consent.ts, lib/commerce-measurement.ts,
// components/AdvertisingConsent.tsx) is kept so this can be turned back on.
// Turning it on brings the prompt back with it: see docs/ads-measurement.md.
export const ADVERTISING_ENABLED: boolean = false;
