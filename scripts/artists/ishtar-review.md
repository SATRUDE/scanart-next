# Ishtar Bäcklund Dakhil: review collection

Prepared 24 September 2026. Review only. Do not merge or publish until Mark has reviewed.

The supplied download contains two standalone masters and twelve additional works in a ten-page PDF. The last PDF page contains three separate surfer illustrations. All fourteen have individual draft records, original-aspect framed previews, unframed previews and English/Norwegian descriptions. Stockholm and Frukt & Grönt also have room mockups.

## Review routes

- `/catalogue-preview`
- `/catalogue-preview/artist/ishtar-backlund-dakhil`
- `/catalogue-preview/product/stockholm`
- Add `?lang=no` for Norwegian copy.

These routes run only on Vercel Preview or with `CATALOGUE_PREVIEW=1` in local development. Production returns 404. The review records are unpublished, out of stock and have no price category or confirmed sizes. Normal product/artist pages, sitemap, Google feed and checkout exclude them. The JSON and image assets are part of the deployment, so this is a publication gate, not a confidential asset vault.

## Decisions before launch

1. Confirm which of the fourteen works to sell. Twelve PDF works have clearly marked descriptive working titles, not artist-supplied titles.
2. Confirm selling sizes and prices. A2 is proposed for Stockholm and Frukt & Grönt from their 4961 × 7016 px, 300 dpi files. The other works retain their original proportions and have no proposed selling size.
3. Obtain larger individual masters for the three surfer panels. Current extractions are approximately 1164 × 1646 px and are for review only.
4. Confirm the intended print editions for PDF pages 3 and 4, which include Hilma & The Sacred Quartet album labels. Labels remain unchanged.
5. Review the portrait choice. It is from Ishtar’s official Contact page, credited to Sebastian Lundmark. Her current city is not confirmed; the profile says Sweden.
6. Review the two generated room mockups. Framed and unframed artwork previews use the supplied files directly. Room mockups are generated compositions and are not print masters.
7. Once approved, prepare fulfilment and price records and mirror approved catalogue facts into the Social Agent store before publication. Nothing has been activated there by this change.

## Assets and reproducibility

`ishtar-review.json` records the copy, source dimensions and hashes, draft records and pending decisions. It is a review manifest, not input for `add-artist.mjs`, whose defaults would assign a price and publish products.

`node scripts/prepare-ishtar-assets.mjs <WeTransfer folder> <private launch pack>` creates source previews, framed images and the portrait. Extract the embedded PDF images first with `pdfimages -png -j`. Private originals, room-generation prompts and room references are retained in `~/Desktop/Ishtar launch/`; print masters are not checked into the public repository.

Artist ID 8 and product IDs 29–42 avoid the Mikko launch reservation (artist 7, products 25–28).
