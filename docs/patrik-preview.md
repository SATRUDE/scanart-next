# Patrik Wennerlund preview

Prepared 2 October 2026. Branch `codex/patrik-wennerlund-preview`, built the way Markus's preview was (see Markus's `docs/add-an-artist.md` on `codex/markus-naarttijarvi-preview`). All five products are unpublished, out of stock and review-only. Nothing is merged. Mark merges.

- Print masters (5 TIFFs, Adobe RGB, unchanged) stay out of Git in `~/Desktop/Patrik-Wennerlund-photos/Print exports/`; hashes and dimensions in `inventory-sha256.json` beside them.
- Bio is Patrik's own wording from his email of 2 October, lightly corrected. Location Borås. Originals link: www.pwmfotoshop.com (Mark, 29 Sep).
- No text or credit on the prints (Mark, 29 Sep). Gallery order matches the live artists: framed product image first (`image`), room scene second (`secondaryImage`), with no third image. Mark, 3 Oct: vignettes ARE the mockup images, so Storm and Tjurpannan Båthus use their vignette in the room slot; the other three keep their room scenes until Mark says otherwise.
- Sizes are proposed per artwork from native ratio and resolution, all verified as Gelato 200gsm uncoated, rolled and natural/black/white frame, GB and NO (read-only quotes, 2 Oct): 40x60 for the three 3:2 works, 40x50 for the 4:5 work, 45x60 (landscape) for the 4:3 work. 40x60cm is new to the shop. Prices copy the Premium 50x70 band as Mark approved for Markus's formats; that is NOT yet approved for 40x60cm.
- Larger exact-ratio sizes feasible but unpriced: 60x90 for the three 3:2 works.
- Missing from Patrik: per-piece descriptions (placeholder line used), portrait photo (initials), Norwegian copy.

## Images, 3 October 2026 (T-0098)

- Framed shots: Megan's five rebuilds (`*-paper-*-2026-10-02-v2.png`, 1640 x 2048, `warm/` WebP twins from `scripts/v2/warm_backdrops.py`). `scripts/prepare-patrik-assets.mjs` is retired: its `sharp.resize({width, height})` defaulted to `fit: 'cover'`, which distorted and cropped the rail band on the three 40 x 60 sheets. `scripts/patrik-framed.py` (Megan's method, splicing the rails along their length only) replaces it and reproduces her files pixel for pixel. The source-artwork AVIFs in `public/images/artworks/` are unchanged.
- Room scenes (In to the woods II, Wake up, Moody 19): Mark-approved finals `<slug>-room-final-2026-10-02.avif|webp` (1122 x 1402, AVIF q70 + WebP q88 twins as the other artists).
- Vignettes in the room slot (Storm, Tjurpannan Båthus): `storm-vignette-pilot-2026-10-02` and `tjurpannan-bathus-vignette-pilot-2026-10-02`. These are the two pilot versions Mark approved; do not swap in newer vignettes (Megan's re-edits) until Mark says.
