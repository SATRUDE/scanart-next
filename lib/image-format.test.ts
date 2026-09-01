import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Every file under public/images must hold the bytes its extension claims.
 *
 * Eight room scenes shipped named `.avif` while holding WebP. Visitors never
 * saw it, because every on-page render goes through `next/image`, which reads
 * the real bytes and re-encodes. The exposure is to anything fetching the raw
 * URL: Vercel derives `Content-Type` from the extension, so `/images/products/
 * eltsjoen-scene.avif` was served as `image/avif` with a WebP payload, and
 * `app/sitemap.ts` declares those exact URLs to Google Images, which is half
 * our reach. Both browsers and Googlebot sniff content, so the likely cost was
 * nothing, but it is still a wrong statement we make to a crawler.
 *
 * The check reads MAGIC BYTES rather than asking an image library, for two
 * reasons. It needs no dependency, so it runs in the plain `unit` project. And
 * sharp reports a genuine AVIF as `format: 'heif'` (AVIF is a HEIF brand), so a
 * naive `format === extension` comparison flags all twelve real AVIFs as
 * broken: the first sweep of this did exactly that and had to be re-measured.
 * The container brand in the `ftyp` box is the unambiguous answer.
 */
const IMAGES = join(process.cwd(), 'public', 'images');

/** The format a file's own bytes declare, or null when we do not recognise it. */
function sniff(bytes: Buffer): string | null {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.subarray(0, 6).toString('latin1').startsWith('GIF8')) return 'gif';
  if (
    bytes.subarray(0, 4).toString('latin1') === 'RIFF' &&
    bytes.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  // ISO base media container: the brand in the ftyp box says which one. AVIF
  // still images are `avif`; `avis` is the sequence brand.
  if (bytes.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = bytes.subarray(8, 12).toString('latin1');
    if (brand === 'avif' || brand === 'avis') return 'avif';
    return brand.trim();
  }
  if (bytes.subarray(0, 5).toString('latin1') === '<?xml') return 'svg';
  if (bytes.subarray(0, 4).toString('latin1') === '<svg') return 'svg';
  return null;
}

/** Extensions that mean the same format, so a match is not a mislabel. */
const ALIASES: Record<string, string> = { jpeg: 'jpg' };

const filesUnder = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });

describe('public/images', () => {
  it('serves every file as the format its extension promises', () => {
    const offenders: string[] = [];

    for (const file of filesUnder(IMAGES)) {
      const ext = extname(file).toLowerCase().slice(1);
      if (!ext) continue;
      const claimed = ALIASES[ext] ?? ext;
      const actual = sniff(readFileSync(file).subarray(0, 32));
      // An unrecognised container is not a mislabel: say nothing rather than
      // failing the build on a format this sniffer has never been taught.
      if (actual === null) continue;
      if (actual !== claimed) {
        offenders.push(`${relative(process.cwd(), file)} is named .${ext} and holds ${actual}`);
      }
    }

    expect(
      offenders,
      `Content-Type is derived from the extension, so these serve a header that contradicts the bytes:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
