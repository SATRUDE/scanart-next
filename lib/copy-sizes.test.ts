import { describe, it, expect } from 'vitest';
import { getAllProducts } from './products';
import { collections } from './collections';
import { categoryLandings } from './categories';
import { wallArtLanding } from './wall-art';
import { no } from './i18n/no';
import { helpGroups } from '@/data/help';

// A size named in copy that no print is sold in is a promise we cannot keep,
// and it goes stale silently: the A range (A3, A2, A1) existed only because of
// one artist's prints, so when they left the catalogue on 2026-08-21 five
// sentences across both languages kept offering sizes nobody could buy, one of
// them a meta description and one of them inside the Help page's FAQPage
// structured data. The catalogue is the authority, so read the sizes from it
// rather than hard-coding today's two.
const A_SIZE = /\bA[0-5]\b/g;

// Every string in a copy source, however deeply nested.
function strings(value: unknown, path: string, out: { path: string; text: string }[] = []) {
  if (typeof value === 'string') {
    out.push({ path, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => strings(item, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) strings(child, `${path}.${key}`, out);
  }
  return out;
}

describe('print sizes named in copy', () => {
  it('names no A size the catalogue does not sell, in either language', async () => {
    const offered = new Set(
      (await getAllProducts()).flatMap(p =>
        Object.entries(p.sizes ?? {})
          .filter(([, available]) => available)
          .map(([size]) => size)
      )
    );

    const sources: [string, unknown][] = [
      ['help', helpGroups],
      ['collections', collections],
      ['categories', categoryLandings],
      ['wallArtLanding', wallArtLanding],
      ['no', no],
    ];

    const offenders: string[] = [];
    for (const [name, source] of sources) {
      for (const { path, text } of strings(source, name)) {
        for (const token of text.match(A_SIZE) ?? []) {
          if (!offered.has(token)) offenders.push(`${path} offers "${token}"`);
        }
      }
    }

    expect(offenders, `copy names sizes the catalogue does not sell:\n${offenders.join('\n')}`).toEqual([]);
  });
});
