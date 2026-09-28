// Deterministic studio previews from Markus's private, unchanged originals.
// Artwork is fitted whole inside white paper, never cropped or stretched.
// Usage: node scripts/prepare-markus-assets.mjs <source> <private pack>
//        node scripts/prepare-markus-assets.mjs <source> --product-previews-only
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const [source, pack] = process.argv.slice(2);
const productOnly = pack === '--product-previews-only';
if (!source || !pack) throw Error('Supply the originals directory and private pack, or --product-previews-only.');

const manifest = JSON.parse(fs.readFileSync('scripts/artists/markus-naarttijarvi-review.json', 'utf8'));
const out = path.resolve('public/images/products');
const artDir = path.resolve('public/images/artworks');
if (!productOnly) {
  fs.mkdirSync(artDir, { recursive: true });
  fs.mkdirSync(pack, { recursive: true });
}

const template = 'scripts/assets/frame-template.png';
const templatePortrait = await sharp(template).png().toBuffer();
const templateLandscape = await sharp(templatePortrait).rotate(90).png().toBuffer();
const PAPER_SHORT_PX = 775;
const VERSION = '2026-09-28';
const portrait45x60 = { widthCm: 45, heightCm: 60, marginXcm: 1.5, marginYcm: 2 };
const landscape45x60 = { widthCm: 60, heightCm: 45, marginXcm: 2, marginYcm: 1.5 };
const portrait40x50 = { widthCm: 40, heightCm: 50, marginXcm: 1.2, marginYcm: 1.5 };
const landscape40x50 = { widthCm: 50, heightCm: 40, marginXcm: 1.5, marginYcm: 1.2 };

function formatFor(number) {
  if (number === 7 || number === 9) return landscape40x50;
  if (number === 10) return portrait40x50;
  if (number === 6 || number === 8) return landscape45x60;
  return portrait45x60;
}

async function frameFor(paper, width, height, landscape) {
  const base = landscape ? templateLandscape : templatePortrait;
  const tm = await sharp(base).metadata();
  // Portrait opening: 775 × 1106 at (111,113). Rotated, its 1106 × 775
  // opening starts at (112,111). Stretch only the straight rails along the
  // paper's long axis; corners and oak frame width retain their pixels.
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
  const slug = p.slug;
  const input = path.join(source, `Naarttijärvi-scandinavianart-${p.number}.jpg`);
  const format = formatFor(p.number);
  const landscape = format.widthCm > format.heightCm;
  const image = sharp(input, { unlimited: true, limitInputPixels: false }).rotate().toColourspace('srgb');
  const metadata = await image.metadata();
  const width = landscape ? Math.round(PAPER_SHORT_PX * format.widthCm / format.heightCm) : PAPER_SHORT_PX;
  const height = landscape ? PAPER_SHORT_PX : Math.round(PAPER_SHORT_PX * format.heightCm / format.widthCm);
  const marginX = Math.round(width * format.marginXcm / format.widthCm);
  const marginY = Math.round(height * format.marginYcm / format.heightCm);
  const innerWidth = width - 2 * marginX;
  const innerHeight = height - 2 * marginY;
  const artwork = await image.clone().resize(innerWidth, innerHeight, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const paper = await sharp({ create: { width, height, channels: 3, background: '#ffffff' } })
    .composite([{ input: artwork, left: marginX, top: marginY }]).png().toBuffer();
  const frame = await frameFor(paper, width, height, landscape);
  const framed = await sharp(frame).resize({ width: 1168, height: 1700, fit: 'inside' }).png().toBuffer();
  const fm = await sharp(framed).metadata();
  const sizeKey = p.number === 7 || p.number === 9 || p.number === 10 ? '40x50' : '45x60';
  const imageName = `${slug}-paper-${sizeKey}-${VERSION}.png`;
  await sharp({ create: { width: 1640, height: 2048, channels: 3, background: '#f3f3f3' } })
    .composite([{ input: framed, left: Math.round((1640 - fm.width) / 2), top: Math.round((2048 - fm.height) / 2) }])
    .png({ compressionLevel: 9 }).toFile(path.join(out, imageName));

  if (!productOnly) {
    const paperDir = path.join(pack, 'paper-previews');
    fs.mkdirSync(paperDir, { recursive: true });
    await sharp(paper).resize({ width: 1800 }).png().toFile(path.join(paperDir, slug + '.png'));
    await image.clone().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
      .avif({ quality: 85 }).toFile(path.join(artDir, slug + '.avif'));
    await image.clone().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 95 }).toFile(path.join(pack, slug + '.jpg'));
    records.push({ slug, sourceFile: path.basename(input), sourceWidth: metadata.width, sourceHeight: metadata.height,
      proposedFormat: { widthCm: format.widthCm, heightCm: format.heightCm },
      marginCm: { horizontal: format.marginXcm, vertical: format.marginYcm },
      effectiveDpi: Math.round(Math.max(metadata.width / ((format.widthCm - 2 * format.marginXcm) / 2.54), metadata.height / ((format.heightCm - 2 * format.marginYcm) / 2.54))),
      sha256: createHash('sha256').update(fs.readFileSync(input)).digest('hex'), image: `/images/products/${imageName}`,
      sourceImage: `/images/artworks/${slug}.avif` });
  }
  console.log(slug, `${metadata.width}x${metadata.height}`, `${width}x${height}`, imageName);
}
if (!productOnly) fs.writeFileSync(path.join(pack, 'asset-inventory.json'), JSON.stringify(records, null, 2) + '\n');
