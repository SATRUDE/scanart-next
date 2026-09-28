// Adapted from Ishtar's review asset preparation. Originals stay outside Git.
// Artwork is fitted whole, never cropped or stretched. These are studio shots,
// not generated rooms. Usage: node scripts/prepare-markus-assets.mjs <source> <private pack>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
const [source, pack] = process.argv.slice(2);
if (!source || !pack) throw Error('Supply the originals directory and private pack.');
const manifest = JSON.parse(fs.readFileSync('scripts/artists/markus-naarttijarvi-review.json', 'utf8'));
const out = path.resolve('public/images/products');
const artDir = path.resolve('public/images/artworks');
fs.mkdirSync(artDir, { recursive: true });
fs.mkdirSync(pack, { recursive: true });
const inputs = manifest.prints.map(p => [p.slug, path.join(source, `Naarttijärvi-scandinavianart-${p.number}.jpg`)]);
const template = 'scripts/assets/frame-template.png';
const tm = await sharp(template).metadata();
const top = await sharp(template).extract({ left: 0, top: 0, width: tm.width, height: 113 }).png().toBuffer();
const bottom = await sharp(template).extract({ left: 0, top: 1219, width: tm.width, height: tm.height - 1219 }).png().toBuffer();
const records = [];
const formats = Object.fromEntries(manifest.prints.map(p => [p.slug, {widthCm: p.number >= 6 && p.number <= 9 ? 70 : 50, heightCm: p.number >= 6 && p.number <= 9 ? 50 : 70}]));
const paperDir = path.join(pack, 'paper-previews');
fs.mkdirSync(paperDir, { recursive: true });
for (const [slug, input] of inputs) {
  const image = sharp(input, { unlimited: true, limitInputPixels: false }).rotate().toColourspace('srgb');
  const metadata = await image.metadata();
  const width = 775;
  const format = formats[slug];
  const height = Math.round(width * format.heightCm / format.widthCm);
  // Fit the entire supplied image on the proposed paper without cropping.
  const artwork = await image.clone().resize(width, height, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  await image.clone().resize(1800, Math.round(1800 * format.heightCm / format.widthCm), { fit: 'contain', background: '#ffffff' }).png().toFile(path.join(paperDir, slug + '.png'));
  const rails = await sharp(template).extract({ left: 0, top: 113, width: tm.width, height: 1106 }).resize(tm.width, height).png().toBuffer();
  const frame = await sharp({ create: { width: tm.width, height: 113 + height + tm.height - 1219, channels: 3, background: '#f3f3f3' } }).composite([
    { input: top, left: 0, top: 0 },
    { input: rails, left: 0, top: 113 },
    { input: bottom, left: 0, top: 113 + height },
    { input: artwork, left: 111, top: 113 },
  ]).png().toBuffer();
  const framed = await sharp(frame).resize({ width: 1168, height: 1700, fit: 'inside' }).png().toBuffer();
  const fm = await sharp(framed).metadata();
  await sharp({ create: { width: 1640, height: 2048, channels: 3, background: '#f3f3f3' } }).composite([{ input: framed, left: Math.round((1640 - fm.width) / 2), top: Math.round((2048 - fm.height) / 2) }]).png({ compressionLevel: 9 }).toFile(path.join(out, slug + '.png'));
  await image.clone().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true }).avif({ quality: 85 }).toFile(path.join(artDir, slug + '.avif'));
  records.push({ slug, sourceFile: path.basename(input), sourceWidth: metadata.width, sourceHeight: metadata.height, proposedFormat: format, effectiveDpi: Math.round(Math.max(metadata.width / (format.widthCm / 2.54), metadata.height / (format.heightCm / 2.54))), sha256: createHash('sha256').update(fs.readFileSync(input)).digest('hex'), image: `/images/products/${slug}.png`, sourceImage: `/images/artworks/${slug}.avif` });
  await image.clone().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 95 }).toFile(path.join(pack, slug + '.jpg'));
  console.log(slug, metadata.width + 'x' + metadata.height);
}
fs.writeFileSync(path.join(pack, 'asset-inventory.json'), JSON.stringify(records, null, 2) + '\n');
