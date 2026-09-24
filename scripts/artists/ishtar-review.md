# Ishtar Bäcklund Dakhil: review collection

Prepared 24 September 2026. Review only. Do not merge or publish until Mark has reviewed.

The supplied download contains two standalone masters and twelve additional works in a ten-page PDF. The last PDF page contains three separate surfer illustrations. All fourteen have individual draft records, framed previews fitted to the proposed paper, unframed previews and English/Norwegian descriptions. All fourteen have room mockups in preparation for the full shop preview.

## Full shop preview

In a preview deployment, use `/artist/ishtar-backlund-dakhil` or `/product/stockholm` (and their `/no` equivalents). The normal artist, product and category navigation includes the review collection, with proposed prices and size/frame controls. A banner on every preview page links to Ishtar and to Mikko’s separate PR211 preview. Draft Add to Cart actions are disabled, the cart refuses draft rows, and server order lookup remains published-only.

## Original review routes

- `/catalogue-preview`
- `/catalogue-preview/artist/ishtar-backlund-dakhil`
- `/catalogue-preview/product/stockholm`
- Add `?lang=no` for Norwegian copy.

These routes run only on Vercel Preview or with `CATALOGUE_PREVIEW=1` in local development. Production returns 404. The review records remain unpublished and out of stock, with proposed sizes and the existing Premium price category. The full shop display includes drafts only in the allowed preview environment. Production pages, sitemap, Google feed and checkout still exclude them. The JSON and image assets are part of the deployment, so this is a publication gate, not a confidential asset vault.

## Decisions before launch

1. Confirm which of the fourteen works to sell. Twelve PDF works have clearly marked descriptive working titles, not artist-supplied titles.
2. Confirm selling sizes and prices. See [ishtar-prices.md](ishtar-prices.md) for all proposed formats, unframed/framed prices and source resolution. A2 is proposed for the two standalone masters; PDF works use square 50 × 50 cm, portrait/landscape 50 × 70 cm or A3, with white borders where needed to preserve the complete artwork.
3. Obtain larger individual masters for the three surfer panels. Current extractions are approximately 1164 × 1646 px and are for review only.
4. Confirm the intended print editions for PDF pages 3 and 4, which include Hilma & The Sacred Quartet album labels. Labels remain unchanged.
5. Review the portrait choice. It is from Ishtar’s official Contact page, credited to Sebastian Lundmark. Her current city is not confirmed; the profile says Sweden.
6. Review all fourteen generated room mockups. Framed and unframed artwork previews use the supplied files directly. Room mockups are generated compositions and are not print masters.
7. Once approved, prepare fulfilment and price records and mirror approved catalogue facts into the Social Agent store before publication. Nothing has been activated there by this change.

## Assets and reproducibility

`ishtar-review.json` records the copy, source dimensions and hashes, draft records and pending decisions. It is a review manifest, not input for `add-artist.mjs`, whose defaults would assign a price and publish products.

`node scripts/prepare-ishtar-assets.mjs <WeTransfer folder> <private launch pack>` uses `ishtar-formats.json` to create source previews, paper-format framed images and the portrait. Extract the embedded PDF images first with `pdfimages -png -j`. Private originals, room-generation prompts and room references are retained in `~/Desktop/Ishtar launch/`; print masters are not checked into the public repository.

Artist ID 8 and product IDs 29–42 avoid the Mikko launch reservation (artist 7, products 25–28).

## Activation after approval

Keep this PR in draft until review is complete. Activate only the agreed selection after titles, masters, formats and prices are confirmed. Set those records to published/in stock, remove their review marker, validate print proofs and fulfilment files, mirror the approved records into the Social Agent catalogue, then rerun the normal feed/sitemap/checkout checks. Do not activate the three surfers using the current PDF extracts.

The manifest includes proposed room/subject collection placements for the later activation pass. Curated landing-page prose should be reviewed with those placements rather than silently expanding claims about the existing selection.
