#!/usr/bin/env python3
"""The 404's "Fill the frame" states: each print hung in the empty frame.

The artwork (the flat crop the wall tool uses, public/images/v2/wall/prints)
fills the whole glass opening edge to edge: cover-cropped to the opening's
shape, warped onto its four corners (the frame hangs in slight perspective),
and lit by the empty glass's own shading so the window light and reflection
sit over it. Deterministic; nothing is generated.

    python3 scripts/v2/frame_404.py dancer dragon hyttefrokost
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "public/images/v2/not-found"
EMPTY = DIR / "empty-frame.webp"
# The glass opening's corners (TL, TR, BR, BL) on the 1122 x 1402 image. The
# frame hangs in slight perspective (its right side is nearer, so taller), so
# the print is warped onto this quad rather than pasted as a rectangle. Found
# by fitting a line to each edge where the warm moulding begins (red minus
# blue above 40), so the print tucks under the moulding's pale inner lip
# and no glass shows beside it.
QUAD = [(609.9, 65.8), (936.3, 45.3), (938.2, 545.9), (611.6, 530.2)]
SS = 4  # supersampling for the quad's edge


def _coeffs(src, dst):
    """PIL PERSPECTIVE coefficients mapping output points dst -> input points src."""
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        B += [u, v]
    return np.linalg.solve(np.array(A, float), np.array(B, float)).tolist()


def hang(slug: str) -> Path:
    room = Image.open(EMPTY).convert("RGB")
    W, H = room.size
    xs = [p[0] for p in QUAD]; ys = [p[1] for p in QUAD]
    # The opening's shape, from the average side lengths.
    ow = ((QUAD[1][0] - QUAD[0][0]) + (QUAD[2][0] - QUAD[3][0])) / 2
    oh = ((QUAD[3][1] - QUAD[0][1]) + (QUAD[2][1] - QUAD[1][1])) / 2
    art = Image.open(ROOT / f"public/images/v2/wall/prints/{slug}.jpg").convert("RGB")
    ar, tr = art.width / art.height, ow / oh
    if ar > tr:
        nw = round(art.height * tr); x = (art.width - nw) // 2
        art = art.crop((x, 0, x + nw, art.height))
    else:
        nh = round(art.width / tr); y = (art.height - nh) // 2
        art = art.crop((0, y, art.width, y + nh))
    aw, ah = art.size
    # Warp the artwork onto the quad, at SS x for a clean edge.
    big = [(x * SS, y * SS) for x, y in QUAD]
    warped = art.transform((W * SS, H * SS), Image.PERSPECTIVE,
                           _coeffs([(0, 0), (aw, 0), (aw, ah), (0, ah)], big), Image.BICUBIC)
    mask = Image.new("L", (W * SS, H * SS), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).polygon(big, fill=255)
    warped = warped.resize((W, H), Image.LANCZOS)
    mask = mask.resize((W, H), Image.LANCZOS)
    # Light it with the empty glass's own shading (window light, reflection).
    g = np.asarray(room.convert("L").filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
    inside = np.asarray(mask) > 250
    shade = np.clip(g / np.median(g[inside]), 0.8, 1.15)[..., None]
    a = np.asarray(warped).astype(np.float32) / 255
    lit = a * np.minimum(shade, 1.0)
    glow = np.clip(shade - 1.0, 0, None) * 2.2
    lit = 1 - (1 - lit) * (1 - glow)
    base = np.asarray(room).astype(np.float32) / 255
    m = (np.asarray(mask).astype(np.float32) / 255)[..., None]
    out = base * (1 - m) + lit * m
    dest = DIR / f"fill-{slug}.webp"
    Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8)).save(dest, quality=88, method=6)
    return dest


if __name__ == "__main__":
    for s in sys.argv[1:] or ["dancer", "dragon", "hyttefrokost"]:
        print(hang(s))
