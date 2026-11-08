# Ads measurement

T-0169, November 2026. No new payment, Stripe credentials, advertising spend or paid service is needed to release this instrumentation.

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

There is no invented visitor/session ID, customer identity, address, email, card data, campaign join or historical backfill. Order entities must be excluded from visitor/session counts. Report **distinct orderId**, group monetary amounts by currency, and label this as gross completed purchases rather than net revenue: refunds are not instrumented here. This does not produce a session conversion funnel or ROAS attribution.

Delivery runs through Next.js `after`, after the webhook response, with a four-second request timeout and one retry using the identical UUID, name, timestamp and distinct ID. An analytics outage cannot delay the buyer, retry Slack or increment discount redemption again. PostHog deduplication is eventual. Bounded retries are best effort, not a financial ledger; delivery/quota failures are logged without credentials or personal information.

## Pinterest

The existing verified tag ID is unchanged. A real basket addition sends `addtocart` with the added quantity and its current currency/value. The basket's checkout action sends `initiatecheckout`; it never sends a purchase event.

After Stripe's browser SDK reports `succeeded`, the browser can request `/api/purchase-confirmation` using the exact client secret in a POST body, never a URL. The server retrieves the payment and matches the secret with a constant-time comparison. Only a live succeeded shop payment produces a non-personal receipt. Tracking never blocks the confirmation page. Pending status is displayed as pending and cannot empty the basket or count as success.

The resulting Pinterest `checkout` carries the actual total/currency/quantity and stable order/event ID. Consent is checked both before the receipt request and after its response. Up to 100 purchase IDs are stored only after acceptance to suppress repeat sends, and cleared on withdrawal. No events are replayed after a later acceptance. Preview/automation and the existing browser analytics opt-out also suppress these commerce events.

The previous privacy notice explicitly excluded order details, so its acceptance does not silently enable the new data. Consent v2 asks for visits, basket activity and purchase measurement. Valid v1 rejections remain respected; v1 acceptances require a new yes. EN/NO notices describe the non-personal order fields and duplicate-prevention storage.

## External account work still required

- Meta: no verified pixel/dataset ID or Conversions API credentials. The portfolio's Norway/NOK ad-account setup is blocked by Meta's existing-account state review. No guessed pixel or server destination is installed.
- Google: no verified Ads conversion ID and label. Correct account onboarding is still blocked by the account UI's ad-blocker notice; billing/conversion setup is unverified. No placeholder Google tag is installed.
- Pinterest: site instrumentation can be released, but Ads billing remains unverified because the advertiser app did not render. Platform-side receipt of real future conversions still needs an account check.

No extra purchase is made to populate these systems. Coverage begins after this release for new eligible orders; do not claim the earlier refunded internal test was ingested.

## References

- [Pinterest events](https://help.pinterest.com/en/business/article/add-event-codes): Checkout is a completed transaction; InitiateCheckout is the start.
- [PostHog capture API](https://posthog.com/docs/api/capture) and [deduplication](https://posthog.com/docs/data/events): anonymous capture and identical retry identity.
- [Stripe PaymentIntent retrieval](https://docs.stripe.com/api/payment_intents/retrieve).
- [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after): post-response analytics execution.
