// The one switch for advertising measurement (Meta Pixel and Pinterest tag).
//
// On again since 16 November 2026 (Mark's decision, for retargeting). It was
// switched off on 10 November, which also removed retargeting. While this is true:
// - the "Advertising cookies" prompt renders, and the footer has a
//   "Cookie settings" entry;
// - the Meta Pixel and Pinterest tag load only after a visitor accepts
//   advertising, and no advertising cookie or event is written or sent before;
// - the privacy pages describe the optional advertising cookies.
//
// Setting it to false turns the prompt, the footer entry, the tags and every
// ad-platform event off together, and clears an earlier choice: see
// docs/ads-measurement.md. The cookieless same-visit UTM order credit
// (lib/campaign.ts) does not depend on this switch.
export const ADVERTISING_ENABLED: boolean = true;
