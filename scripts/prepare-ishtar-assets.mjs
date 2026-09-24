// Review assets only. Keeps original pixels/colour in the art; reuses the shop's
// oak-frame template without stretching the artwork into a different shape.
// Usage: node scripts/prepare-ishtar-assets.mjs <WeTransfer folder> <private pack>
// PDF extraction (Poppler) must already exist in <pack>/source/pdf-extracted.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
const [source, pack] = process.argv.slice(2);
if (!source || !pack) throw Error('Supply the WeTransfer folder and private pack path.');
const out = path.resolve('public/images/products');
const artDir = path.resolve('public/images/artworks');
fs.mkdirSync(artDir, { recursive: true });
const pdfDir = path.join(pack, 'source/pdf-extracted');
const native = path.join(source, 'Sthlm & FG');
const inputs = [
  ['stockholm', path.join(native, 'sthlm.tif')],
  ['frukt-och-gront', path.join(native, fs.readdirSync(native).find(f => f.endsWith('.jpg')))],
  ...Array.from({ length: 9 }, (_, i) => [`ishtar-selection-${String(i + 1).padStart(2, '0')}`, path.join(pdfDir, `page-${String(i).padStart(3, '0')}.${i === 1 ? 'png' : 'jpg'}`)]),
];
// Page 10 is a presentation sheet, not one triptych product. Crop only its
// three separate rectangular panels, retaining each panel's internal whitespace.
for (const [i, left, width] of [[1, 85, 1164], [2, 1317, 1164], [3, 2551, 1161]]) {
  const file = path.join(pdfDir, `surfer-${i}.png`);
  await sharp(path.join(pdfDir, 'page-009.jpg')).extract({ left, top: 117, width, height: 1646 }).png().toFile(file);
  inputs.push([`ishtar-surfer-0${i}`, file]);
}
const template = 'scripts/assets/frame-template.png';
const tm = await sharp(template).metadata();
const top = await sharp(template).extract({ left: 0, top: 0, width: tm.width, height: 113 }).png().toBuffer();
const bottom = await sharp(template).extract({ left: 0, top: 1219, width: tm.width, height: tm.height - 1219 }).png().toBuffer();
const records = [];
const formats = JSON.parse(fs.readFileSync('scripts/artists/ishtar-formats.json', 'utf8'));
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
  records.push({ slug, sourceFile: path.basename(input), sourceWidth: metadata.width, sourceHeight: metadata.height, proposedFormat: format, effectiveDpi: Math.round(Math.max(metadata.width / (format.widthCm / 2.54), metadata.height / (format.heightCm / 2.54))), sha256: createHash('sha256').update(fs.readFileSync(input)).digest('hex'), image: `/images/products/${slug}.png`, sourceImage: `/images/artworks/${slug}.avif`, sourceNote: slug.includes('surfer') ? 'Separate panel extracted from PDF page 10; larger standalone master needed before sale.' : undefined });
  console.log(slug, metadata.width + 'x' + metadata.height);
}
await sharp(path.join(pack, 'source/ishtar-portrait-sebastian-lundmark.jpg')).extract({ left: 285, top: 0, width: 922, height: 922 }).resize(1100, 1100).png().toFile('public/images/artists/ishtar-backlund-dakhil.png');
fs.writeFileSync(path.join(pack, 'asset-inventory.json'), JSON.stringify(records, null, 2) + '\n');
