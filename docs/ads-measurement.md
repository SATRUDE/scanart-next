# Ads measurement

T-0169, November 2026. No new payment, Stripe credentials, advertising spend or paid service is needed to release this instrumentation.

## Status: advertising cookies are off (10 November 2026)

Mark's decision: the shop does not need Meta or Pinterest advertising cookies, so it does not ask about them. One switch controls this: `ADVERTISING_ENABLED` in `config/advertising.ts`, currently `false`.

While it is off:

- the "Advertising cookies" prompt never renders in either language, and the footer has no "Cookie settings" entry;
- no Meta Pixel or Pinterest tag is requested, no advertising cookie or storage is written, and no basket, checkout or purchase event is sent to either provider (there is no Conversions API integration);
- a consent choice saved by an earlier visit is never read. It, the purchase dedupe lists and the first-party advertising cookies are removed on the next visit;
- the privacy pages say there are no advertising cookies.

Everything under "Pinterest" and "Meta" below describes the machinery as it behaves when the switch is on. It is kept, with its tests, so advertising can return.

To turn advertising back on: set `ADVERTISING_ENABLED` to `true`. The prompt, the footer entry and the consent-gated tags all come back together, and the privacy pages switch to their consent wording. Review that wording and the consent version before releasing.

## Same-visit campaign on the order

Ad links carry `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`. `lib/campaign.ts` reads them once from the landing URL (`captureCampaign()` in `instrumentation-client.ts`) and keeps them in memory only: no cookie, localStorage, sessionStorage or IndexedDB, because storing them on the device would need consent. First touch wins within the visit; a reload or a later visit starts empty.

When checkout creates the PaymentIntent, the browser sends the labels (`visitCampaign()` in `components/CheckoutPage.tsx`) and `app/api/create-payment-intent/route.ts` writes the validated ones into the payment metadata. Validation (`cleanCampaign`) lower-cases each value and keeps it only if it is 1 to 80 characters of `a-z`, `0-9`, `.`, `_` or `-`; anything else is dropped and never fails checkout. The webhook's `purchase` event (`lib/server/purchase-measurement.ts`) revalidates the metadata and adds the same four properties, so the private dashboard can count orders per campaign. They are sent nowhere else.

This credits a purchase made in the same visit as the ad click. A purchase in a later visit carries no campaign.

## Confirmed purchase source

`purchase` is sent to the existing PostHog EU project only from a signature-verified Stripe `payment_intent.succeeded` webhook. New shop PaymentIntents carry `measurement_version=1` and the browser's existing analytics eligibility decision. Opted-out browsers, automation, previews, test-mode payments, unfinished payments and historical payments without this marker are excluded. The server reads the received amount and item quantity from the verified payment and server-written order metadata.

The event has an order-derived UUIDv5, an anonymous order entity as `distinct_id`, and the signed success event's timestamp. Properties:

| Property | Meaning |
| --- | --- |
| `orderId` | Stripe PaymentIntent ID, never the client secret |
| `total` | Actual received amount in major currency units, including delivery and after discount |
| `currency` | GBP, NOK, SEK, DKK or USD |
| `itemCount` | Sum of server-recorded item quantities |
| `$host` | `www.scandinavianart.co.uk` |
| `site` | `scanart` |
| `source` | `stripe-webhook` |
| `$process_person_profile` | false |
| `$geoip_disable`, `$ip` | true and null, so the server's location is not attributed to the buyer |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` | The same-visit ad campaign, when there was one; absent otherwise |

There is no invented visitor/session ID, customer identity, address, email, card data or historical backfill. The only campaign information is the same-visit label described above. Order entities must be excluded from visitor/session counts. Report **distinct orderId**, group monetary amounts by currency, and label this as gross completed purchases rather than net revenue: refunds are not instrumented here. This does not produce a session conversion funnel or ROAS attribution.

Delivery runs through Next.js `after`, after the webhook response, with a four-second request timeout and one retry using the identical UUID, name, timestamp and distinct ID. An analytics outage cannot delay the buyer, retry Slack or increment discount redemption again. PostHog deduplication is eventual. Bounded retries are best effort, not a financial ledger; delivery/quota failures are logged without credentials or personal information.

## Pinterest

The existing verified tag ID is unchanged. A real basket addition sends `addtocart` with the added quantity and its current currency/value. The basket's checkout action sends `initiatecheckout`; it never sends a purchase event.

After Stripe's browser SDK reports `succeeded`, the browser can request `/api/purchase-confirmation` using the exact client secret in a POST body, never a URL. The server retrieves the payment and matches the secret with a constant-time comparison. Only a live succeeded shop payment produces a non-personal receipt. Tracking never blocks the confirmation page. Pending status is displayed as pending and cannot empty the basket or count as success.

The resulting Pinterest `checkout` carries the actual total/currency/quantity and stable order/event ID. Consent is checked both before the receipt request and after its response. Up to 100 purchase IDs are stored only after acceptance to suppress repeat sends, and cleared on withdrawal. No events are replayed after a later acceptance. Preview/automation and the existing browser analytics opt-out also suppress these commerce events.

Consent v3 names Meta and Pinterest, including visits, basket activity and confirmed purchase measurement. Valid v1/v2 rejections remain respected. Earlier acceptances require a renewed yes because v2 covered Pinterest only. EN/NO notices describe both providers, the non-personal order fields, cookies and duplicate-prevention storage.

## Meta

The verified website pixel/dataset is **2148270909141839**, owned by Scandinavian Art portfolio **1017077290121627** and shared with its business ad account **697209872563103**. It is separate from the historical Mark OS Megan data source. Mark has full management access.

After renewed advertising acceptance, the production browser loads the Meta SDK and sends one `PageView` on loader initialisation. Client-side route changes do not emit additional Meta pageviews in this release. An actual basket addition sends `AddToCart` with value/currency/quantity. Starting checkout sends `InitiateCheckout`, never `Purchase`. Only the same server-confirmed succeeded receipt described above can send `Purchase`, carrying actual value/currency/item count and the PaymentIntent ID as stable `eventID`. A separate, consented list of at most 100 order references suppresses duplicate Meta purchases without suppressing Pinterest events. No historical replay or conversion is generated on accepting later.

Automatic advanced matching, automatic events, track-events-without-code, AI detailed page/product collection and on-device measurement were all verified **off** in this pixel's Events Manager settings on 8 November. The last two were on by default and were turned off. The browser also queues `set autoConfig false` and `set smartSetup false` for the verified pixel **before init**; Meta's first-party SDK maps these to opt-outs of AutomaticSetup and SmartSetup. AutomaticMatching and AutomaticMatchingForPartnerIntegrations are also explicitly opted out before init. Executing the real public pixel-specific config with the first-party SDK confirms these and InferredEvents/PageMetadata/AutomaticParameters/Microdata opt-ins all remain false; the partner-matching flag would otherwise be independently true despite the disabled inferred-events prerequisite. No advanced-matching/user-data object, form fields or customer identity is passed. No Meta Conversions API credential or server integration is configured. Preview, bots and the existing browser analytics opt-out suppress the Meta loader and commerce events.

Withdrawing advertising permission stops loaded tags by reloading and clears accessible Meta/Pinterest first-party cookies and both dedupe lists. Provider-domain cookies remain controlled by the providers. A browser/extension can block an accepted tag; no receipt in Events Manager is claimed until it is genuinely observed. QA intercepts every advertising request and creates no payment or synthetic live purchase.

## External account work still required

- Meta: existing business-owned GBP account is correctly billed to Diffey AS, Norway, with Oslo time zone. The old card is expired; Mark has received his Folio card and will enter it after noncard setup. No card is charged, campaign launched or currency/account replaced. No Conversions API token is configured; browser purchase measurement uses the existing server-verified receipt.
- Google: no verified Ads conversion ID and label. Correct account onboarding is still blocked by the account UI's ad-blocker notice; billing/conversion setup is unverified. No placeholder Google tag is installed.
- Pinterest: site instrumentation can be released, but Ads billing remains unverified because the advertiser app did not render. Platform-side receipt of real future conversions still needs an account check.

No extra purchase is made to populate these systems. Coverage begins after this release for new eligible orders; do not claim the earlier refunded internal test was ingested.

## References

- [Pinterest events](https://help.pinterest.com/en/business/article/add-event-codes): Checkout is a completed transaction; InitiateCheckout is the start.
- [PostHog capture API](https://posthog.com/docs/api/capture) and [deduplication](https://posthog.com/docs/data/events): anonymous capture and identical retry identity.
- [Stripe PaymentIntent retrieval](https://docs.stripe.com/api/payment_intents/retrieve).
- [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after): post-response analytics execution.

- [Meta Pixel reference](https://developers.facebook.com/docs/meta-pixel/reference/) and [advanced configuration](https://developers.facebook.com/docs/meta-pixel/advanced/). Meta returned HTTP 429 to unauthenticated documentation fetches during this review; automatic-setup semantics were additionally inspected in the actual [first-party browser SDK](https://connect.facebook.net/en_US/fbevents.js), version 2.9.438, and account controls verified in the signed-in UI.
