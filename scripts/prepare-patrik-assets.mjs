// Deterministic studio previews from Patrik Wennerlund's private, unchanged TIFFs.
// Adapted from prepare-markus-assets.mjs. Artwork is fitted whole inside white paper
// whose ratio equals the photograph's (margins proportional), never cropped or stretched.
// No text or credit is drawn on any print (Mark, 29 Sep 2026).
// Usage: node scripts/prepare-patrik-assets.mjs <source dir with the TIFFs> <private pack dir>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const [source, pack] = process.argv.slice(2);
if (!source || !pack) throw Error('Supply the TIFF directory and a private pack directory.');
const manifest = JSON.parse(fs.readFileSync('scripts/artists/patrik-wennerlund-review.json', 'utf8'));
const out = path.resolve('public/images/products');
const artDir = path.resolve('public/images/artworks');
fs.mkdirSync(artDir, { recursive: true });
fs.mkdirSync(pack, { recursive: true });

const templatePortrait = await sharp('scripts/assets/frame-template.png').png().toBuffer();
const templateLandscape = await sharp(templatePortrait).rotate(90).png().toBuffer();
const PAPER_SHORT_PX = 775;
const VERSION = '2026-10-02';

async function frameFor(paper, width, height, landscape) {
  const base = landscape ? templateLandscape : templatePortrait;
  const tm = await sharp(base).metadata();
  const start = landscape ? 112 : 113;
  const end = start + 1106;
  const longLength = landscape ? width : height;
  const first = await sharp(base).extract(landscape
    ? { left: 0, top: 0, width: start, height: tm.height }
    : { left: 0, top: 0, width: tm.width, height: start }).png().toBuffer();
  const middle = await sharp(base).extract(landscape
    ? { left: start, top: 0, width: 1106, height: tm.height }
    : { left: 0, top: start, width: tm.width, height: 1106 })
    .resize(landscape ? { width: longLength, height: tm.height } : { width: tm.width, height: longLength })
    .png().toBuffer();
  const last = await sharp(base).extract(landscape
    ? { left: end, top: 0, width: tm.width - end, height: tm.height }
    : { left: 0, top: end, width: tm.width, height: tm.height - end }).png().toBuffer();
  const framedWidth = landscape ? start + width + tm.width - end : tm.width;
  const framedHeight = landscape ? tm.height : start + height + tm.height - end;
  return sharp({ create: { width: framedWidth, height: framedHeight, channels: 3, background: '#f3f3f3' } })
    .composite([
      { input: first, left: 0, top: 0 },
      { input: middle, left: landscape ? start : 0, top: landscape ? 0 : start },
      { input: last, left: landscape ? start + width : 0, top: landscape ? 0 : start + height },
      { input: paper, left: landscape ? start : 111, top: landscape ? 111 : start },
    ]).png().toBuffer();
}

const records = [];
for (const p of manifest.prints) {
  const input = path.join(source, p.file);
  const [wCm, hCm] = p.paper;
  const landscape = wCm > hCm;
  const image = sharp(input, { unlimited: true, limitInputPixels: false }).rotate().toColourspace('srgb');
  const metadata = await image.metadata();
  const width = landscape ? Math.round(PAPER_SHORT_PX * wCm / hCm) : PAPER_SHORT_PX;
  const height = landscape ? PAPER_SHORT_PX : Math.round(PAPER_SHORT_PX * hCm / wCm);
  const marginX = Math.round(width * p.margin);
  const marginY = Math.round(height * p.margin);
  const artwork = await image.clone().resize(width - 2 * marginX, height - 2 * marginY, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const paper = await sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
    .composite([{ input: artwork, left: marginX, top: marginY }]).png().toBuffer();
  const frame = await frameFor(paper, width, height, landscape);
  const framed = await sharp(frame).resize({ width: 1168, height: 1700, fit: 'inside' }).png().toBuffer();
  const fm = await sharp(framed).metadata();
  const imageName = `${p.slug}-paper-${p.size.replace('cm', '')}-${VERSION}.png`;
  await sharp({ create: { width: 1640, height: 2048, channels: 3, background: '#f3f3f3' } })
    .composite([{ input: framed, left: Math.round((1640 - fm.width) / 2), top: Math.round((2048 - fm.height) / 2) }])
    .png({ compressionLevel: 9 }).toFile(path.join(out, imageName));
  await image.clone().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
    .avif({ quality: 85 }).toFile(path.join(artDir, p.slug + '.avif'));
  const innerCmW = wCm * (1 - 2 * p.margin), innerCmH = hCm * (1 - 2 * p.margin);
  records.push({ slug: p.slug, sourceFile: p.file, sourceWidth: metadata.width, sourceHeight: metadata.height,
    paperCm: [wCm, hCm], artworkOnPaperCm: [+innerCmW.toFixed(1), +innerCmH.toFixed(1)],
    effectiveDpi: Math.round(Math.min(metadata.width / (innerCmW / 2.54), metadata.height / (innerCmH / 2.54))),
    sha256: createHash('sha256').update(fs.readFileSync(input)).digest('hex'),
    image: `/images/products/${imageName}`, sourceImage: `/images/artworks/${p.slug}.avif` });
  console.log(p.slug, `${metadata.width}x${metadata.height}`, `${width}x${height}`, imageName);
}
fs.writeFileSync(path.join(pack, 'asset-inventory.json'), JSON.stringify(records, null, 2) + '\n');
