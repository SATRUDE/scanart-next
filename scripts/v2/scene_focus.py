#!/usr/bin/env python3
"""Where the print sits in each room scene, so every crop keeps the art in view.

Mark's rule (2026-09-26): wherever a room scene is cropped (the homepage hero,
New prints, hover mockups, any tile), the whole print must stay in view.
Cropping is object-fit: cover, so each scene needs a focal point: the centre of
its print, and the print's box for checking.

This finds the print by matching the product's own artwork (cropped from its
standard shot) against the scene at many scales (normalised cross-correlation
on greyscale copies, OpenCV's matchTemplate), then refines at a finer step. Output:
lib/scene-focus.json  { "/images/products/x-room.avif": { "x": 52.1, "y": 24.8,
"w": 31.0, "h": 38.5, "score": 0.83 } }  (percent of the scene's width/height).

    python3 scripts/v2/scene_focus.py          # every scene the shop uses
    python3 scripts/v2/scene_focus.py dragon   # one product's scenes

Deterministic; nothing is generated. Run it when a scene is added or changed
(lib/scene-focus.test.ts fails until you do).
"""
import json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / "public"
OUT = ROOT / "lib/scene-focus.json"


def artwork(path: Path) -> Image.Image:
    """The framed print out of its studio shot: the box of pixels unlike the backdrop."""
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    bg = a[4, 4]
    diff = np.abs(a - bg).max(axis=2) > 28
    rows = np.where(diff.mean(axis=1) > 0.02)[0]
    cols = np.where(diff.mean(axis=0) > 0.02)[0]
    box = im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))
    # Match on the artwork inside the frame and mount: scenes often frame the
    # print differently from the studio shot, and the art is what must show.
    w, h = box.size
    m = 0.14
    return box.crop((round(w * m), round(h * m), round(w * (1 - m)), round(h * (1 - m))))


def ncc_best(scene: np.ndarray, tmpl: np.ndarray):
    th, tw = tmpl.shape
    if th >= scene.shape[0] or tw >= scene.shape[1]:
        return -1, 0, 0
    c = cv2.matchTemplate(scene, tmpl, cv2.TM_CCOEFF_NORMED)
    _, score, _, (x, y) = cv2.minMaxLoc(c)
    return float(score), int(y), int(x)


def locate(scene_path: Path, art: Image.Image):
    sc = Image.open(scene_path).convert("L")
    W, H = sc.size
    base = 480  # working width
    k = base / W
    s = np.asarray(sc.resize((base, round(H * k)), Image.BILINEAR)).astype(np.float32)
    ar = art.height / art.width
    best = (-1, 0, 0, 0, 0)
    for frac in np.linspace(0.08, 0.70, 63):
        tw = max(8, round(base * frac)); th = max(8, round(tw * ar))
        t = np.asarray(art.convert("L").resize((tw, th), Image.BILINEAR)).astype(np.float32)
        sc_, y, x = ncc_best(s, t)
        if sc_ > best[0]:
            best = (sc_, x, y, tw, th)
    score, x, y, tw, th = best
    return {"x": round((x + tw / 2) / base * 100, 1), "y": round((y + th / 2) / s.shape[0] * 100, 1),
            "w": round(tw / base * 100, 1), "h": round(th / s.shape[0] * 100, 1), "score": round(score, 3)}


def scenes_in_use():
    """(scene src, product slug) for every room scene the shop shows."""
    products = json.loads((PUB / "notion-data/products.json").read_text())
    by_slug = {p["slug"]: p for p in products if p.get("published")}
    pairs = set()
    for slug, p in by_slug.items():
        if p.get("secondaryImage"):
            pairs.add((p["secondaryImage"], slug))
    shop = (ROOT / "lib/shop-scenes.ts").read_text()
    fresh = re.findall(r"^\s*'?([a-z0-9-]+)'?:\s*scene\(", shop, re.M)
    for slug in fresh:
        for flag in ("chatgpt-", ""):
            src = f"/images/products/{slug}-room-{flag}2026-09-23.avif"
            if (PUB / src.lstrip("/")).exists() and slug in by_slug:
                pairs.add((src, slug))
    for slug, src in re.findall(r"^\s*'?([a-z0-9-]+)'?:\s*\{\s*image:\s*'([^']+)'", shop, re.M):
        if slug in by_slug:
            pairs.add((src, slug))
    home = (ROOT / "lib/home.ts").read_text()
    for slug, src in re.findall(r"^\s*([a-z0-9-]+):\s*'(/images/homepage/[^']+)'", home, re.M):
        if slug in by_slug:
            pairs.add((src, slug))
    return sorted(pairs), by_slug


# Checked by eye on the contact sheet (2026-09-26) where the matcher lost the
# print: it matched the bedside table in Morgenlevering, and landed between the
# pair in the Tree Top Peach kitchen (it is the pink print on the right).
OVERRIDES = {
    "/images/homepage/morgenlevering-scene.jpg": {"x": 55.0, "y": 31.0, "w": 19.5, "h": 24.5},
    "/images/products/Morgenlevering-scene.avif": {"x": 55.0, "y": 31.0, "w": 19.5, "h": 24.5},
    "/images/products/tree-top-peach-room-chatgpt-2026-09-23.avif": {"x": 70.5, "y": 20.0, "w": 19.5, "h": 23.0},
}


def main():
    only = set(sys.argv[1:])
    pairs, by_slug = scenes_in_use()
    out = json.loads(OUT.read_text()) if OUT.exists() else {}
    for src, slug in pairs:
        if only and slug not in only:
            continue
        f = PUB / src.lstrip("/")
        std = PUB / by_slug[slug]["image"].lstrip("/")
        if not f.exists() or not std.exists():
            print("missing", src); continue
        r = locate(f, artwork(std))
        if src in OVERRIDES:
            r = {**OVERRIDES[src], "score": "manual"}
        with Image.open(f) as im:
            r["ar"] = round(im.width / im.height, 4)
        out[src] = r
        flag = "" if r["score"] == "manual" or r["score"] >= 0.5 else "   <-- low confidence, check by eye"
        print(flush=True, *[f"{slug:26} {src.split('/')[-1]:48} {r}{flag}"])
    OUT.write_text(json.dumps(dict(sorted(out.items())), indent=2) + "\n")


if __name__ == "__main__":
    main()
