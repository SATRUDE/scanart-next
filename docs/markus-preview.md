# Markus Naarttijärvi preview

Prepared on 28 September 2026. Branch: `codex/markus-naarttijarvi-preview`. All ten products remain unpublished, out of stock and marked for display-only review. Nothing is merged to main.

## Copy and commercial decisions

The two-sentence bio is grounded in [Markus's own About page](https://www.naarttijarvi.com/about), checked on 28 September 2026. His agreement was signed on that date, as supplied by Mark. No approved portrait was supplied, so the page uses initials.

Umeå now renders on the artist map in both languages. Its SVG position, `[487.2, 468.8]`, uses the brand map's documented equirectangular projection: `x = (lon - 3.5) * cos(62°) * scale`, `y = (71.4 - lat) * scale`. A least-squares scale of 61.9225 reproduces the five existing city markers within 0.2 px; Umeå uses 63.83° N, 20.26° E. Desktop screenshots confirm the marker near Sweden's coast across from Kvarken.

The reported missing framing row is not a Markus data gap: both routes already derive it from the shared `config/frame.ts` options. Rendered English and Norwegian pages show four rows, including “Framing — Unframed, or wood, black or white” and “Innramming — Uten ramme, eller tre, svart og hvit”. No artist-specific frame override is needed.

Ken's supplied titles and descriptions are retained verbatim in the manifest and product JSON. They need Mark and Markus's confirmation. In particular, the photograph for The Road at Sunset appears to show more than three cyclists; the supplied description says three. Confirm the moonlight claim in Pines Under Starlight and the cabin description against Markus's account too.

Proposed paper format is 50x70cm, rotated to 70x50cm for photos 6 to 9. The originals are fitted whole with white margins, never stretched or cropped. Confirm those margins and print proofs before fulfilment. This uses Ishtar's existing Premium price band, not Mikko's Budget band: unframed GBP 56, NOK 800, USD 72, DKK 500, SEK 800. Existing wood/black/white framing adds GBP 39, NOK 600, USD 59, DKK 445, SEK 560. No price configuration is changed. The standard split remains artist 60%, gallery 40% after printing and delivery costs.

| File number | Placeholder title | Product path |
| --- | --- | --- |
| 1 | Through the Willows | `/product/through-the-willows` |
| 2 | Pines Under Starlight | `/product/pines-under-starlight` |
| 3 | Winter Yard, Night | `/product/winter-yard-night` |
| 4 | Current and Foam | `/product/current-and-foam` |
| 5 | The Road at Sunset | `/product/the-road-at-sunset` |
| 6 | Sun Over the Forest | `/product/sun-over-the-forest` |
| 7 | Swan on Still Water | `/product/swan-on-still-water` |
| 8 | Morning, Cabin Room | `/product/morning-cabin-room` |
| 9 | Path Through the Trees | `/product/path-through-the-trees` |
| 10 | Sheep on the Track | `/product/sheep-on-the-track` |

Artist path: `/artist/markus-naarttijarvi`. The Norwegian routes work through the same preview reader; the supplied English descriptions remain the fallback pending approved translations.

## Images and source records

Mark rejected the first ten room scenes for repetition and insufficient styling. They remain in this preview pending review of replacement pilots; they are not approved images. The three new pilots (Through the Willows, Winter Yard Night and Swan on Still Water) stay outside the repository in `~/Desktop/ScanArt Image Tests/`, with prompts, active catalogue records, references, measurements and self-review under `Experiment files/markus-pilot-2026-09-28/`. Earlier pilots were kept outside the page for review. Mark subsequently asked for the new furniture pilots on the test link; the current selection is documented below.

Print masters remain in `~/Desktop/Markus-Naarttijarvi-photos/Print exports/`. Only web derivatives are committed. The studio shots preserve the actual photographs; generated rooms are display mockups and require visual approval, not print proofs.

Ten new rooms were generated with the built-in ChatGPT tool. The tool does not expose a verified model identifier. No separately billed image API or Social Agent generator was used. `scripts/artists/markus-room-scenes.json` records the exact prompts and source paths. Native renders are also saved under `~/Desktop/ScanArt Image Tests/Markus-<slug>-room-2026-09-28.png`.

The floor reference is active Social Agent Oak wood flooring `c3d7387d-0981-4e8f-8ab0-68d85e4030f3`, checked on 28 September. Furniture references are the 235cm Bergsdal sofa, 120cm Oblique bench and 63cm Chisel chair. Scene 1 was revised to remove an extra table and empty bowl; scene 7 was revised to reduce the frame size. The generated photographs retain the recognisable source compositions, with minor generative detail, border and furnishing differences to assess before publication. No artwork was composited into a finished room. The exports carry IPTC AI-source metadata; the original photographs are not marked as generated. Most renders are 1122x1402; Morning, Cabin Room is 1080x1457 and retains its native aspect ratio.

Social Agent's shared Product table was not changed: this revision's build syncs Article rows only and reads products from the committed JSON. It must be reconciled deliberately at publication if it is still used operationally. No fulfilment upload or live sale activation is part of this preview.

## Product-page statement, 28 September follow-up

The empty space Mark reported on the product page was a separate gap from the artist-page map and framing rows above. Markus had no entry in the shared artist statement map, leaving only the narrow biography column. Added an editorial summary, grounded in his own About page and presented without quotation marks, to the English map and Norwegian translation:

- English: “Long-term photographs of northern Sweden, exploring solitude, perseverance and the passage of time.”
- Norwegian: “Langsiktige fotoprosjekter fra Nord-Sverige utforsker ensomhet, utholdenhet og tidens gang.”

All ten product pages inherit this through the shared artist slug. No layout or commercial data changed. Checked locally with `CATALOGUE_PREVIEW=1`: English and Norwegian desktop at 1440 px, Norwegian mobile at 390 px, all HTTP 200 with the statement visible, no horizontal overflow and no browser errors. Typecheck passed and all 16 existing Norwegian translation tests passed. Screenshots and browser evidence are retained in the Desktop image-test experiment folder. This remains preview copy for review, not a production launch.

## Fresh furniture pilot selection, 28 September

At Mark's request, three revised scenes now appear on the test link for in-place review: Through the Willows (fresh-products test 02), Winter Yard, Night (test 03, including the wall-light correction), and Swan on Still Water (test 02). The other seven scenes are unchanged and still await replacement after the pilot direction is settled. This is permission to show the pilots in the preview, not approval to publish them or launch the artist.

The six new Nordic Nest catalogue references are the Audo Copenhagen Brasilia chair; &Tradition In Between SK3 table, SK1 chair and Caret MF1 lamp; and Muuto Enfold low sideboard and Ridge vase. Peggy added and verified all six in Social Agent, including exact source-image hashes. The scenes use those with selected existing catalogue accessories and floors, rather than reproducing Ishtar's furniture arrangements. Exact prompts, reference order, catalogue records, source hashes and chosen outputs are in `scripts/artists/markus-fresh-room-pilots.json`. The original first-round provenance remains in `markus-room-scenes.json`.

Winter's wall now visibly receives the left-window light, following Mark's feedback that the glass reflection looked separately lit. The new scenes are naturally generated artwork-in-room images, not artwork composites. They remain interpretative mockups for visual review: small details and proportions can differ from the real photographs. No generated scene is a print master. Original source artwork and studio images are unchanged.

Exports retain native 1122 x 1402 dimensions, AVIF quality 70 and WebP quality 88, with trained-algorithmic-media source metadata. New filenames avoid stale cached scenes. Catalogue secondary images, curated scene entries, descriptive scene alt text and manually inspected crop focus all point to this selection. Typecheck and all 47 existing tests across scene focus, shop scenes, image alt text, review gating and Norwegian translations pass. All ten prints remain unpublished, out of stock and review-only.


## Photography category preview, 28 September 2026

Added `/category/photography` and `/no/category/photography` using the existing category layout. The Norwegian labels use Fotografi and the page heading is Fotokunst. All ten review prints are available on these preview category pages. Product links, footer and Explore links follow the same visible catalogue; production hides the empty category while Markus remains unpublished.

Norwegian category queries (fotografi, fotokunst) match in the shared grid/overlay matching logic. The actual search index remains published-only, including on preview; this change does not expose draft prints through global search. Artist importer accepts Photography for future manifests.

Validation: 36 focused tests, changed-file ESLint, TypeScript and a production-mode Next build passed. Browser checks at 1440px and 390px found ten prints on both category pages, correct language labels, no overflow or page errors. Production-mode checks returned 404 for the empty category and unpublished Markus product, no Photography links from either shop language, and no draft entries in sitemap/product feed. Original artwork, publication flags and checkout guards are unchanged.

## Further room images on the preview, 28 September 2026

Mark requested the new room images on the test link alongside the Photography category preview. Seven further candidates now replace their previous room scenes: Through the Willows fresh test 03 with the Crayon rug, flowers and curtain; Pines Under Starlight test 03; Current and Foam test 02; The Road at Sunset test 02; Sun Over the Forest test 01; Morning, Cabin Room test 02 with the unlisted jug removed; and Path Through the Trees test 02. Winter Yard, Night and Swan on Still Water retain their earlier fresh furniture pilots. Sheep on the Track retains its earlier preview room: test 02's printed photograph is too narrow for the source 4:5 aspect and simplifies the flock. A new test 05 from the original artwork still alters the flock and adds an unrequested child that blocks the frame. Its replacement is held pending a faithful render.

The chosen native renders are 1122 × 1402. Versioned AVIF quality 70 and WebP quality 88 derivatives preserve trained-algorithmic-media IPTC XMP. `scripts/artists/markus-remaining-room-scenes.json` records the native source hashes, artwork references, exact generation prompts, catalogue IDs, crop measurements and review limits. The source photographs, studio images and earlier preview scenes remain intact. The generated art is naturally part of each room render, not composited after generation.

These rooms are review candidates, not approved product imagery. Fine photograph detail differs from the source in several frames; the road scene simplifies small cyclists, and the Pines scene approximates star and tree detail. The source art should govern any publication decision. Product records remain unpublished, out of stock and review only; no sale or fulfilment data changes.

## Winter Yard colourful rug revision, 28 September 2026

The Winter Yard, Night preview room now includes the HAY Ethan Cook Flat Works rug, Peach Green Check, 170 × 240 cm. [Nordic Nest's exact variant listing](https://www.nordicnest.no/merkevarer/hay/ethan-cook-flat-works-teppe-170-x-240-cm/?variantId=510780-01) supplies the approved product source. The active Social Agent catalogue reference is `fcaf536d-bbe1-4d9e-9036-1736e8661133`, with one image. The previous HAY Colour Carpet test was rejected because its exact variant could not be verified at an approved retailer.

The revised image was generated from the accepted chair room, with the original artwork and exact rug image as references. `scripts/artists/markus-fresh-room-pilots.json` keeps the earlier selection, exact prompt, source hashes, catalogue ID and review limits. The new 1122 × 1402 AVIF quality 70 and WebP quality 88 retain the generated-media XMP metadata. The rug sits under the chair; the trolley's wheels remain on concrete. This is a preview candidate only. Winter Yard, Night remains unpublished, out of stock and review-only.

## Path and Sheep replacement follow-up

Path Through the Trees has a new green-sofa/yellow-wall candidate prepared for the preview. It depicts the existing 70 × 50 cm landscape paper with the complete 5:4 photograph and white side borders. The roughly 72.4 cm outer frame is plausible against the nearer 38 cm DLM table. This supersedes the held 50 × 40 cm experiment, whose frame was too large for that proposed format. The new size option remains undecided; no prices or variants were changed. `scripts/artists/markus-final-room-replacements.json` records the source, exact prompt and inspection notes. Fine generated detail remains interpretative and the original photograph remains the print master.

Sheep on the Track now uses a closer writing-desk composition. All eight original sheep and both puddled ruts are retained; the current 50 × 70 cm paper is shown with white margins. A focused correction brings the rendered artwork aperture to about 0.784 versus the original 0.800 aspect, leaving approximately 2% generative variation. This is a review mockup, not a print proof. Both replacements retain native dimensions and generated-media metadata; prices, variants and publication guards are unchanged.

## Smaller formats at unchanged prices, 28 September 2026

Mark approved45×60cm for the seven3:4 photographs and40×50cm for Swan, Path and Sheep, rotating the landscape works. Each product now lists its one appropriate size. Existing effective Premium50×70 artwork prices and frame supplements are preserved in GBP/USD/NOK/DKK/SEK. This supersedes the earlier A3/A2 proposal. All ten remain unpublished, out of stock and review only.

Gelato read-only quotes verified200gsm uncoated paper, unframed and natural/black/white wood frames, for both new formats in GB/NO. `scripts/artists/markus-size-availability.json` records the exact provider UIDs; no order was placed. Separate SocialAgent mapping support is prepared on local branch `codex/markus-smaller-print-sizes`, commit `3209393`, not deployed. Exact new-size shipping rows are still absent; the shop uses its existing dearest applicable rate fallback, which can overstate shipping. Final printer-ready files and fulfilment setup remain launch prerequisites.

All ten primary framed product images and warm derivatives were exported from unchanged original photographs in their native proportions, with narrow proportional white borders and12mm oak rails. Versioned filenames prevent stale image caching. Three-quarter format paper has1.5cm side and2cm top/bottom borders; four-fifths paper has1.2cm side and1.5cm top/bottom borders, rotated for landscape. Source artwork AVIFs remain unchanged. `prepare-markus-assets.mjs --product-previews-only` regenerates these exact templates.

Room edits are only selected after visual proportion, physical scale and lighting review. Where an older room remains, EN/NO captions explicitly identify its previous paper size and the current listing size. Image generation was blocked for Pines, Winter and Path; these are incomplete room replacements, not completed edits.

Selected smaller room previews: The Road at Sunset and Sun Over the Forest. The other eight retain previous rooms with explicit previous/current captions. Five generated candidates were rejected for proportions or changed composition, and three were blocked before generation. Full prompts and review decisions are in `markus-smaller-room-review.json`. The room batch remains incomplete.

## All ten room frames corrected

Mark explicitly authorised precise geometry edits after generation repeatedly retained narrow frames. All ten room scenes now depict each product’s offered format, rotated for landscape. New versioned assets replace the previous-format images, so the gallery captions identify the current size. Prices and publication/stock guards are unchanged.

Six selected room revisions came from built-in generation. For Willows, Pines, Current and Foam, and Morning Cabin, a continuous geometric correction of the existing generated framed object restores the paper, artwork and12mm oak proportions together. It carries the existing glass/reflections and frame shadow; no original artwork was pasted into a room. Physical paper45×60cm uses a42×56cm image and1.5cm side/2cm top-bottom border, rotated for landscape. Pixels beyond the local frame/shadow edit region are unchanged. Original print masters remain untouched.

The room renders remain illustrative photographs, with small generative variation and perspective; they are not manufacturing proofs. Full source paths, hashes, physical dimensions, corner coordinates, prompts and review notes are in `markus-all-frame-corrections-review.json`.


## Whole-room clean rebuild — 28 September 2026

Mark rejected accumulated texture damage across all ten rooms, not only the Pines example. All ten selected room assets now start from original artwork and clean catalogue references. Whole-room checks cover textile weave, furniture edges, material surfaces, reflection/light coherence, artwork composition and frame scale. Five rooms received one precise local frame correction using the previously approved method; Sun also had one targeted generation edit on its fresh base. No old damaged room was used as a starting reference.

The new AVIF/WebP assets are versioned `room-clean-rebuild` and retain synthetic-media metadata. Selection paths, hashes, available prompts, reference records, geometry and remaining illustrative limitations are in `scripts/artists/markus-clean-room-rebuild-review.json`. Exact earlier generation prompts for Swan, Path, Road and Sun were not recoverable; this is recorded rather than reconstructed.

Both product-gallery size captions were removed in `9f8c92b`. Offered sizes, primary product images, all retail print/frame prices and unpublished/review/coming-soon guards remain unchanged. These are preview candidates for Mark's review.
