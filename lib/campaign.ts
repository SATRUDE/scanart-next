// Which ad a visit came from, carried to the order without cookies.
//
// The landing URL's utm_source, utm_medium, utm_campaign and utm_content are
// kept in memory only: module state that survives client-side navigation and
// is gone on a reload or a new tab. Nothing is written to a cookie,
// localStorage, sessionStorage or IndexedDB, because storing it on the
// visitor's device would need their consent. First touch wins within the
// visit. A purchase in a later visit is therefore not credited to the ad,
// which is accepted.
//
// The same validation runs in the browser, when the payment is created and
// when the webhook builds the purchase event: a value that fails it is
// dropped, and checkout never fails because of it.

export const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
export type CampaignKey = (typeof CAMPAIGN_KEYS)[number];
export type Campaign = Partial<Record<CampaignKey, string>>;

const VALUE = /^[a-z0-9._-]{1,80}$/;

/** Lower-cased; anything outside a-z, 0-9, dot, underscore and hyphen, or over 80 characters, is dropped. */
export function cleanCampaignValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const lower = value.toLowerCase();
  return VALUE.test(lower) ? lower : undefined;
}

/** Keeps only the four known keys with valid values. Any other shape gives an empty object. */
export function cleanCampaign(input: unknown): Campaign {
  const out: Campaign = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const key of CAMPAIGN_KEYS) {
    const value = cleanCampaignValue((input as Record<string, unknown>)[key]);
    if (value) out[key] = value;
  }
  return out;
}

export function campaignFromSearch(search: string): Campaign {
  try {
    const params = new URLSearchParams(search);
    const raw: Record<string, unknown> = {};
    for (const key of CAMPAIGN_KEYS) {
      // A repeated parameter is ambiguous, so it is ignored rather than guessed at.
      const values = params.getAll(key);
      if (values.length === 1) raw[key] = values[0];
    }
    return cleanCampaign(raw);
  } catch {
    return {};
  }
}

let firstTouch: Campaign | null = null;

/** Called once at startup with the landing URL. A later call cannot replace a campaign already captured. */
export function captureCampaign(search?: string): void {
  if (firstTouch) return;
  const source = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const campaign = campaignFromSearch(source);
  if (Object.keys(campaign).length) firstTouch = campaign;
}

/** The campaign this visit arrived with, or an empty object. */
export function visitCampaign(): Campaign {
  return firstTouch ? { ...firstTouch } : {};
}

export function resetCampaignForTest(): void {
  firstTouch = null;
}
