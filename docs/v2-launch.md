# Scandinavian Art V2: launch list

The remaining steps before V2 goes live, and the follow-ups it leaves. The SEO gate itself is in `docs/v2-seo.md`.

## Ishtar is held back
Ishtar Bäcklund Dakhil launches later: her agreement isn't fully signed (2026-09-26). Branch `ishtar/preview` has the full site with her; restore from there once it is signed.

What was removed on `mark/scandinavian-art-v2`:
- **Her seven prints**, unpublished in `public/notion-data/products.json`: Stockholm, Frukt & Grönt, Desert Circles, Lilac Geometry, Bird Above the Valley, Creature Among Blue Leaves, Surfer with Orange Sun. That also takes down her artist page and drops her from the artist lists, search and the sitemap.
- **Her clauses in the landing copy**, English and Norwegian (`lib/categories.ts`, `lib/collections.ts`, `lib/wall-art.ts`, `lib/nordic-art.ts`, `lib/i18n/no.ts`): the abstract, botanical and illustrations intros, the abstract size FAQ, the birds-and-animals intro, FAQ and meta description, the kitchen intro and FAQ, the wall-art and nordic-art artist sentences.
- **Her prints in the collection picks** (birds and animals, living room, bedroom, home office, kitchen) and her room scenes in `lib/shop-scenes.ts`.
- **The count** in `lib/product-listing-details.test.ts`: 24 (30 on `ishtar/preview`).

Left in place, because nothing renders them without her prints: her entry in `data/artists.ts`, her editorial, statement, homepage line and Norwegian bio and print descriptions.

The /nordic-art artist list now only names artists with a published print, so it follows the catalogue by itself.

## For Mark
- [ ] **Email Ishtar about Surfer with Orange Sun.** The print is off the site (unpublished in `public/notion-data/products.json`, 2026-09-26) until we have:
  - its master file;
  - the title as she wants it;
  - prices;
  - confirmation that A2 and A3 can be fulfilled.

  Ask too whether Stockholm is right for her map pin: the shop data only says Sweden.

  To bring it back (once Ishtar herself is restored from `ishtar/preview`, see above):
  1. Set `published: true`.
  2. Restore its line in `lib/shop-scenes.ts`.
  3. Put the sentence back in her editorial in `lib/artist-editorial.ts` and `lib/i18n/no.ts`.
  4. Set the count in `lib/product-listing-details.test.ts` to 31.
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
