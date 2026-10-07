# Patrik Wennerlund preview

Prepared 2 October 2026 on `codex/patrik-wennerlund-preview`, built the way Markus's preview was (see `docs/add-an-artist.md`). **Taken live 7 October 2026** (T-0098, PR "Take Patrik Wennerlund live: five photographs"): the five products are `published: true`, `inStock: true`, with the review marker removed, as for Markus in #233. The notes below are the preview record.

- Print masters (5 TIFFs, Adobe RGB, unchanged) stay out of Git in `~/Desktop/Patrik-Wennerlund-photos/Print exports/`; hashes and dimensions in `inventory-sha256.json` beside them.
- Bio is Patrik's own wording from his email of 2 October, lightly corrected. Location Borås. Originals link: www.pwmfotoshop.com (Mark, 29 Sep).
- No text or credit on the prints (Mark, 29 Sep). Gallery order matches the live artists: framed product image first (`image`), room scene second (`secondaryImage`), with no third image. Mark, 3 Oct: vignettes ARE the mockup images, so all five prints use their vignette in the room slot. Room scenes are no longer shipped for any of them.
- Sizes are proposed per artwork from native ratio and resolution, all verified as Gelato 200gsm uncoated, rolled and natural/black/white frame, GB and NO (read-only quotes, 2 Oct): 40x60 for the three 3:2 works, 40x50 for the 4:5 work, 45x60 (landscape) for the 4:3 work. 40x60cm is new to the shop. Prices copy the Premium 50x70 band as Mark approved for Markus's formats; Mark approved the same price for 40x60cm on 6 Oct 2026.
- Larger exact-ratio sizes feasible but unpriced: 60x90 for the three 3:2 works.
- Norwegian copy (bio, statement line, product descriptions) was approved and added 6 Oct 2026.

## Images, 3 October 2026 (T-0098)

- Framed shots: Megan's five rebuilds (`*-paper-*-2026-10-02-v2.png`, 1640 x 2048, `warm/` WebP twins from `scripts/v2/warm_backdrops.py`). `scripts/prepare-patrik-assets.mjs` is retired: its `sharp.resize({width, height})` defaulted to `fit: 'cover'`, which distorted and cropped the rail band on the three 40 x 60 sheets. `scripts/patrik-framed.py` (Megan's method, splicing the rails along their length only) replaces it and reproduces her files pixel for pixel. The source-artwork AVIFs in `public/images/artworks/` are unchanged.
- Vignettes in the room slot, approved by Mark 3 Oct ("Those vignettes are very good. Let's record these."), 1122 x 1402, AVIF q70 + WebP q88 twins, focal points from `scripts/v2/scene_focus.py` so crops keep the print. Sources in `~/Desktop/ScanArt Image Tests/Patrik Wennerlund/2026-10-02/vignettes/`:
  - Storm: `storm-vignette-pilot-2026-10-02` (Patrik-storm-leaning-vignette-pilot)
  - Tjurpannan Båthus: `tjurpannan-bathus-vignette-v3-2026-10-03` (hung v3; replaces the pilot)
  - In to the woods II: `in-to-the-woods-ii-vignette-v2-2026-10-03` (leaning v2)
  - Wake up: `wake-up-vignette-v2-2026-10-03` (leaning v2)
  - Moody 19 - The Crow: `moody-19-the-crow-vignette-v2-2026-10-03` (hung v2)
- The earlier room scenes (`*-room-final-2026-10-02`) and the Tjurpannan pilot vignette were removed from the branch.

## Descriptions and portrait, 4 October 2026 (T-0098)

Patrik replied Sunday 4 October with a description for each print and a portrait ("Please be free to make corrections").

- Descriptions are his own texts, lightly edited into British English, facts and first-person voice kept; "west coast" is Sweden's west coast (he lives near Borås). They live in `public/notion-data/products.json`.
- Portrait: his 500 x 600 photograph is kept as `public/images/artists/patrik-wennerlund.jpg` (the og image and Person JSON-LD, as for Markus) and toned in the brand brown with `scripts/tone-artist-portrait.py patrik-wennerlund --crop 25,15,460` (square centred on his face), listed in `TONED`. No photographer credit was given, so none is shown.
