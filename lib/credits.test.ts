import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CREDITS } from './credits';
import { no } from './i18n/no';

describe('credits', () => {
  it('points every entry at files that ship', () => {
    const missing = CREDITS.flatMap(c => c.assets).filter(a => !existsSync(join(process.cwd(), a)));
    expect(missing).toEqual([]);
  });

  it('gives every entry a Norwegian "where" line, so /no/credits has no English', () => {
    const missing = CREDITS.filter(c => !no.credits.where[c.id]).map(c => c.id);
    expect(missing).toEqual([]);
  });

  it('links every entry to its Commons file page and a Creative Commons deed', () => {
    for (const c of CREDITS) {
      expect(c.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(c.licence.url).toMatch(/^https:\/\/creativecommons\.org\/licenses\/by(-sa)?\/\d\.\d\/$/);
    }
  });
});
