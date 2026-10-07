"""Plain framed product shots for Emma Iben (4 Oct 2026), the script written for Patrik Wennerlund, adapted: built the way the live catalogue's are
(scanart-next scripts/add-artist.mjs): the shop's oak frame template from the SA Figma file
(scripts/assets/frame-template.png, opening 775 x 1106 at (111,113)), artwork in the opening,
frame scaled into a 1640 x 2048 #f3f3f3 canvas. For the non-5:7 formats the template is
re-proportioned by SPLICING its straight rail bands along their own length only (as the live
square template was made), never by scaling them across, so corners, mitres, rail width and grain
scale stay exactly as on the live shots and the shadow stays bottom-right (no rotation).
Usage: python3 scripts/emma-framed.py <master dir> <out dir>   (master dir: ~/Desktop/Emma-Iben-files/Material for Scandinavian Art)
No cover-fit resize anywhere: the artwork is contain-fitted, uncropped, inside the paper opening."""
import sys, os, json, numpy as np
from PIL import Image, ImageCms
Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
T = np.asarray(Image.open(os.path.join(HERE, 'assets', 'frame-template.png')).convert('RGB')).astype(np.float32)
OX0, OY0, OW, OH = 111, 113, 775, 1106          # template opening
K = 150                                           # untouched band beyond each corner
FADE = 120

def splice(a, axis, lo, hi, new_len):
    """Resize the straight band a[lo:hi] along its own length only. Both ends of the band stay
    pixel-continuous with the untouched corners; the single join sits mid-rail and is crossfaded."""
    a = np.moveaxis(a, axis, 0)
    head, mid, tail = a[:lo], a[lo:hi], a[hi:]
    n = mid.shape[0]
    if new_len == n:
        out = mid
    else:
        f = int(min(FADE, 2 * n - new_len)); assert f >= 40, f
        p = (new_len + f) // 2; q = new_len + f - p
        L, R = mid[:p], mid[n - q:]
        w = np.linspace(0, 1, f)[:, None, None]
        out = np.concatenate([L[:-f], L[-f:] * (1 - w) + R[:f] * w, R[f:]], 0)
        assert out.shape[0] == new_len, (out.shape, new_len)
    return np.moveaxis(np.concatenate([head, out, tail], 0), 0, axis)

def frame(open_w, open_h):
    a = splice(T, 0, OY0 + K, OY0 + OH - K, open_h - 2 * K)
    a = splice(a, 1, OX0 + K, OX0 + OW - K, open_w - 2 * K)
    return a

def load_srgb(path, long_side):
    im = Image.open(path)
    icc = im.info.get('icc_profile')
    im = im.convert('RGB')
    f = max(im.size) / long_side
    if f > 1:
        im = im.reduce(max(1, int(f // 1.5))) if f > 3 else im
        im = im.resize((round(im.width * long_side / max(im.size)), round(im.height * long_side / max(im.size))), Image.LANCZOS)
    if icc:
        src = ImageCms.ImageCmsProfile(__import__('io').BytesIO(icc))
        im = ImageCms.profileToProfile(im, src, ImageCms.createProfile('sRGB'), renderingIntent=1, outputMode='RGB')  # relative colorimetric
    return im

# Fitting in (6 Oct 2026): Emma's full-bleed Fitting_in_A1_bleed.png (7075 x 9993, A1 plus 2.5 mm bleed each side) replaces the old A1-A5
# set that carried white side bands. The bleed must be CROPPED to trim (29/30 px left/right, 30/30 top/bottom) before it is fitted.
# file (relative to the master dir), slug, paper cm (w,h), margin fraction (white border each side).
# Fitting in and Pressure arrive as finished A-sheets with their own white margin, so they get none
# added; Good conversation is full-bleed yellow and Precautions sits on white, both get the shop's
# 3.33% border. Precautions is 2354 px wide, so it is shown on A3 landscape only.
PRINTS = [
    ('Fitting_in_A1_bleed.png', 'fitting-in', (21.0, 29.7), 0.0, 'a-ratio'),   # crop bleed to trim first
    ('Precautions.png', 'precautions', (42.0, 29.7), 0.0333, 'a3-landscape'),
    ('Pressure_A1.png', 'pressure', (21.0, 29.7), 0.0, 'a-ratio'),
    ('Good_conversation_large.png', 'good-conversation', (21.0, 29.7), 0.0333, 'a-ratio'),
]
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True); os.makedirs(os.path.join(out, 'art'), exist_ok=True)
log = []
for fn, slug, (wc, hc), MARGIN, tag in PRINTS:
    short = 775
    ow, oh = (round(short * wc / hc), short) if wc > hc else (short, round(short * hc / wc))
    fr = frame(ow, oh)
    H, W = fr.shape[:2]
    s = min(1168 / W, 1700 / H)
    FW, FH = round(W * s), round(H * s)
    big = Image.fromarray(np.clip(fr, 0, 255).astype(np.uint8)).resize((FW, FH), Image.LANCZOS)
    x0, y0 = round(OX0 * s), round(OY0 * s); x1, y1 = round((OX0 + ow) * s), round((OY0 + oh) * s)
    pw, ph = x1 - x0, y1 - y0
    art = load_srgb(os.path.join(src, fn), 2400)
    art.save(os.path.join(out, 'art', slug + '-2400-srgb.png'))
    mx, my = round(pw * MARGIN), round(ph * MARGIN)
    iw, ih = pw - 2 * mx, ph - 2 * my
    r = min(iw / art.width, ih / art.height)
    aw, ah = round(art.width * r), round(art.height * r)
    paper = Image.new('RGB', (pw, ph), (255, 255, 255))
    paper.paste(art.resize((aw, ah), Image.LANCZOS), ((pw - aw) // 2, (ph - ah) // 2))
    big.paste(paper, (x0, y0))
    canvas = Image.new('RGB', (1640, 2048), (243, 243, 243))
    canvas.paste(big, ((1640 - FW) // 2, (2048 - FH) // 2))
    name = f'{slug}-paper-{tag}-2026-10-04.png'
    canvas.save(os.path.join(out, name), optimize=True)
    pxcm = pw / wc
    lm, tm = (pw - aw) // 2, (ph - ah) // 2
    rec = dict(slug=slug, file=name, paper_cm=[wc, hc], opening_px=[pw, ph], opening_ratio=round(pw / ph, 4), paper_ratio=round(wc / hc, 4),
               art_px=[aw, ah], art_ratio=round(aw / ah, 4), master_ratio=round(art.width / art.height, 4),
               margins_px=dict(left=lm, right=pw - aw - lm, top=tm, bottom=ph - ah - tm),
               margins_cm=dict(sides=round(lm / pxcm, 2), top_bottom=round(tm / pxcm, 2)), frame_px=[FW, FH])
    log.append(rec); print(json.dumps(rec))
json.dump(log, open(os.path.join(out, 'framed-measurements.json'), 'w'), indent=1)
