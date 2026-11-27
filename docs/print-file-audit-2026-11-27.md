# Print file audit, 27 Nov 2026

Peggy, for Mark. Report only: nothing on the site, in Drive or in the order tool was changed.

**The question for every print, size and frame:** can the customer actually get what the live shop photo shows, with or without a mount? A row fails if Gelato would cut away part of the picture the photo shows (wrong shape, or no bleed under the frame lip), if the file isn't sharp enough at that size, or if that size sends Gelato the wrong file (or none). The shop photos are judged as they are live on `main` today. PR #305 is not wanted and is not part of this.

Scope: the 50 shop prints and Åsa Törnquist's 4 (on PR #301), every size each one sells in, unframed and framed. Frame colour doesn't change the file, so framed is one row. 116 rows.

## Summary

*Updated 27 Nov, evening, with Mark’s corrections: Eltsjoen and Trysilkaffe are intentionally three prints each; the Seagull on Bin file was sent to us and needs finding; Slingshot really is missing; Kopia’s orientation fix (datamachine-reports PR #156) is merged and deployed; Vinkveld’s bleed file, the one Gelato printed on 24 Nov, is now in Drive as `Vinkveld 50x70 bleed.pdf`.*

| Verdict | Rows |
| --- | --- |
| Yes, as shown | 64 |
| Yes, with a printed border (the photo shows a white band; putting that band in the file gives exactly the photo) | 18 |
| Not yet: crop the PDF ourselves (page larger than the product, with printer’s marks; nothing of the picture is lost once cropped) | 16 |
| Follow-up (intentional, but the order tool can’t yet tell which print is meant) | 4 |
| **No** as things stand | 14 |

**The 14 that fail, and the fix for each:**

1. **No file in Drive (5 rows).** Slingshot (Simen Wahlqvist) is missing from the artist: ask Simen. Seagull on Bin (Christina Hägerfors) was sent to us and needs finding, then saving to Drive. Democracy (Åsa): the file is `Folkstyre 50x70.tiff`, so a search for "Democracy" finds nothing: copy it in Drive as `Democracy 50x70.tiff`.
2. **Framed, no bleed (7 rows), fix waiting for Mark’s check.** Sia Siamos’s Hummer og Vin, Hyttefrokost and Morgenlevering (500 × 700 mm PDFs; Gelato refuses a framed print without bleed, as it did Vinkveld’s plain file on 23 Nov), and Ishtar Bäcklund Dakhil’s Stockholm, Frukt & Grönt, Desert Circles and Surfer with Orange Sun (the picture runs to the edge, so 4 to 5 mm per edge would go under the lip). Bleed versions are made, the way Vinkveld’s was: every pixel kept, 4 mm of mirrored edge added. They are on a check page for Mark and not in Drive yet. With them in Drive and datamachine-reports PR #161 shipped, these rows pass.
3. **Too soft and the wrong shape (2 rows).** Precautions (Emma Iben), A3, unframed and framed: 142 ppi, under Gelato’s 150 minimum, and 9% off the A3 shape. Fix: ask Emma for a larger file, or drop the print.

**Follow-up: Eltsjoen and Trysilkaffe (4 rows).** Drive holds three different prints of each (`Eltsjoen 1.tif`, `2`, `3`), as intended. The shop sells one "Eltsjoen" and one "Trysilkaffe", and an order line carries only the title, so the order tool can’t tell which print is meant and refuses it. To fix: record on each shop product which numbered print it is (a print-file field in the catalogue, for example `printFile: "Eltsjoen 1"`, or separate products if all three are to be sold), have the order line carry it, and have `matchPrintFile` take that number as the variant. Until then these are placed by hand.

**The 18 "with a printed border"**: Markus Naarttijärvi’s ten, Patrik Wennerlund’s five, Month of May and Flight Over the Valley (framed). Their photos show a white band around the picture. Gelato is sent the bare picture, which would lose 4 to 5 mm per edge under the lip (and Month of May, Flight Over the Valley and Precautions are 19%, 11% and 9% off the paper shape, so Gelato would also crop them). Putting the photo’s white band into the print file, plus 4 mm bleed, gives the buyer exactly what the photo shows. That is ours to do; no artist needed.

**The 16 "crop the PDF"**: Simen Wahlqvist’s four PDFs and Hedvig Wallin’s four are larger than the product (523 × 523 mm and 515 × 715 mm pages) and carry printer’s crop marks. Gelato’s help centre treats a page larger than the product as an error, and if it scaled the page instead the marks would print. Fix, ours: crop each PDF to 508 × 508 or 508 × 708 mm. Hedvig’s Sunday Brunch and Rosa Blomster and Simen’s Eye Nose Eye carry 2 to 3 mm of bleed rather than 4, so the cropped file has 1 to 2 mm of white at the very edge, all of it under the lip.

**Order tool, bleed files:** datamachine-reports PR #161 (not merged) sends a print’s `<Title> <size> bleed.pdf` whenever one sits beside the original, for framed and unframed lines alike; without one, the original goes as now. The live tool today sends the bleed file for framed lines only, so Vinkveld unframed still gets the plain 500 × 700 mm file until #161 ships (marked in the table).

**Notes, not failures:**
- **Sharpness under 200 ppi** (fine, but not crisp): Small House Big Ocean 176, Journey 190, Family Trip 165, Cruise 188, Desert Circles 178, Month of May 150 (about 186 once padded to the paper shape), Flight Over the Valley 189, Creature Among Blue Leaves 153.
- **Thirteen framed rows have no bleed, but the edge is plain white or a flat colour** (Mikko Saarainen’s four, Creature Among Blue Leaves, Wake up, Pressure and Good Conversation at all three sizes), so the lip hides nothing the photo shows. Adding 4 mm of the plain edge ourselves would stop Gelato warning about bleed. Fitting in has 2.5 mm of bleed on a flat pink edge.
- **Åsa’s prints are sold unframed only.** Her TIFFs are exactly 500 × 700 mm with no bleed, so framing them later needs bleed versions (already noted on T-0592).
- **A-sizes to North America**: Gelato makes cm and A-size posters in the nearest inch size there, "which has a different aspect ratio" and "might lead to slight cropping" ([Gelato](https://support.gelato.com/en/articles/8996288-can-i-order-a-frame-or-poster-in-cm-in-north-america-and-in-inches-in-the-rest-of-the-world)). This affects every A3, A2 and A1 print we send to the US, whatever the file.
- **The Drive README is out of date**: it lists Through the Willows, Boathouses in Winter and Swan on Still Water as missing (all three are now in Drive), and doesn’t yet list `Vinkveld 50x70 bleed.pdf`.

## Does Gelato offer a mount (passepartout)?

**No, not through the API.** Checked 27 Nov 2026 against Gelato’s Product API (`product.gelatoapis.com/v3/catalogs`, our read-only key):
- None of Gelato’s 61 catalogues has a mount or passepartout attribute. The only attribute with "mount" in its name is `WallpaperMounting`, which belongs to the wallpaper catalogues.
- `framed-posters` (our product) has attributes for frame size, colour, material, frame properties (`w12xt22-mm`), paper and glass, and nothing for a mount.
- `mounted-framed-posters` exists, but "mounted" there means the poster comes fitted in the frame (UIDs like `frame_and_poster_mounted_product_frs_500x700-mm_frc_natural-wood_frm_wood_frp_w12xt22-mm_..._pf_500x700-mm_...`). The paper size equals the frame size, so it has no mount either.
- `fine-art-framed-poster` and `mounted-fine-art` have no mount attribute either.
- Gelato’s product pages and help centre say nothing about mounts either (a search of gelato.com and support.gelato.com found nothing).

So there are no mount UIDs, colours, widths or prices to compare with `framed_poster_..._w12xt22-mm_plexiglass_...`. The only way to sell what a "white band" photo shows is a printed border: the white margin printed on the poster itself, inside the same frame. That looks like a mount from a distance, but it is flat, not a cut bevelled card. The 18 "with a printed border" rows rely on it.

## Where the facts come from

- **Bleed**: Gelato’s design requirements ask for "a 4 mm bleed area … on all sides", and say "for framed prints, the frame will cover approximately 4–5 mm (about 0.16–0.2 inches) on each side" ([Gelato: design requirements for PDF uploads](https://support.gelato.com/en/articles/8996349-what-are-the-design-requirements-for-pdf-uploads); [missing bleed warning](https://support.gelato.com/en/articles/8996583-document-page-dimensions-matched-the-product-size-but-did-not-include-bleeds)). Gelato refused Vinkveld’s 500 × 700 mm framed PDF (order 21cfc56b, 23 Nov) and printed the 508 × 708 mm bleed version (order f873f6a5, 24 Nov).
- **Resolution**: "at least 150 dpi and a maximum of 300 dpi at the actual size" (same Gelato page).
- **Wrong shape**: Gelato’s documentation doesn’t say whether it crops or pads a file of the wrong shape. Its [product fit check](https://support.gelato.com/en/articles/8996341-product-fit-check) flags a design that doesn’t match the printable area, and [a page larger than the product](https://support.gelato.com/en/articles/8996579-document-page-dimension-is-larger-than-product-requirements) is an error. Our own record is that Gelato fits the file to the product itself (studio notes, 23 Nov), and our order tool assumes it crops: it refuses any file more than 2% off the paper shape (`checkProportions` in `orders.mjs`, Mark, 23 Nov: "flag a mismatch rather than let Gelato crop"). In practice, then, those rows can’t be sent through Add to Gelato at all. This table takes crop as the outcome, the cautious reading.
- **Which file is sent**: the live order tool’s own matcher (`matchPrintFile` in datamachine-reports `server/decisions/drive-files.mjs`, `main`, with PR #156 merged) run against the Drive folder `My Drive/Scandinavian Art/Print files`, with each shop line’s title, artist, size and frame. PR #161’s version was run as well; where it would send a different file, the mapping column says so.
- **File measurements**: page boxes and embedded image resolution read with `pdfinfo` and `pdfimages`; pixel sizes, ppi and edge colour read from the images themselves. Effective ppi is the pixels across the paper at that size. Bleed on the PDFs was measured from where the ink stops on the page.

## Every print, size and frame

Columns 1 to 4 are Mark’s four checks. The last column is the verdict: can the buyer get what the live photo shows?

| Print | Size | Frame | File Gelato is sent | 1. Shape | 2. Bleed (framed) | 3. Sharpness | 4. File mapping | Achievable as shown |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Eltsjoen | 50×70 cm | Unframed | no file | – | – | – | Note: three different prints of this title in Drive (1, 2, 3), as intended; the shop line doesn’t say which, so the order tool refuses it | Follow-up |
| Eltsjoen | 50×70 cm | Framed | no file | – | – | – | Note: three different prints of this title in Drive (1, 2, 3), as intended; the shop line doesn’t say which, so the order tool refuses it | Follow-up |
| Eye Nose Eye | 50×50 cm | Unframed | `Eye Nose Eye.pdf` | Pass: 0.0% | **Problem**: page 523.3×523.3 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Pass: vector | Pass | Not yet: crop the PDF |
| Eye Nose Eye | 50×50 cm | Framed | `Eye Nose Eye.pdf` | Pass: 0.0% | **Problem**: page 523.3×523.3 mm with printer’s marks; about 2 mm bleed, not 4 | Pass: vector | Pass | Not yet: crop the PDF |
| Half Man | 50×50 cm | Unframed | `Half Man.pdf` | Pass: 0.0% | **Problem**: page 523.3×523.3 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Pass: vector | Pass | Not yet: crop the PDF |
| Half Man | 50×50 cm | Framed | `Half Man.pdf` | Pass: 0.0% | **Problem**: page 523.3×523.3 mm with printer’s marks, not 508×508; art has its own white edge, so the lip hides only white | Pass: vector | Pass | Not yet: crop the PDF |
| Hummer og Vin | 50×70 cm | Unframed | `Hummer og Vin 50x70.pdf` | Pass: 0.0% | – | Pass: 400 ppi | Pass | Yes |
| Hummer og Vin | 50×70 cm | Framed | `Hummer og Vin 50x70.pdf` | Pass: 0.0% | **Problem**: 500×700 mm, no bleed: Gelato refuses it (Vinkveld, 23 Nov). Bleed version made, awaiting Mark’s check | Pass: 400 ppi | Pass | **No** |
| Hyttefrokost | 50×70 cm | Unframed | `Hyttefrokost 50x70.pdf` | Pass: 0.0% | – | Pass: 400 ppi | Pass | Yes |
| Hyttefrokost | 50×70 cm | Framed | `Hyttefrokost 50x70.pdf` | Pass: 0.0% | **Problem**: 500×700 mm, no bleed: Gelato refuses it (Vinkveld, 23 Nov). Bleed version made, awaiting Mark’s check | Pass: 400 ppi | Pass | **No** |
| Mean Snothing | 50×50 cm | Unframed | `Mean Snothing.pdf` | Pass: 0.0% | **Problem**: page 523.3×523.3 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Pass: vector | Pass | Not yet: crop the PDF |
| Mean Snothing | 50×50 cm | Framed | `Mean Snothing.pdf` | Pass: 0.0% | **Problem**: page 523.3×523.3 mm with printer’s marks, not 508×508; art has its own white edge, so the lip hides only white | Pass: vector | Pass | Not yet: crop the PDF |
| Morgenlevering | 50×70 cm | Unframed | `Morgenlevering 50x70.pdf` | Pass: 0.0% | – | Pass: 400 ppi | Pass | Yes |
| Morgenlevering | 50×70 cm | Framed | `Morgenlevering 50x70.pdf` | Pass: 0.0% | **Problem**: 500×700 mm, no bleed: Gelato refuses it (Vinkveld, 23 Nov). Bleed version made, awaiting Mark’s check | Pass: 400 ppi | Pass | **No** |
| Morgenstrekk | 50×70 cm | Unframed | `Morgenstrekk.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Pass: 404 ppi | Pass | Not yet: crop the PDF |
| Morgenstrekk | 50×70 cm | Framed | `Morgenstrekk.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, not 508×708; art has its own white edge, so the lip hides only white | Pass: 404 ppi | Pass | Not yet: crop the PDF |
| Slingshot | 50×50 cm | Unframed | no file | – | – | – | **Problem**: no file anywhere: missing from the artist | **No** |
| Slingshot | 50×50 cm | Framed | no file | – | – | – | **Problem**: no file anywhere: missing from the artist | **No** |
| Trysilkaffe | 50×70 cm | Unframed | no file | – | – | – | Note: three different prints of this title in Drive (1, 2, 3), as intended; the shop line doesn’t say which, so the order tool refuses it | Follow-up |
| Trysilkaffe | 50×70 cm | Framed | no file | – | – | – | Note: three different prints of this title in Drive (1, 2, 3), as intended; the shop line doesn’t say which, so the order tool refuses it | Follow-up |
| Vinkveld | 50×70 cm | Unframed | `Vinkveld 50x70.pdf` | Pass: 0.0% | – | Pass: 404 ppi | Pass: after PR #161: `Vinkveld 50x70 bleed.pdf` | Yes |
| Vinkveld | 50×70 cm | Framed | `Vinkveld 50x70 bleed.pdf` | Pass: 0.4% | Pass: 508×708 mm | Pass: 404 ppi | Pass | Yes |
| Sunday Brunch | 50×70 cm | Unframed | `Sunday Brunch 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Pass: 300 ppi | Pass | Not yet: crop the PDF |
| Sunday Brunch | 50×70 cm | Framed | `Sunday Brunch 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks; 3 mm bleed, not 4 | Pass: 300 ppi | Pass | Not yet: crop the PDF |
| Rosa Blomster | 50×70 cm | Unframed | `Rosa Blomster 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Pass: 352 ppi | Pass | Not yet: crop the PDF |
| Rosa Blomster | 50×70 cm | Framed | `Rosa Blomster 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks; 3 mm bleed, not 4 | Pass: 352 ppi | Pass | Not yet: crop the PDF |
| Massa Äpplen | 50×70 cm | Unframed | `Massa Äpplen 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Pass: 395 ppi | Pass | Not yet: crop the PDF |
| Massa Äpplen | 50×70 cm | Framed | `Massa Äpplen 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, not 508×708; art has its own white edge, so the lip hides only white | Pass: 395 ppi | Pass | Not yet: crop the PDF |
| Small House Big Ocean | 50×70 cm | Unframed | `Small House Big Ocean 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, larger than the product: Gelato flags a page larger than the product, or prints the marks | Note: 176 ppi | Pass | Not yet: crop the PDF |
| Small House Big Ocean | 50×70 cm | Framed | `Small House Big Ocean 50x70.pdf` | Pass: 0.0% | **Problem**: page 514.8×714.8 mm with printer’s marks, not 508×708; art has its own white edge, so the lip hides only white | Note: 176 ppi | Pass | Not yet: crop the PDF |
| Cruise | 50×50 cm | Unframed | `Cruise.jpg` | Pass: 0.1% | – | Note: 188 ppi | Pass | Yes |
| Cruise | 50×50 cm | Framed | `Cruise.jpg` | Pass: 0.1% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Note: 188 ppi | Pass | Yes |
| Family Trip | 50×50 cm | Unframed | `Family Trip.jpg` | Pass: 0.0% | – | Note: 165 ppi | Pass | Yes |
| Family Trip | 50×50 cm | Framed | `Family Trip.jpg` | Pass: 0.0% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Note: 165 ppi | Pass | Yes |
| Journey | 50×70 cm | Unframed | `Journey.jpg` | Pass: 0.8% | – | Note: 190 ppi | Pass | Yes |
| Journey | 50×70 cm | Framed | `Journey.jpg` | Pass: 0.8% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Note: 190 ppi | Pass | Yes |
| URF! | 50×50 cm | Unframed | `URF!.jpg` | Pass: 0.7% | – | Pass: 325 ppi | Pass | Yes |
| URF! | 50×50 cm | Framed | `URF!.jpg` | Pass: 0.7% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Pass: 325 ppi | Pass | Yes |
| Stockholm | A2 | Unframed | `Stockholm.tif` | Pass: 0.0% | – | Pass: 300 ppi | Pass | Yes |
| Stockholm | A2 | Framed | `Stockholm.tif` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 300 ppi | Pass | **No** |
| Frukt & Grönt | A2 | Unframed | `Frukt och Grönt.jpg` | Pass: 0.0% | – | Pass: 300 ppi | Pass | Yes |
| Frukt & Grönt | A2 | Framed | `Frukt och Grönt.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 300 ppi | Pass | **No** |
| Desert Circles | 50×50 cm | Unframed | `Desert Circles.png` | Pass: 0.1% | – | Note: 178 ppi | Pass | Yes |
| Desert Circles | 50×50 cm | Framed | `Desert Circles.png` | Pass: 0.1% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Note: 178 ppi | Pass | **No** |
| Month of May | 50×70 cm | Unframed | `Month of May.jpg` | **Problem**: 19% off (1.13 vs 1.4 to 1): Gelato fills and crops; the order tool refuses it | – | Note: 150 ppi | Pass | Yes, with a printed border |
| Month of May | 50×70 cm | Framed | `Month of May.jpg` | **Problem**: 19% off (1.13 vs 1.4 to 1): Gelato fills and crops; the order tool refuses it | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Note: 150 ppi | Pass | Yes, with a printed border |
| Flight Over the Valley | A3 | Unframed | `Flight Over the Valley.jpg` | **Problem**: 11% off (1.26 vs 1.41 to 1): Gelato fills and crops; the order tool refuses it | – | Note: 189 ppi | Pass | Yes, with a printed border |
| Flight Over the Valley | A3 | Framed | `Flight Over the Valley.jpg` | **Problem**: 11% off (1.26 vs 1.41 to 1): Gelato fills and crops; the order tool refuses it | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Note: 189 ppi | Pass | Yes, with a printed border |
| Creature Among Blue Leaves | 50×70 cm | Unframed | `Creature Among Blue Leaves.jpg` | Pass: 0.6% | – | Note: 153 ppi | Pass | Yes |
| Creature Among Blue Leaves | 50×70 cm | Framed | `Creature Among Blue Leaves.jpg` | Pass: 0.6% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Note: 153 ppi | Pass | Yes |
| Surfer with Orange Sun | A3 | Unframed | `Surfer with Orange Sun.jpg` | Pass: 0.0% | – | Pass: 884 ppi | Pass | Yes |
| Surfer with Orange Sun | A3 | Framed | `Surfer with Orange Sun.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 884 ppi | Pass | **No** |
| Through the Willows | 45×60 cm | Unframed | `Through the Willows.jpg` | Pass: 0.0% | – | Pass: 345 ppi | Pass | Yes |
| Through the Willows | 45×60 cm | Framed | `Through the Willows.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 345 ppi | Pass | Yes, with a printed border |
| Pines Under Starlight | 45×60 cm | Unframed | `Pines Under Starlight.jpg` | Pass: 0.0% | – | Pass: 325 ppi | Pass | Yes |
| Pines Under Starlight | 45×60 cm | Framed | `Pines Under Starlight.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 325 ppi | Pass | Yes, with a printed border |
| Boathouses in winter | 45×60 cm | Unframed | `Boathouses in winter.jpg` | Pass: 0.0% | – | Pass: 335 ppi | Pass | Yes |
| Boathouses in winter | 45×60 cm | Framed | `Boathouses in winter.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 335 ppi | Pass | Yes, with a printed border |
| Frozen currents | 45×60 cm | Unframed | `Frozen currents.jpg` | Pass: 0.0% | – | Pass: 297 ppi | Pass | Yes |
| Frozen currents | 45×60 cm | Framed | `Frozen currents.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 297 ppi | Pass | Yes, with a printed border |
| The Road at Sunset | 45×60 cm | Unframed | `The Road at Sunset.jpg` | Pass: 0.0% | – | Pass: 292 ppi | Pass | Yes |
| The Road at Sunset | 45×60 cm | Framed | `The Road at Sunset.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 292 ppi | Pass | Yes, with a printed border |
| Sun Over the Forest | 45×60 cm | Unframed | `Sun Over the Forest.jpg` | Pass: 0.0% | – | Pass: 287 ppi | Pass | Yes |
| Sun Over the Forest | 45×60 cm | Framed | `Sun Over the Forest.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 287 ppi | Pass | Yes, with a printed border |
| Swan on Still Water | 40×50 cm | Unframed | `Swan on Still Water.jpg` | Pass: 0.0% | – | Pass: 428 ppi | Pass | Yes |
| Swan on Still Water | 40×50 cm | Framed | `Swan on Still Water.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 428 ppi | Pass | Yes, with a printed border |
| Morning, Cabin Room | 45×60 cm | Unframed | `Morning, Cabin Room.jpg` | Pass: 0.0% | – | Pass: 358 ppi | Pass | Yes |
| Morning, Cabin Room | 45×60 cm | Framed | `Morning, Cabin Room.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 358 ppi | Pass | Yes, with a printed border |
| Path Through the Trees | 40×50 cm | Unframed | `Path Through the Trees.jpg` | Pass: 0.0% | – | Pass: 450 ppi | Pass | Yes |
| Path Through the Trees | 40×50 cm | Framed | `Path Through the Trees.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 450 ppi | Pass | Yes, with a printed border |
| Sheep on the Track | 40×50 cm | Unframed | `Sheep on the Track.jpg` | Pass: 0.0% | – | Pass: 395 ppi | Pass | Yes |
| Sheep on the Track | 40×50 cm | Framed | `Sheep on the Track.jpg` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 395 ppi | Pass | Yes, with a printed border |
| In to the woods II | 40×60 cm | Unframed | `In to the woods II.tif` | Pass: 0.2% | – | Pass: 373 ppi | Pass | Yes |
| In to the woods II | 40×60 cm | Framed | `In to the woods II.tif` | Pass: 0.2% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 373 ppi | Pass | Yes, with a printed border |
| Storm | 40×60 cm | Unframed | `Storm.tif` | Pass: 0.0% | – | Pass: 390 ppi | Pass | Yes |
| Storm | 40×60 cm | Framed | `Storm.tif` | Pass: 0.0% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 390 ppi | Pass | Yes, with a printed border |
| Tjurpannan Båthus | 40×50 cm | Unframed | `Tjurpannan Båthus.tif` | Pass: 0.5% | – | Pass: 723 ppi | Pass | Yes |
| Tjurpannan Båthus | 40×50 cm | Framed | `Tjurpannan Båthus.tif` | Pass: 0.5% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 723 ppi | Pass | Yes, with a printed border |
| Wake up | 40×60 cm | Unframed | `Wake up.tif` | Pass: 0.0% | – | Pass: 340 ppi | Pass | Yes |
| Wake up | 40×60 cm | Framed | `Wake up.tif` | Pass: 0.0% | Note: no bleed, but the edge is plain colour, so the lip hides nothing that matters | Pass: 340 ppi | Pass | Yes |
| Moody 19 - The Crow | 45×60 cm | Unframed | `Moody 19 - The Crow.tif` | Pass: 0.1% | – | Pass: 308 ppi | Pass | Yes |
| Moody 19 - The Crow | 45×60 cm | Framed | `Moody 19 - The Crow.tif` | Pass: 0.1% | **Problem**: no bleed: 4–5 mm of picture under the lip on each side. Bleed version made, awaiting Mark’s check | Pass: 308 ppi | Pass | Yes, with a printed border |
| Fitting in | A3 | Unframed | `Fitting in.png` | Pass: 0.1% | – | Pass: 604 ppi | Pass | Yes |
| Fitting in | A3 | Framed | `Fitting in.png` | Pass: 0.1% | Note: 2.5 mm of bleed at A1, scaled for A3/A2; about 1.5 to 2.5 mm of the pink edge goes under the lip (flat colour) | Pass: 604 ppi | Pass | Yes |
| Fitting in | A2 | Unframed | `Fitting in.png` | Pass: 0.1% | – | Pass: 427 ppi | Pass | Yes |
| Fitting in | A2 | Framed | `Fitting in.png` | Pass: 0.1% | Note: 2.5 mm of bleed at A1, scaled for A3/A2; about 1.5 to 2.5 mm of the pink edge goes under the lip (flat colour) | Pass: 427 ppi | Pass | Yes |
| Fitting in | A1 | Unframed | `Fitting in.png` | Pass: 0.2% | – | Pass: 302 ppi | Pass | Yes |
| Fitting in | A1 | Framed | `Fitting in.png` | Pass: 0.2% | Note: 2.5 mm of bleed at A1, scaled for A3/A2; about 1.5 to 2.5 mm of the pink edge goes under the lip (flat colour) | Pass: 302 ppi | Pass | Yes |
| Precautions | A3 | Unframed | `Precautions.png` | **Problem**: 9% off (1.28 vs 1.41 to 1): Gelato fills and crops; the order tool refuses it | – | **Problem**: 142 ppi | Pass | **No** |
| Precautions | A3 | Framed | `Precautions.png` | **Problem**: 9% off (1.28 vs 1.41 to 1): Gelato fills and crops; the order tool refuses it | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | **Problem**: 142 ppi | Pass | **No** |
| Pressure | A3 | Unframed | `Pressure.png` | Pass: 0.1% | – | Pass: 600 ppi | Pass | Yes |
| Pressure | A3 | Framed | `Pressure.png` | Pass: 0.1% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Pass: 600 ppi | Pass | Yes |
| Pressure | A2 | Unframed | `Pressure.png` | Pass: 0.1% | – | Pass: 424 ppi | Pass | Yes |
| Pressure | A2 | Framed | `Pressure.png` | Pass: 0.1% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Pass: 424 ppi | Pass | Yes |
| Pressure | A1 | Unframed | `Pressure.png` | Pass: 0.0% | – | Pass: 300 ppi | Pass | Yes |
| Pressure | A1 | Framed | `Pressure.png` | Pass: 0.0% | Note: no bleed, but the edge is plain white, so the lip hides nothing that matters | Pass: 300 ppi | Pass | Yes |
| Good conversation | A3 | Unframed | `Good conversation.png` | Pass: 0.1% | – | Pass: 929 ppi | Pass | Yes |
| Good conversation | A3 | Framed | `Good conversation.png` | Pass: 0.1% | Note: no bleed, but the edge is plain colour, so the lip hides nothing that matters | Pass: 929 ppi | Pass | Yes |
| Good conversation | A2 | Unframed | `Good conversation.png` | Pass: 0.1% | – | Pass: 657 ppi | Pass | Yes |
| Good conversation | A2 | Framed | `Good conversation.png` | Pass: 0.1% | Note: no bleed, but the edge is plain colour, so the lip hides nothing that matters | Pass: 657 ppi | Pass | Yes |
| Good conversation | A1 | Unframed | `Good conversation.png` | Pass: 0.0% | – | Pass: 465 ppi | Pass | Yes |
| Good conversation | A1 | Framed | `Good conversation.png` | Pass: 0.0% | Note: no bleed, but the edge is plain colour, so the lip hides nothing that matters | Pass: 465 ppi | Pass | Yes |
| Big Whale | 50×70 cm | Unframed | `Big Whale.pdf` | Pass: 0.4% | – | Pass: 300 ppi | Pass | Yes |
| Big Whale | 50×70 cm | Framed | `Big Whale.pdf` | Pass: 0.4% | Pass: 508×708 mm | Pass: 300 ppi | Pass | Yes |
| Funny Mermaid | 50×70 cm | Unframed | `Funny Mermaid.pdf` | Pass: 0.4% | – | Pass: 300 ppi | Pass | Yes |
| Funny Mermaid | 50×70 cm | Framed | `Funny Mermaid.pdf` | Pass: 0.4% | Pass: 508×708 mm | Pass: 300 ppi | Pass | Yes |
| Mushroom Picking | 50×70 cm | Unframed | `Mushroom Picking.pdf` | Pass: 0.4% | – | Pass: 300 ppi | Pass | Yes |
| Mushroom Picking | 50×70 cm | Framed | `Mushroom Picking.pdf` | Pass: 0.4% | Pass: 508×708 mm | Pass: 300 ppi | Pass | Yes |
| Polar Bear Castle | 50×70 cm | Unframed | `Polar Bear Castle.pdf` | Pass: 0.4% | – | Pass: 300 ppi | Pass | Yes |
| Polar Bear Castle | 50×70 cm | Framed | `Polar Bear Castle.pdf` | Pass: 0.4% | Pass: 508×708 mm | Pass: 300 ppi | Pass | Yes |
| Seagull on Bin | 50×70 cm | Unframed | no file | – | – | – | **Problem**: not in Drive yet: the file was sent to us and needs finding | **No** |
| Seagull on Bin | 50×70 cm | Framed | no file | – | – | – | **Problem**: not in Drive yet: the file was sent to us and needs finding | **No** |
| Democracy | 50×70 cm | Unframed | no file | – | – | – | **Problem**: the file is named Folkstyre, so Democracy finds nothing | **No** |
| Texting You | 50×70 cm | Unframed | `Texting you 50x70.tiff` | Pass: 0.0% | – | Pass: 300 ppi | Pass | Yes |
| Kopia (portrait) | 50×70 cm | Unframed | `Kopia 50x70.tiff` | Pass: 0.0% | – | Pass: 300 ppi | Pass | Yes |
| Kopia (landscape) | 50×70 cm | Unframed | `Kopia 70x50.tiff` | Pass: 0.0% | – | Pass: 300 ppi | Pass | Yes |
