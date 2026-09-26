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
- [x] Stripe test keys on the V2 preview (branch-scoped), test-card orders end to end: payment, Slack notice, /order-confirmed (2026-09-26).
- [ ] A last review round on the preview.

## Launch day
- [ ] Apply the full V2 body of `scandinavian-illustrators` from `docs/journal-v2-proposals/scandinavian-illustrators.md`. The interim fix went live on 2026-09-26 (Hedvig Wallin added; the "all by one artist" line gone). The full version adds Mikko and Ishtar, whose pages only exist once V2 is live. Leave out Ishtar's Surfer print while it is off the site.
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
