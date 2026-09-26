# Scandinavian Art V2: launch list

The remaining steps before V2 goes live, and the follow-ups it leaves. The SEO gate itself is in `docs/v2-seo.md`.

## For Mark
- [ ] **Email Ishtar about Surfer with Orange Sun.** The print is off the site (unpublished in `public/notion-data/products.json`, 2026-09-26) until we have:
  - its master file;
  - the title as she wants it;
  - prices;
  - confirmation that A2 and A3 can be fulfilled.

  Ask too whether Stockholm is right for her map pin: the shop data only says Sweden.

  To bring it back:
  1. Set `published: true`.
  2. Restore its line in `lib/shop-scenes.ts`.
  3. Put the sentence back in her editorial in `lib/artist-editorial.ts` and `lib/i18n/no.ts`.
  4. Set the count in `lib/product-listing-details.test.ts` to 31.
- [ ] Add the Stripe keys to the V2 preview, then run a test-card order end to end (receipt, Slack notice, /order-confirmed).
- [ ] A last review round on the preview.

## Launch day
- [ ] Bump the sitemap dates for the re-templated pages:
  - `CATALOGUE_REVISED`, `HOME_REVISED`;
  - the English page dates in `app/sitemap.ts`;
  - `NO_TRANSLATED`, `NO_TRANSLATED_SHOP`, `APPLY_PUBLISHED`.
- [ ] Merge `mark/scandinavian-art-v2` into main; Vercel deploys production.
- [ ] Smoke test production:
  - home, a product, basket, checkout;
  - both 404s (English and /no);
  - /no.
- [ ] Resubmit the sitemap in Search Console.
- [ ] Watch `/api/search` (web and image) and `/api/index-status` weekly for four weeks.
