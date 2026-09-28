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

Mark rejected the first ten room scenes for repetition and insufficient styling. They remain in this preview pending review of replacement pilots; they are not approved images. The three new pilots (Through the Willows, Winter Yard Night and Swan on Still Water) stay outside the repository in `~/Desktop/ScanArt Image Tests/`, with prompts, active catalogue records, references, measurements and self-review under `Experiment files/markus-pilot-2026-09-28/`. They are not wired into the page. Mark reviews the pilot before any replacement.

Print masters remain in `~/Desktop/Markus-Naarttijarvi-photos/Print exports/`. Only web derivatives are committed. The studio shots preserve the actual photographs; generated rooms are display mockups and require visual approval, not print proofs.

Ten new rooms were generated with the built-in ChatGPT tool. The tool does not expose a verified model identifier. No separately billed image API or Social Agent generator was used. `scripts/artists/markus-room-scenes.json` records the exact prompts and source paths. Native renders are also saved under `~/Desktop/ScanArt Image Tests/Markus-<slug>-room-2026-09-28.png`.

The floor reference is active Social Agent Oak wood flooring `c3d7387d-0981-4e8f-8ab0-68d85e4030f3`, checked on 28 September. Furniture references are the 235cm Bergsdal sofa, 120cm Oblique bench and 63cm Chisel chair. Scene 1 was revised to remove an extra table and empty bowl; scene 7 was revised to reduce the frame size. The generated photographs retain the recognisable source compositions, with minor generative detail, border and furnishing differences to assess before publication. No artwork was composited into a finished room. The exports carry IPTC AI-source metadata; the original photographs are not marked as generated. Most renders are 1122x1402; Morning, Cabin Room is 1080x1457 and retains its native aspect ratio.

Social Agent's shared Product table was not changed: this revision's build syncs Article rows only and reads products from the committed JSON. It must be reconciled deliberately at publication if it is still used operationally. No fulfilment upload or live sale activation is part of this preview.
