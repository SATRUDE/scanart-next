import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromeAria, type Locale } from './i18n';

// The icon-only controls carry no visible words, so an English accessible name
// on a Norwegian page is invisible to anyone looking at the page and audible to
// exactly the person who cannot. That is how "Decrease quantity" and "Next
// image" survived the phase 1 translation and stayed on the buying path: in the
// basket, and on every /no/product gallery.
//
// Two guards. The first says the Norwegian side is really Norwegian rather than
// a copy of the English, which is what a half-finished dictionary looks like.
// The second says no component has quietly gone back to a literal, because
// adding one is a single word and nothing else would notice.
describe('chrome aria labels', () => {
  /** Every leaf string in a dictionary, keyed by its dotted path. */
  const leaves = (value: unknown, prefix = ''): Record<string, string> => {
    if (typeof value === 'string') return { [prefix]: value };
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
      (acc, [k, v]) => Object.assign(acc, leaves(v, prefix ? `${prefix}.${k}` : k)),
      {}
    );
  };

  const en = leaves(chromeAria.en);
  const no = leaves(chromeAria.no);

  it('gives every English label the same shape in Norwegian', () => {
    expect(Object.keys(no).sort()).toEqual(Object.keys(en).sort());
  });

  it('actually translates every one of them', () => {
    const untranslated = Object.keys(en).filter(k => en[k] === no[k]);
    expect(
      untranslated,
      `chromeAria.no repeats the English string verbatim for:\n${untranslated.join('\n')}`
    ).toEqual([]);
  });

  it('leaves no label empty in either locale', () => {
    for (const locale of ['en', 'no'] as Locale[]) {
      for (const [key, value] of Object.entries(leaves(chromeAria[locale]))) {
        expect(value.trim(), `chromeAria.${locale}.${key} is empty`).not.toBe('');
      }
    }
  });

  // Derived rather than a list of the four components fixed today: a literal
  // added to any component renders in English under /no from the moment that
  // component is mounted there, and which components those are is not visible
  // from here. That is the same reasoning as the Norwegian link guard, and it
  // was a hand-picked list of three that missed FullWidthImage the first time.
  //
  // A `title`/`alt` is deliberately out of scope. This is about the controls
  // whose only accessible name is the aria-label.
  it('leaves no hardcoded English aria-label in the shared components', () => {
    const COMPONENTS = join(process.cwd(), 'components');
    const tsxUnder = (dir: string): string[] =>
      readdirSync(dir).flatMap(entry => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return tsxUnder(full);
        return entry.endsWith('.tsx') ? [full] : [];
      });

    // Allowed: the shadcn primitives under components/ui, which are vendored
    // and carry their own English defaults that every call site overrides.
    const offenders: string[] = [];
    for (const file of tsxUnder(COMPONENTS)) {
      if (file.includes(`${join('components', 'ui')}`)) continue;
      const source = readFileSync(file, 'utf8');
      for (const m of source.matchAll(/aria-label="([^"]+)"/g)) {
        offenders.push(`${file.replace(process.cwd() + '/', '')}: aria-label="${m[1]}"`);
      }
    }
    expect(
      offenders,
      `Literal aria-labels render in English under /no. Move them into chromeAria in lib/i18n.ts:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
