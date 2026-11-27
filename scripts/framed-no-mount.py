#!/usr/bin/env python3
"""Rebuild every framed product shot without a white mount, with the frame's lip modelled.

What the buyer gets from Gelato (framed_poster_..._wood_w12xt22-mm_plexiglass_...) has no
passepartout: the print runs right up to the oak frame, and the frame's lip covers about 5 mm of
each edge. Several of the shop's shots showed a white band between the frame and the artwork
instead, added by the scripts that made them (scripts/patrik-framed.py and emma-framed.py's
3.33% border, prepare-markus-assets.mjs's 1.2-2 cm paper margin, and the uncommitted script that
made Åsa Törnquist's shots). Åsa Törnquist spotted it, 27 Nov 2026.

This keeps each existing shot exactly as it is, frame, shadow, canvas, size, name and format,
and replaces only what shows inside the frame's opening:

  - a print whose shot had a white band ADDED is re-rendered from its print file in Drive
    (`<print files>/<Artist>/<file>`, the masters Gelato prints from, see their README), filling
    the paper edge to edge (cover fit, never stretched);
  - a print with no master in Drive but an added band (three of Markus Naarttijärvi's) has the
    band cut off the existing shot, so the photograph fills the paper;
  - every other print already ran to the frame: its shot's own artwork is used as it is.

Then, for all of them, 5 mm of the paper is taken off each edge (the lip), at the paper size the
print sells in (the first of its sizes), and what is left is fitted to the opening. White that is
part of the artwork itself (Hummer og Vin's border, Mikko Saarainen's white grounds) is printed by
Gelato, so it stays.

    python3 scripts/framed-no-mount.py "<Drive>/Scandinavian Art/Print files"            # every shot
    python3 scripts/framed-no-mount.py "<print files>" kopia storm                       # some
    python3 scripts/v2/warm_backdrops.py --files <the PNGs>                              # then the warm copies

It overwrites the PNGs in public/images/products and is safe to run once per shot only on the
ORIGINAL shots (a second run would take the lip off twice); --check prints what it would do.
"""
import io
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageCms

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[1]
LIP_MM = 5.0
A_SIZES = {'A3': (297, 420), 'A2': (420, 594), 'A1': (594, 841)}

# Shots whose white band was added by the script that made them, and the print file that replaces
# the inside. Keyed by the shot's file name. Paths are relative to the Drive "Print files" folder.
MASTERS = {
    # Patrik Wennerlund (scripts/patrik-framed.py, 3.33% border)
    'in-to-the-woods-ii-paper-40x60-2026-10-02-v2.png': 'Patrik Wennerlund/In to the woods II.tif',
    'storm-paper-40x60-2026-10-02-v2.png': 'Patrik Wennerlund/Storm.tif',
    'tjurpannan-bathus-paper-40x50-2026-10-02-v2.png': 'Patrik Wennerlund/Tjurpannan Båthus.tif',
    'wake-up-paper-40x60-2026-10-02-v2.png': 'Patrik Wennerlund/Wake up.tif',
    'moody-19-the-crow-paper-45x60-2026-10-02-v2.png': 'Patrik Wennerlund/Moody 19 - The Crow.tif',
    # Markus Naarttijärvi (scripts/prepare-markus-assets.mjs, 1.2-2 cm paper margin)
    'pines-under-starlight-paper-45x60-2026-09-28.png': 'Markus Naarttijärvi/Pines Under Starlight.jpg',
    'current-and-foam-paper-45x60-2026-09-28.png': 'Markus Naarttijärvi/Frozen currents.jpg',
    'the-road-at-sunset-paper-45x60-2026-09-28.png': 'Markus Naarttijärvi/The Road at Sunset.jpg',
    'sun-over-the-forest-paper-45x60-2026-09-28.png': 'Markus Naarttijärvi/Sun Over the Forest.jpg',
    'morning-cabin-room-paper-45x60-2026-09-28.png': 'Markus Naarttijärvi/Morning, Cabin Room.jpg',
    'path-through-the-trees-paper-40x50-2026-09-28.png': 'Markus Naarttijärvi/Path Through the Trees.jpg',
    'sheep-on-the-track-paper-40x50-2026-09-28.png': 'Markus Naarttijärvi/Sheep on the Track.jpg',
    # Emma Iben (scripts/emma-framed.py, 3.33% border on this one)
    'good-conversation-paper-a-ratio-2026-10-04.png': 'Emma Iben/Good conversation.png',
    # Åsa Törnquist (T-0592, PR #301)
    'democracy-paper-50x70-2026-11-26.png': 'Åsa Törnquist/Folkstyre 50x70.tiff',
    'texting-you-paper-50x70-2026-11-26.png': 'Åsa Törnquist/Texting you 50x70.tiff',
    'kopia-paper-50x70-2026-11-26.png': 'Åsa Törnquist/Kopia 50x70.tiff',
    'kopia-landscape-paper-70x50-2026-11-26.png': 'Åsa Törnquist/Kopia 70x50.tiff',
}
# Added band, no master in Drive (README "Gaps"): cut the band off the existing shot.
TRIM_BAND = {
    'through-the-willows-paper-45x60-2026-09-28.png',
    'winter-yard-night-paper-45x60-2026-09-28.png',
    'swan-on-still-water-paper-40x50-2026-09-28.png',
}


def oak(px):
    r, g, b = (px[..., i].astype(int) for i in range(3))
    return (r >= 130) & (r <= 240) & (r > g) & (g > b) & (r - b >= 35) & (r - b <= 105) & (g - b >= 12) & (g - b <= 55)


def opening(a):
    """The frame's opening (x0, y0, x1, y1), measured: the oak rail's run in from each side."""
    h, w, _ = a.shape
    found = {}
    for side in 'ltrb':
        if side in 'lr':
            lines = [a[y, :] if side == 'l' else a[y, ::-1] for y in range(int(h * .3), int(h * .7), 3)]
        else:
            lines = [a[:, x] if side == 't' else a[::-1, x] for x in range(int(w * .3), int(w * .7), 3)]
        outer, run = [], []
        for line in lines:
            ok = oak(line[None])[0]
            o = int(np.argmax(ok))
            inner = np.where(~ok[o + 3:o + 120])[0]
            outer.append(o)
            run.append(3 + int(inner[0]) if len(inner) else 120)
        found[side] = [int(np.median(outer)), int(np.median(run))]
    # Artwork next to the rail can read as oak and lengthen a run: opposite rails match to a pixel or two.
    for a_, b_ in (('l', 'r'), ('t', 'b')):
        if abs(found[a_][1] - found[b_][1]) > 2:
            m = min(found[a_][1], found[b_][1])
            found[a_][1] = min(found[a_][1], m + 1)
            found[b_][1] = min(found[b_][1], m + 1)
    for s, (o, r) in found.items():
        assert 8 <= r <= 40 and o > 50, (s, o, r)
    return (found['l'][0] + found['l'][1], found['t'][0] + found['t'][1],
            w - found['r'][0] - found['r'][1], h - found['b'][0] - found['b'][1])


def paper_mm(size, landscape):
    m = re.fullmatch(r'(\d+)x(\d+)cm', size)
    w, h = (int(m[1]) * 10, int(m[2]) * 10) if m else A_SIZES[size]
    w, h = min(w, h), max(w, h)
    return (h, w) if landscape else (w, h)


def load_master(path):
    im = Image.open(path)
    icc = im.info.get('icc_profile')
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        white = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(white, im)
    im = im.convert('RGB')
    if max(im.size) > 6000:
        im = im.reduce(max(1, max(im.size) // 4000))
    if icc:
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        im = ImageCms.profileToProfile(im, src, ImageCms.createProfile('sRGB'), renderingIntent=1, outputMode='RGB')
    return im


def cover(im, ratio):
    """The centred crop of im at the given width/height ratio (the paper's), nothing stretched."""
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        return im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = round(w / ratio)
    return im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))


def non_white_box(im):
    # The opening's outermost pixels can carry the rail's edge; they are not artwork.
    e = 3
    a = np.asarray(im.convert('RGB')).astype(int)[e:-e, e:-e]
    ink = a.min(2) < 235
    rows = np.where(ink.mean(1) > 0.2)[0]
    cols = np.where(ink.mean(0) > 0.2)[0]
    return im.crop((cols[0] + e, rows[0] + e, cols[-1] + 1 + e, rows[-1] + 1 + e))


def rebuild(shot, size, prints_dir, check=False):
    src = Image.open(shot)
    mode = src.mode
    a = np.asarray(src.convert('RGB'))
    x0, y0, x1, y1 = opening(a)
    ow, oh = x1 - x0, y1 - y0
    pw, ph = paper_mm(size, ow > oh)
    name = shot.name
    if name in MASTERS:
        art = load_master(prints_dir / MASTERS[name])
        how = 'master'
        off = abs(art.width / art.height - pw / ph) / (pw / ph)
        if off > 0.02:
            print(f'  ! {name}: print file is {art.width}x{art.height}, {off:.0%} off the {pw}x{ph} mm paper; cropped to fill')
        art = cover(art, pw / ph)
    else:
        art = src.convert('RGB').crop((x0, y0, x1, y1))
        how = 'shot'
        if name in TRIM_BAND:
            art = cover(non_white_box(art), pw / ph)
            how = 'shot, band cut off'
    # The lip: LIP_MM off every edge of the paper.
    lx, ly = art.width * LIP_MM / pw, art.height * LIP_MM / ph
    art = art.resize((ow, oh), Image.LANCZOS, box=(lx, ly, art.width - lx, art.height - ly))
    print(f'{name}: {how}, opening {ow}x{oh} at ({x0},{y0}), paper {pw}x{ph} mm, lip {LIP_MM:g} mm')
    if check:
        return
    out = src.copy()
    if mode == 'RGBA':
        art = art.convert('RGBA')
    else:
        art = art.convert(mode)
    out.paste(art, (x0, y0))
    out.save(shot, optimize=True)


def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    check = '--check' in sys.argv
    if not args:
        sys.exit(__doc__)
    prints_dir, only = Path(args[0]), set(args[1:])
    products = json.loads((ROOT / 'public/notion-data/products.json').read_text())
    shots = {}
    for p in products:
        if only and p['slug'] not in only:
            continue
        size = p['availableSizes'][0]
        for img in [p.get('image')] + [o.get('image') for o in p.get('orientations', [])]:
            if img and img.endswith('.png'):
                shots[img] = size
    for img, size in shots.items():
        rebuild(ROOT / 'public' / img.lstrip('/'), size, prints_dir, check)


if __name__ == '__main__':
    main()
