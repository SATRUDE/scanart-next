# Scandinavian Art V2: launch list

The remaining steps before V2 goes live, and the follow-ups it leaves. The SEO gate itself is in `docs/v2-seo.md`.

## For Mark
- [x] Ishtar Bäcklund Dakhil and her seven prints, Surfer with Orange Sun included, go live (2026-09-29, Mark's go-ahead; master for the surfer is her `surf1.jpg`). Still open: whether Stockholm is right for her map pin, since the shop data only says Sweden.
- [x] Stripe test keys on the V2 preview (branch-scoped), test-card orders end to end: payment, Slack notice, /order-confirmed (2026-09-26).
- [ ] A last review round on the preview.

## Launch day (done 2026-09-26: PR #222 merged as 8a27de4, production smoke-tested, sitemap resubmitted)
- [x] Apply the full V2 body of `scandinavian-illustrators` from `docs/journal-v2-proposals/scandinavian-illustrators.md`. The interim fix went live on 2026-09-26 (Hedvig Wallin added; the "all by one artist" line gone). The full version adds Mikko and Ishtar, whose pages only exist once V2 is live. Leave Ishtar out while she is held back (see above), and her Surfer print while it is off the site.
- [x] Bump the sitemap dates for the re-templated pages:
  - `CATALOGUE_REVISED`, `HOME_REVISED`;
  - the English page dates in `app/sitemap.ts`;
  - `NO_TRANSLATED`, `NO_TRANSLATED_SHOP`, `APPLY_PUBLISHED`.
- [x] Merge `mark/scandinavian-art-v2` into main; Vercel deploys production.
- [x] Smoke test production:
  - home, a product, basket, checkout;
  - both 404s (English and /no);
  - /no.
- [x] Resubmit the sitemap in Search Console.
- [ ] Watch `/api/search` (web and image) and `/api/index-status` weekly for four weeks.
