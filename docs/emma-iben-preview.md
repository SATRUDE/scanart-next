# Emma Iben preview

Prepared 4 October 2026 (T-0099). Branch `codex/emma-iben-preview`, from main at 41a46a1. All four products are unpublished, out of stock and review-only. Nothing is merged. Mark merges.

- Source: Emma's email of 4 October 16:03 and her WeTransfer (downloaded the same day). Masters stay out of Git in `~/Desktop/Emma-Iben-files/`; hashes, dimensions and profiles in `inventory-sha256.json` beside them. Per-work notes in `scripts/artists/emma-iben-review.json`.
- Bio: her own two sentences plus one sentence from her artist application (31 Aug). Location Copenhagen (added to the artist map). Norwegian bio, statement and product descriptions are Peggy's translations, awaiting approval.
- Descriptions: hers, lightly edited into British English ("clothes peg", "the body", "expectation to fit into"), each followed by one plain sentence saying what the picture shows. No facts added beyond what is visible.
- No text or credit on the prints. No room scenes or vignettes yet (they need Megan and Mark first): `secondaryImage` is left out, so the gallery shows the framed product image only.
- Framed images: `scripts/emma-framed.py`, Megan's method (splices the oak rails along their length, contain-fits the artwork, no cover-fit resize), then `scripts/v2/warm_backdrops.py`.
- Sizes (per artwork, from proportion and resolution; all Premium band, which is the band Mark approved for Ishtar and Markus; all already in the shop, no new size; Gelato catalogue lists A3, A2, A1 in 200gsm uncoated, rolled and framed):
  - Fitting in, Pressure, Good conversation: A3, A2, A1 (A-series ratio, exact fit). Source resolution is more than enough for all three.
  - Precautions: A3 only (2354 px wide; about 168 ppi at A3 landscape, below 150 ppi from A2).
- Fitting in files: the A1 and A2 exports have a white band down one side only, A4 has none, A3 and A5 have equal bands. The shop image uses the A3 export. Emma should supply one consistent set before any A2 or A1 sale.
- Product ids 53 to 56 and artist id 11 follow main; the unmerged Patrik branch uses 10 and 41 to 45 and will need renumbering when it is rebased.
