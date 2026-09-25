#!/usr/bin/env python3
"""Warm the studio backdrop of the standard product shots for V2.

The catalogue's product images sit on a neutral grey studio backdrop (#F3F3F3).
V2 shows every print on the warm image background (#F7F1EC, the image-bg role),
so this makes a warm copy of each: the backdrop and the frame's soft shadow are
scaled per channel (243 -> 247/241/236), and everything inside the frame is left
exactly as photographed, so no print changes colour.

The originals stay untouched: the Merchant Center feed (app/product-feed.xml)
wants the neutral background. Output: public/images/products/warm/<name>.webp
and lib/warm-images.json, the list V2's image helper reads.

    python3 scripts/v2/warm_backdrops.py            # all products
    python3 scripts/v2/warm_backdrops.py dancer     # one, for a quick look

Deterministic and repeatable; no image is generated. Run it again when a new
product image arrives.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/images/products"
OUT = SRC / "warm"
BACKDROP = np.array([243, 243, 243], dtype=np.float32)
WARM = np.array([247, 241, 236], dtype=np.float32)   # --sa-image-bg


def frame_box(a):
    """The frame's bounding box: pixels clearly unlike the backdrop, shadow excluded."""
    diff = np.abs(a - BACKDROP).max(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    solid = (diff > 45) | (sat > 18)          # wood, black and the artwork; soft grey shadow stays out
    rows = np.where(solid.mean(axis=1) > 0.02)[0]
    cols = np.where(solid.mean(axis=0) > 0.02)[0]
    if len(rows) == 0 or len(cols) == 0:
        return None
    return rows[0], rows[-1], cols[0], cols[-1]


def warm(path: Path, out: Path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    box = frame_box(a)
    # Everything neutral outside the frame is backdrop or shadow: scale it.
    sat = a.max(axis=2) - a.min(axis=2)
    neutral = sat < 10
    mask = neutral.copy()
    if box:
        t, b, l, r = box
        mask[t:b + 1, l:r + 1] = False
    # Feather the mask a touch so the edge of the shadow blends.
    m = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    scaled = np.clip(a * (WARM / BACKDROP), 0, 255)
    res = a * (1 - m[..., None]) + scaled * m[..., None]
    Image.fromarray(res.round().astype(np.uint8)).save(out, "WEBP", quality=90, method=6)
    return box


def main():
    products = json.loads((ROOT / "public/notion-data/products.json").read_text())
    only = set(sys.argv[1:])
    manifest_path = ROOT / "lib/warm-images.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    OUT.mkdir(parents=True, exist_ok=True)
    for p in products:
        src = p.get("image") or ""
        if only and p["slug"] not in only:
            continue
        f = ROOT / "public" / src.lstrip("/")
        if not f.exists() or f.suffix.lower() != ".png":
            continue
        out = OUT / (f.stem + ".webp")
        box = warm(f, out)
        manifest[src] = "/" + str(out.relative_to(ROOT / "public"))
        print(p["slug"], "frame", box, "->", out.name)
    manifest_path.write_text(json.dumps(dict(sorted(manifest.items())), indent=2) + "\n")


if __name__ == "__main__":
    main()
