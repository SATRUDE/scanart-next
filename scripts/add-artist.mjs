// Add a new artist and their prints to the shop from one manifest.
//
//   npm run add-artist -- scripts/artists/<slug>.json
//
// Onboarding an artist used to be a dozen hand edits spread over five files
// plus image work in an editor, and every one of them had to be remembered.
// This script does the mechanical part from a single JSON manifest (see
// scripts/artists/hedvig-wallin.json for the worked example):
//
//   1. Renders each print file (PDF or image) to the framed product shot the
//      catalogue uses: the artwork, trimmed to its TrimBox, composited into
//      scripts/assets/frame-template.png (the oak frame from the SA Figma
//      file, page "Images", Group 83). Output: public/images/products/<slug>.png
//   2. Crops the artist's photo square for the avatar and Person JSON-LD.
//      Output: public/images/artists/<slug>.png
//   3. Appends the artist to data/artists.ts and each print to
//      public/notion-data/products.json.
//   4. Wires the Norwegian copy in lib/i18n/no.ts (artists, artistEditorial,
//      productCopy) and the English "About the work" section in
//      lib/artist-editorial.ts.
//
// Every text edit asserts that its anchor matches exactly once before writing,
// and anything already present (matched by slug) is skipped, so the script can
// be re-run after fixing a manifest without duplicating entries.
//
// What it deliberately does NOT do, and tells you about at the end:
//   - the room scene (secondaryImage). lib/feed-images.test.ts requires one per
//     print because Merchant Center wants lifestyle staging; scenes are made
//     separately (socialagent's mockup generator) and added by hand.
//   - the roster prose on the landing pages ("four artists", "sixteen prints")
//     in lib/wall-art.ts, lib/nordic-art.ts and the wallArt block of
//     lib/i18n/no.ts. Those are sentences, not data, so it lists the lines.
//
// Needs poppler on the PATH for PDF input (brew install poppler).

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, 'scripts', 'assets', 'frame-template.png');
// Where the artwork sits inside the template, in template pixels. The template
// is the Figma group cropped to its true 996 x 1331: the export was 997 x 1332
// and the extra column and row were canvas background, a dark line down the
// right of every product shot until Mark spotted it. Box position taken from
// the Figma group: artwork layer at (110.72, 112.57), 774.59 x 1106.30, in a
// 996 x 1332 frame. The frame is a 5:7 portrait, the shop's 50 x 70 cm format.
const ART_BOX = { left: 111, top: 113, width: 775, height: 1106 };
// The oak frame's outer edge in the template, measured: x 92..902, so 811 px
// wide in a 996 px canvas. The template itself is tight around the frame.
const TEMPLATE_FRAME_WIDTH = 811;
// How the finished shot sits on its canvas. Measured off the catalogue's
// existing shots (hummer-og-vin, dancer, vinkveld: all 820 x 1024 with the
// frame 481 px wide, centred), so a new print reads at the same size in the
// grid as its neighbours. The first Hedvig Wallin shots used the template at
// its own tight crop and looked a third larger than every print around them.
// The canvas is 4:5 like theirs, at twice the pixels for sharper artwork.
const CANVAS = { width: 1640, height: 2048, background: '#f3f3f3' };
const FRAME_FRACTION = 481 / 820;
const AVATAR_SIZE = 1100;
const CATEGORIES = new Set(['Abstract', 'Botanical', 'Illustrations']);
const SNIPPET_MAX = 155; // lib/meta-snippet.ts: the first sentence is the meta description

const FILES = {
  artists: path.join(ROOT, 'data', 'artists.ts'),
  products: path.join(ROOT, 'public', 'notion-data', 'products.json'),
  no: path.join(ROOT, 'lib', 'i18n', 'no.ts'),
  editorial: path.join(ROOT, 'lib', 'artist-editorial.ts'),
  priceCategories: path.join(ROOT, 'config', 'priceCategories.ts'),
};

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function requireField(object, field, where) {
  if (object[field] === undefined || object[field] === null || object[field] === '') {
    fail(`${where}: "${field}" is required.`);
  }
  return object[field];
}

/** A TypeScript single-quoted string literal, matching the files it lands in. */
function ts(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

/** The first sentence of a description, the way lib/meta-snippet.ts reads it. */
function firstSentence(text) {
  return text.split(/(?<=[.!?])\s/)[0];
}

function resolveInput(file, manifestDir) {
  const expanded = file.startsWith('~/') ? path.join(os.homedir(), file.slice(2)) : file;
  const resolved = path.isAbsolute(expanded) ? expanded : path.resolve(manifestDir, expanded);
  if (!fs.existsSync(resolved)) fail(`Input file not found: ${resolved}`);
  return resolved;
}

function hasPoppler() {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
    execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * The artwork as a PNG buffer with any print bleed removed. PDFs are rendered
 * with poppler and cropped to their TrimBox (the finished print size); images
 * are used as they are.
 */
function renderArtwork(file, workDir) {
  if (!/\.pdf$/i.test(file)) return fs.readFileSync(file);
  if (!hasPoppler()) fail('PDF input needs poppler (pdftoppm, pdfinfo): brew install poppler');

  const dpi = 96;
  const base = path.join(workDir, path.basename(file, path.extname(file)));
  execFileSync('pdftoppm', ['-r', String(dpi), '-f', '1', '-l', '1', '-png', '-singlefile', file, base], { stdio: 'ignore' });
  const rendered = `${base}.png`;

  const info = execFileSync('pdfinfo', ['-box', file], { encoding: 'utf8' });
  const box = (name) => {
    const match = info.match(new RegExp(`${name}:\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)`));
    return match ? match.slice(1, 5).map(Number) : null;
  };
  const media = box('MediaBox');
  const trim = box('TrimBox') ?? box('ArtBox') ?? media;
  if (!media || !trim) return fs.readFileSync(rendered);

  // PDF boxes are in points from the bottom-left; the render is top-down.
  const scale = dpi / 72;
  const left = Math.round((trim[0] - media[0]) * scale);
  const top = Math.round((media[3] - trim[3]) * scale);
  const width = Math.round((trim[2] - trim[0]) * scale);
  const height = Math.round((trim[3] - trim[1]) * scale);
  return sharp(rendered).extract({ left, top, width, height }).png().toBuffer();
}

async function buildProductShot(artworkBuffer, outputPath) {
  const meta = await sharp(artworkBuffer).metadata();
  const artRatio = meta.width / meta.height;
  const boxRatio = ART_BOX.width / ART_BOX.height;
  // The template is a 5:7 frame. A print of another shape is placed whole on a
  // white sheet inside it rather than cropped, and flagged, because the frame
  // in the picture would then be the wrong frame for that print.
  const fit = Math.abs(artRatio - boxRatio) / boxRatio > 0.03 ? 'contain' : 'fill';
  if (fit === 'contain') {
    console.warn(`  ! artwork is ${meta.width}x${meta.height} (${artRatio.toFixed(3)}), not 5:7; placed uncropped on white. Check the result.`);
  }
  const art = await sharp(artworkBuffer)
    .resize(ART_BOX.width, ART_BOX.height, { fit, background: '#ffffff', kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const framed = await sharp(TEMPLATE)
    .composite([{ input: art, left: ART_BOX.left, top: ART_BOX.top }])
    .png()
    .toBuffer();
  // Scale the framed print so the frame takes the same share of the canvas as
  // the rest of the catalogue, then centre it on the 4:5 canvas.
  const scale = (CANVAS.width * FRAME_FRACTION) / TEMPLATE_FRAME_WIDTH;
  const templateMeta = await sharp(TEMPLATE).metadata();
  const scaledWidth = Math.round(templateMeta.width * scale);
  const scaledHeight = Math.round(templateMeta.height * scale);
  const left = Math.round((CANVAS.width - scaledWidth) / 2);
  const top = Math.round((CANVAS.height - scaledHeight) / 2);
  await sharp(framed)
    .resize(scaledWidth, scaledHeight, { kernel: 'lanczos3' })
    .extend({
      top,
      bottom: CANVAS.height - scaledHeight - top,
      left,
      right: CANVAS.width - scaledWidth - left,
      background: CANVAS.background,
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function buildAvatar(photoPath, outputPath) {
  await sharp(photoPath)
    .rotate() // honour EXIF orientation from phone photos
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'attention' })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

/** Replace exactly one occurrence, or refuse: a silent no-match is how edits go missing. */
function editOnce(filePath, anchor, replacement) {
  const source = fs.readFileSync(filePath, 'utf8');
  const count = source.split(anchor).length - 1;
  if (count !== 1) {
    fail(`${path.relative(ROOT, filePath)}: expected the anchor once, found it ${count} times:\n${anchor}`);
  }
  fs.writeFileSync(filePath, source.replace(anchor, replacement));
}

function fileHas(filePath, needle) {
  return fs.readFileSync(filePath, 'utf8').includes(needle);
}

function priceCategoryNames() {
  const source = fs.readFileSync(FILES.priceCategories, 'utf8');
  return new Set([...source.matchAll(/^\s{2}'?([A-Za-z]+)'?:\s*\{/gm)].map((m) => m[1]));
}

async function main() {
  const manifestArg = process.argv[2];
  if (!manifestArg) fail('Usage: npm run add-artist -- scripts/artists/<slug>.json');
  const manifestPath = path.resolve(ROOT, manifestArg);
  if (!fs.existsSync(manifestPath)) fail(`Manifest not found: ${manifestPath}`);
  const manifestDir = path.dirname(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // ---- validate ------------------------------------------------------------
  const artist = requireField(manifest, 'artist', 'manifest');
  for (const field of ['id', 'name', 'slug', 'location', 'bio']) requireField(artist, field, 'artist');
  const prints = requireField(manifest, 'prints', 'manifest');
  if (!Array.isArray(prints) || prints.length === 0) fail('manifest: "prints" must be a non-empty array.');

  const products = JSON.parse(fs.readFileSync(FILES.products, 'utf8'));
  const artistsSource = fs.readFileSync(FILES.artists, 'utf8');
  if (artistsSource.includes(`id: '${artist.id}'`) && !artistsSource.includes(`slug: '${artist.slug}'`)) {
    fail(`artist id '${artist.id}' is already used by another artist in data/artists.ts.`);
  }
  const knownPriceCategories = priceCategoryNames();
  const productNames = new Set(products.map((p) => p.name));
  for (const print of prints) {
    for (const field of ['name', 'slug', 'file', 'category', 'description']) requireField(print, field, `print "${print.name ?? '?'}"`);
    if (!CATEGORIES.has(print.category)) fail(`print "${print.name}": category must be one of ${[...CATEGORIES].join(', ')}.`);
    const priceCategory = print.priceCategory ?? 'Premium';
    if (!knownPriceCategories.has(priceCategory)) fail(`print "${print.name}": unknown priceCategory "${priceCategory}" (config/priceCategories.ts).`);
    const opener = firstSentence(print.description);
    if (opener.length > SNIPPET_MAX) {
      fail(`print "${print.name}": the first sentence of the description is ${opener.length} characters; it becomes the meta description, so keep it under ${SNIPPET_MAX}.`);
    }
    productNames.add(print.name);
  }
  for (const print of prints) {
    for (const name of print.recommended ?? []) {
      if (!productNames.has(name)) fail(`print "${print.name}": recommended product "${name}" is not in the catalogue.`);
    }
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-artist-'));
  console.log(`Adding ${artist.name} (${artist.slug}) with ${prints.length} print${prints.length === 1 ? '' : 's'}\n`);

  // ---- images --------------------------------------------------------------
  console.log('Images');
  if (artist.photo) {
    const out = path.join(ROOT, 'public', 'images', 'artists', `${artist.slug}.png`);
    await buildAvatar(resolveInput(artist.photo, manifestDir), out);
    console.log(`  ✓ ${path.relative(ROOT, out)}`);
  } else {
    console.log('  - no photo given; the page shows initials until one is added');
  }
  for (const print of prints) {
    const out = path.join(ROOT, 'public', 'images', 'products', `${print.slug}.png`);
    const artwork = await renderArtwork(resolveInput(print.file, manifestDir), workDir);
    await buildProductShot(artwork, out);
    console.log(`  ✓ ${path.relative(ROOT, out)}`);
  }

  // ---- data/artists.ts -----------------------------------------------------
  console.log('\nCatalogue');
  if (fileHas(FILES.artists, `slug: '${artist.slug}'`)) {
    console.log(`  - data/artists.ts already has ${artist.slug}`);
  } else {
    const entry = [
      '  {',
      `    id: ${ts(artist.id)},`,
      `    name: ${ts(artist.name)},`,
      `    slug: ${ts(artist.slug)},`,
      `    location: ${ts(artist.location)},`,
      `    bio: ${ts(artist.bio)},`,
      `    image: ${ts(artist.photo ? `/images/artists/${artist.slug}.png` : '')}`,
      '  },',
      '];',
    ].join('\n');
    editOnce(FILES.artists, '\n];', `\n${entry}`);
    console.log('  ✓ data/artists.ts');
  }

  // ---- products.json -------------------------------------------------------
  const now = new Date().toISOString();
  let nextProductId = Math.max(0, ...products.map((p) => Number(p.productId) || 0)) + 1;
  let added = 0;
  for (const print of prints) {
    if (products.some((p) => p.slug === print.slug)) {
      console.log(`  - products.json already has ${print.slug}`);
      continue;
    }
    products.push({
      id: print.id ?? randomUUID(),
      name: print.name,
      slug: print.slug,
      description: print.description,
      category: print.category,
      artist: artist.name,
      artistId: artist.id,
      brand: '',
      inStock: true,
      featured: Boolean(print.featured),
      published: print.published ?? true,
      image: `/images/products/${print.slug}.png`,
      // The room scene. Made separately; see the note at the end of the run.
      secondaryImage: print.secondaryImage ?? '',
      availableSizes: print.sizes ?? ['50x70cm'],
      priceCategory: print.priceCategory ?? 'Premium',
      productId: String(nextProductId++),
      recommendedProducts: print.recommended ?? [],
      created_time: now,
      last_edited_time: now,
    });
    added += 1;
  }
  if (added > 0) {
    fs.writeFileSync(FILES.products, `${JSON.stringify(products, null, 2)}\n`);
    console.log(`  ✓ public/notion-data/products.json (+${added})`);
  }

  // ---- Norwegian copy: lib/i18n/no.ts ---------------------------------------
  console.log('\nCopy');
  const noKey = `    '${artist.slug}': {`;
  if (artist.bioNo && artist.locationNo) {
    const artistsEnd = '  } as Record<string, ArtistCopy>,';
    if (fileHas(FILES.no, `${noKey}\n      location:`)) {
      console.log(`  - lib/i18n/no.ts artists already has ${artist.slug}`);
    } else {
      editOnce(FILES.no, artistsEnd, [
        noKey,
        `      location: ${ts(artist.locationNo)},`,
        `      bio: ${ts(artist.bioNo)},`,
        '    },',
        artistsEnd,
      ].join('\n'));
      console.log('  ✓ lib/i18n/no.ts artists');
    }
  } else {
    console.log('  - no Norwegian bio/location; /no falls back to the English');
  }

  if (artist.editorialNo) {
    const end = '  } as Record<string, ArtistEditorialCopy>,';
    if (fileHas(FILES.no, `${noKey}\n      heading:`)) {
      console.log(`  - lib/i18n/no.ts artistEditorial already has ${artist.slug}`);
    } else {
      const e = artist.editorialNo;
      editOnce(FILES.no, end, [
        noKey,
        `      heading: ${ts(e.heading)},`,
        '      para1:',
        `        ${ts(e.para1)},`,
        '      para2:',
        `        ${ts(e.para2)},`,
        '    },',
        end,
      ].join('\n'));
      console.log('  ✓ lib/i18n/no.ts artistEditorial');
    }
  }

  const productCopyEnd = '  } as Record<string, { description: string; buyerDescription?: string }>,';
  const copyEntries = [];
  for (const print of prints) {
    if (!print.descriptionNo) continue;
    const key = /^[a-z][a-z0-9]*$/.test(print.slug) ? print.slug : `'${print.slug}'`;
    if (fileHas(FILES.no, `    ${key}: {\n      description:`)) {
      console.log(`  - lib/i18n/no.ts productCopy already has ${print.slug}`);
      continue;
    }
    copyEntries.push(
      `    ${key}: {`,
      '      description:',
      `        ${ts(print.descriptionNo)},`,
      ...(print.buyerDescriptionNo ? ['      buyerDescription:', `        ${ts(print.buyerDescriptionNo)},`] : []),
      '    },',
    );
  }
  if (copyEntries.length > 0) {
    editOnce(FILES.no, productCopyEnd, [...copyEntries, productCopyEnd].join('\n'));
    console.log('  ✓ lib/i18n/no.ts productCopy');
  }

  // ---- English editorial: lib/artist-editorial.ts ----------------------------
  if (artist.editorial) {
    if (fileHas(FILES.editorial, `  '${artist.slug}': {`)) {
      console.log(`  - lib/artist-editorial.ts already has ${artist.slug}`);
    } else {
      const e = artist.editorial;
      editOnce(FILES.editorial, '\n};', [
        '',
        `  '${artist.slug}': {`,
        `    heading: ${ts(e.heading)},`,
        '    para1:',
        `      ${ts(e.para1)},`,
        '    para2:',
        `      ${ts(e.para2)},`,
        '  },',
        '};',
      ].join('\n'));
      console.log('  ✓ lib/artist-editorial.ts');
    }
  } else {
    console.log('  - no English editorial; the "About the work" section is simply omitted');
  }

  // ---- what is left for a person -------------------------------------------
  console.log('\nStill to do by hand');
  const withoutScene = prints.filter((p) => !p.secondaryImage);
  if (withoutScene.length > 0) {
    console.log(
      `  • Room scenes: ${withoutScene.map((p) => p.slug).join(', ')} have no secondaryImage. ` +
        'lib/feed-images.test.ts fails until each has a <slug>-room.avif plus a .webp twin in public/images/products and products.json points at the .avif.'
    );
  }
  const rosterFiles = ['lib/wall-art.ts', 'lib/nordic-art.ts', 'lib/i18n/no.ts'];
  const pattern = /\b(four|five|six|seven|eight|sixteen|twenty|fire|fem|seks|sju|åtte|seksten|tjue)\b.{0,40}\b(artists?|prints?|pieces|kunstnere|trykk|hender|hands)\b/i;
  const hits = [];
  for (const rel of rosterFiles) {
    fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n').forEach((line, i) => {
      if (pattern.test(line)) hits.push(`${rel}:${i + 1}`);
    });
  }
  if (hits.length > 0) {
    console.log(`  • Roster prose that counts artists or prints, check each still holds:\n      ${hits.join('\n      ')}`);
  }
  console.log('  • Run: npx vitest run lib && npx eslint lib data && npx tsc --noEmit');
  console.log(`  • Preview: /artist/${artist.slug}, /no/artist/${artist.slug}, and each /product/<slug>\n`);
  fs.rmSync(workDir, { recursive: true, force: true });
}

main().catch((error) => fail(error.stack ?? String(error)));
