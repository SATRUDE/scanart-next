#!/usr/bin/env python3
"""The 404's "Fill the frame" states: each print hung in the empty frame.

The artwork (the flat crop the wall tool uses, public/images/v2/wall/prints)
fills the whole glass opening edge to edge, cover-cropped to the opening's
shape, and is lit by the empty glass's own shading so the window light and
reflection sit over it. Deterministic; nothing is generated.

    python3 scripts/v2/frame_404.py dancer dragon hyttefrokost
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "public/images/v2/not-found"
EMPTY = DIR / "empty-frame.webp"
# The glass opening inside the moulding, measured on the 1122 x 1402 image.
X0, Y0, X1, Y1 = 615, 57, 937, 540


def hang(slug: str) -> Path:
    room = Image.open(EMPTY).convert("RGB")
    w, h = X1 - X0, Y1 - Y0
    art = Image.open(ROOT / f"public/images/v2/wall/prints/{slug}.jpg").convert("RGB")
    # Cover-crop to the opening's shape, centred.
    ar, tr = art.width / art.height, w / h
    if ar > tr:
        nw = round(art.height * tr); x = (art.width - nw) // 2
        art = art.crop((x, 0, x + nw, art.height))
    else:
        nh = round(art.width / tr); y = (art.height - nh) // 2
        art = art.crop((0, y, art.width, y + nh))
    art = np.asarray(art.resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    glass = room.crop((X0, Y0, X1, Y1)).convert("L").filter(ImageFilter.GaussianBlur(2))
    g = np.asarray(glass).astype(np.float32)
    shade = np.clip(g / np.median(g), 0.8, 1.15)[..., None]
    lit = art * np.minimum(shade, 1.0)
    # Where the glass is brighter than the paper (the window's reflection), screen it on.
    glow = np.clip(shade - 1.0, 0, None) * 2.2
    lit = 1 - (1 - lit) * (1 - glow)
    out = np.asarray(room).astype(np.float32) / 255
    out[Y0:Y1, X0:X1] = lit
    dest = DIR / f"fill-{slug}.webp"
    Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8)).save(dest, quality=88, method=6)
    return dest


if __name__ == "__main__":
    for s in sys.argv[1:] or ["dancer", "dragon", "hyttefrokost"]:
        print(hang(s))
