# Christina Hägerfors preview

Prepared on 29 September 2026 by Peggy. Branch: `peggy/christina-hagerfors-preview`, from `origin/main` at `475bb98`. All four prints are unpublished, out of stock and marked for preview only. Nothing is merged to main.

Artist path: `/artist/christina-hagerfors` and `/no/artist/christina-hagerfors`.

| File | Working title | Product path |
| --- | --- | --- |
| `big_whale_50x70.pdf` | Big Whale | `/product/big-whale` |
| `funny_mermaid_50x70.pdf` | Funny Mermaid | `/product/funny-mermaid` |
| `mushroom_picking_50x70.pdf` | Mushroom Picking | `/product/mushroom-picking` |
| `polar_bear_castle_50x70.pdf` | Polar Bear Castle | `/product/polar-bear-castle` |

Every product page also exists under `/no/product/<slug>`.

## Sources

Nothing about her is invented. The sources are:

- **Gallery inbox**, thread "Re: Information on joining Scandinavian Art", read-only, 22 August to 29 September. Her emails give her choice of works and her file handling, but no titles, descriptions, prices, bio or photo. On 11 September she offered the whale, the mermaid ("has a nice idea behind it, but it could be updated and refined"), the polar bears ("a personal favourite of mine") and a recent mushroom illustration. The duck and boat, oyster and seagull were also agreed that week. The sardine postcard is an exclusive. On 29 September she sent these four and said two more will follow after changes.
- **Her Illustratörcentrum profile** (https://illustratorcentrum.se/kreator/christina_hagerfors/, read on 29 September), written by her in Swedish. The bio paraphrases it closely in English and Norwegian: working as an illustrator since her BA (Hons) at London College of Communication, inspired by colour, old prints and book covers, hoping her pictures carry a kind of nostalgia. The clients named are from the same profile's client list. The product-page statement ("She hopes her pictures carry a kind of nostalgia.") comes from her sentence "Hoppas att mina bilder har en sorts nostalgi över sig".
- **Her application of 30 August** (Social Agent `ArtistApplication`): she lives in "Cerons, France", as she spelled it.
- **East End Prints** (https://eastendprints.co.uk/categories/artists/artists-a-f/christina-hagerfors.html): "Originally from Sweden". The bio now reads "originally from Sweden and now based in France".
- **Social Agent store**, SELECT only. She has a signed agreement (7 September), an application, an outreach record and a scouting record, but no Product rows. This is her first catalogue entry anywhere.

## Placeholders on the preview

- **Titles** are working titles taken from her own file names. Two differ from what she called the works on 11 September: `fishingmermaid.jpg` and `bearwintercastle_small.jpg`.
- **Descriptions** are marked placeholders in both languages ("Placeholder description, to be written with Christina", and "Plassholder for beskrivelsen" in Norwegian). They are also the meta descriptions until they are replaced. The preview is noindex.
- **Portrait**: none, so the page shows her initials.
- **"About the work" editorial**: left out, so the section does not render.
- **Location: Stockholm, Sweden is a stand-in** (Mark, 29 September). No source names her Swedish home town, so Mark asked for Stockholm for now. The map pin, the "Based in" row, the location line and the map caption all come from the one `location` field (`cityOf(location)`), so the label matches the pin. The map caption reads "Stockholm, where Christina works", which is not true: she lives in France. Correct it once she replies. Stockholm is an existing map city, so no coordinates were added. The data and Norwegian copy carry a placeholder comment.
- **Room scenes**: none. Pages show the plain framed product shot, the way the catalogue renders any print without a scene.

## Questions for Christina

1. Final titles for the four works. Her Illustratörcentrum profile titles the polar bear piece "Isbjörnarnas vinterslott" ("The polar bears' winter castle"), which is likely the real title; it is not renamed yet. Should the mermaid be "Funny Mermaid" or "Fishing Mermaid"?
2. A few lines about each print, in her words, for the product pages.
3. Is the bio, drawn from her Illustratörcentrum profile, accurate and how she wants to be introduced? Where in Sweden is she from? The map shows Stockholm until she says. May we name those clients?
4. A portrait photo she approves, with the photographer's name if it needs a credit.
5. Colour: she wrote that the files are sRGB, but all four PDFs hold CMYK images. Big Whale and Funny Mermaid are tagged U.S. Web Coated (SWOP) v2. Mushroom Picking and Polar Bear Castle are untagged CMYK. The printer asks for sRGB, or GRACoL 2006 when exporting CMYK. Could she re-export in sRGB?
6. The two remaining posters: which works (the duck and boat, oyster or seagull?), and when. East End Prints already sells a Seagull by her.

## East End Prints

Checked on 29 September. None of the four preview works is sold there. The search, the artist page and the direct product URLs for the four slugs (404) all agree. The artist category page lists Apero and Sausage Dog. A site search for her name finds 11 more of her prints: Cat and Mouse, Dog and Butterfly, Ice Cream, Kitten, Pyramid of Cats, Rainy Walk, Sausage, Seagull, Sommelier, Three Tigers and Wine And Cheese. Seagull matters if it is one of her two remaining posters.

## Print files, sizes and prices

Each PDF is one page, 1440 x 2006.88 pt (50.8 x 70.8 cm), holding a single 6000 x 8362 px image at 300 ppi. That is exactly 50 x 70 cm plus the 4 mm bleed on every side. With the bleed removed the ratio is 0.714, which is 5:7. Every box (Media, Crop, Bleed, Trim) is the full page, so the manifest's `bleedMm: 4` tells the importer to trim 4 mm per side for the product shot. Big Whale runs to the edge. The other three have a cream margin drawn into the artwork itself. The masters stay outside Git in `~/Desktop/ScanArt Image Tests/Christina Hägerfors/`. Only web derivatives are committed.

**Size offered: 50 × 70 cm only.** It is the only offered format with her 5:7 proportions, and her files are prepared for it. A2 and A1 are 1:√2, so selling either would mean a crop or a new file from her. A different size can be added later if she supplies a file for it.

**Price: the Budget list**, as Mark chose on 29 September, the band Mikko's prints use. The existing effective values are unchanged. Unframed 50 × 70 cm is GBP 45, USD 58, NOK 700, DKK 395, SEK 617. The frame add-on is per size, not per band: +GBP 39, USD 59, NOK 600, DKK 445, SEK 560. That makes framed GBP 84, USD 117, NOK 1300, DKK 840, SEK 1177. No price configuration changed. The standard split is unchanged: 60% to the artist and 40% to the gallery, after printing and delivery costs. One note: the Entry list (Hedvig, GBP 35 / NOK 500) is cheaper than Budget, and SEK 617 is the one unrounded Budget figure.

## Room scenes: pilot prepared, not generated

New images may come only from Mark's ChatGPT subscription. This session had no working ChatGPT route: the `codex` on the PATH is a Superset stub with no binary behind it. So nothing was generated, and no other generator was used.

Following `platform/skills/generate-image` (SKILL.md and all five references), the three-scene pilot is ready to run:

- Mushroom Picking in a kitchen after foraging. This is the dense, dark fidelity case.
- Big Whale in a child's bedroom, with a side-on bed as the scale anchor.
- Polar Bear Castle in a winter reading corner.

Each prompt covers the scale line, viewpoint, catalogue floor and wall colour, glass, frame and wall lighting, and an artwork description. The references are active Social Agent catalogue items, with IDs and source hashes, chosen to avoid Markus's and Mikko's furniture sets.

- Prompts and review checklist: `scripts/artists/christina-room-pilots.json`.
- Pack: `~/Desktop/ScanArt Image Tests/Experiment files/christina-pilot-2026-09-29/`. It holds the artwork exports with the bleed removed, the catalogue references and labelled floor and wall boards.

No full set is to be made until Mark has judged the pilot.

## Adding her two remaining posters

1. Put the PDFs beside the others.
2. Append two entries to `prints` in `scripts/artists/christina-hagerfors.json`: the next `productId` (57, 58), a fresh `id`, and the same size and price fields.
3. Run `npm run add-artist -- scripts/artists/christina-hagerfors.json`. Existing slugs are skipped.
4. Run `python3 scripts/v2/warm_backdrops.py <new slugs>`.

`lib/christina-preview.test.ts` reads the manifest, so it covers the new prints with no edit. The importer gained three small options for this preview:

- `"review": true` adds prints as `published: false`, `review: true`, `inStock: false`.
- `bleedMm` trims a bleed that has no TrimBox.
- A fixed `productId`, with a clash check.

## Preview gate

This branch carries the display-only reader from Markus's branch, `8976cdd`, as identical hunks. `lib/server/catalogue-review.ts` enables review prints only when `VERCEL_ENV=preview`, or in local development with `CATALOGUE_PREVIEW=1`.

- Display routes read `getShopProducts`. Checkout, the sitemap and the product feed keep `getAllProducts`.
- Drafts show "Coming soon" / "Kommer snart" and cannot enter the basket, even on a preview. `computeOrderAmount` rejects their IDs.
- Preview metadata is noindex.
- On preview deployments she appears in the site-wide artist lists, as Markus does.

If both branches merge, two things need attention:

- Markus's `lib/catalogue-review.test.ts` asserts that every draft is artist 9, so it would need widening.
- The IDs do not collide: artist 10, products 53 to 56.

## Before publication (not now)

- Replace the Stockholm stand-in with her real town (and a map point if it is not an existing city).
- `lib/nordic-art.ts` says all the gallery's artists "live and work in the Nordics". That stops being true once someone based in France is published.
- Replace the placeholders.
- Get approved room scenes. `lib/feed-images.test.ts` needs one per published print.
- Settle the colour question and the print proofs.
- Reconcile Social Agent's Product table if it is still used operationally.
- Her signed agreement PDF never archived: the Agreement row records a Vercel Blob private-access failure, which is already ticketed.
- Low priority, shared by the whole catalogue: the importer fits 5:7 artwork into the Figma frame's 775 × 1106 opening, a stretch of about 2%.

## Validation

- `npm run lint -- --max-warnings 0`: clean.
- `npm run typecheck`: clean.
- `npm test -- --project unit`: 58 files, 546 tests passed, including the four new preview tests.
- `VERCEL_ENV=preview npm run build`: succeeded.
- Locally, with the preview build served: the artist page and all four product pages returned 200 in English and Norwegian. All were noindex, showed Coming soon and the placeholders, and priced from £56. There was no horizontal overflow at 1440 px or 390 px, and no page errors.

## Deployed preview check

The branch alias for commit `b5a67de` is `https://y-git-peggy-christina-hagerfors-preview-mark-diffeys-projects.vercel.app` (Vercel project `y`, deployment `dpl_9ybzTURk9ZcMJQpGviayM52b2Ww6`, READY). I checked it on 29 September through a Vercel share link, which expires after 23 hours; the token is not recorded here.

- The artist page and all four product pages returned 200 in English and Norwegian.
- All ten carry noindex, show Coming soon / Kommer snart and the marked placeholders, are priced from £56, and have no add-to-basket button.
- The product images and warm images load.
- Neither `/sitemap.xml` nor `/product-feed.xml` mentions her.

## Follow-up check, commit `1450936`

Deployment `dpl_4yTmAw29CGnkMWC32TQoiBRtYU1P`, READY, checked in a browser through a new share link.

- **At a glance** (EN and NO): "Based in: Stockholm, Sweden" / "Bosted: Stockholm, Sverige", with the map rendered to the right and her pin at Stockholm. The caption reads "Stockholm, where Christina works." / "Stockholm, der Christina arbeider."
- **Prices** on all four product pages, unframed and with a wood frame: GBP £45 / £84, USD $58 / $117, NOK 700 / 1300 kr, DKK 395 / 840 kr, SEK 617 / 1177 kr. The button still reads Coming soon.
