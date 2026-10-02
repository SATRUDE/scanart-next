#!/usr/bin/env python3
"""Tone an artist portrait in the brand's single brown (Mark, 2026-09-25).

Every portrait shown on the site goes through this, so mixed-quality photos read
as a set. Recipe (from the brand file ~/brands/scandinavian-art/artists/README.md):
square crop, greyscale with 1% autocontrast, then map
dark #2B1A10 -> mid #937058 (at grey 140) -> light #F7EFE9, and ship as a
400 px WebP named <slug>-tone.webp in public/images/artists/.

Usage:
  python3 scripts/tone-artist-portrait.py <source image> <slug> [--crop X,Y,SIZE]
Without --crop the largest centred square is used. Then add the slug to TONED in
components/v2/artists/artist-data.ts (an unlisted artist shows untoned).
"""
import sys
import numpy as np
from PIL import Image, ImageOps

DARK, MID, LIGHT, MID_AT = (0x2B, 0x1A, 0x10), (0x93, 0x70, 0x58), (0xF7, 0xEF, 0xE9), 140.0


def tone(im: Image.Image) -> Image.Image:
    g = np.asarray(ImageOps.autocontrast(im.convert("L"), cutoff=1)).astype(float)[..., None]
    d, m, l = (np.array(c, float) for c in (DARK, MID, LIGHT))
    out = np.where(g <= MID_AT, d + (m - d) * (g / MID_AT), m + (l - m) * ((g - MID_AT) / (255 - MID_AT)))
    return Image.fromarray(out.round().astype("uint8"))


def main() -> None:
    args = sys.argv[1:]
    crop = None
    if "--crop" in args:
        i = args.index("--crop")
        crop = tuple(int(v) for v in args[i + 1].split(","))
        del args[i : i + 2]
    if len(args) != 2:
        sys.exit(__doc__)
    src, slug = args
    # Flatten any alpha over white so transparent corners do not go black.
    im = Image.open(src).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(bg, im).convert("RGB")
    if crop:
        x, y, s = crop
    else:
        s = min(im.size)
        x, y = (im.width - s) // 2, (im.height - s) // 2
    im = im.crop((x, y, x + s, y + s))
    out = f"public/images/artists/{slug}-tone.webp"
    tone(im).resize((400, 400), Image.LANCZOS).save(out, quality=80)
    print("wrote", out)


if __name__ == "__main__":
    main()
