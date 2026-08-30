import { describe, it, expect } from 'vitest';
import { INTRO, LAST_UPDATED, SECTIONS } from './artist-how-it-works';
import { no } from './i18n/no';

const NO = no.artistsHowItWorks;

// The two language versions are the same document. They drift silently
// otherwise: somebody adds a section, or changes a figure, in one file only,
// and an artist is shown terms that don't match the ones we sent someone else.
describe('the Norwegian mirror stays in step with the English', () => {
  it('has the same sections in the same order', () => {
    expect(NO.sections).toHaveLength(SECTIONS.length);
    NO.sections.forEach((section, i) => {
      expect(section.body).toHaveLength(SECTIONS[i].body.length);
    });
  });

  it('carries the same last-updated date', () => {
    // "30 August 2026" / "30. august 2026": same day, different register.
    const day = LAST_UPDATED.split(' ')[0];
    expect(NO.lastUpdated.startsWith(`${day}.`)).toBe(true);
    expect(LAST_UPDATED).toMatch(/2026$/);
    expect(NO.lastUpdated).toMatch(/2026$/);
  });
});

// The commercial terms are the whole reason this page exists, and every one of
// them comes from the signed agreement. A figure quietly changing here is a
// figure we are wrong about in front of an artist.
describe('the terms match the artist agreement', () => {
  const allCopy = [INTRO, ...SECTIONS.flatMap(s => s.body)].join(' ');
  const allNorwegian = [NO.intro, ...NO.sections.flatMap(s => s.body)].join(' ');

  it('states the 60% share in both languages', () => {
    expect(allCopy).toContain('60%');
    expect(allNorwegian).toContain('60 %');
  });

  it('states the 20% discount latitude, the 14-day clearance and the 30-day notice', () => {
    expect(allCopy).toContain('20%');
    expect(allCopy).toContain('14-day');
    expect(allCopy).toContain("30 days' written notice");
    expect(allNorwegian).toContain('20 %');
    expect(allNorwegian).toContain('14 dager');
    expect(allNorwegian).toContain('30 dagers skriftlig varsel');
  });

  it('does not promise a reply time or name a file format, neither being settled', () => {
    // The agreement is silent on both. Section 10 says we will come back on
    // them; anything more specific here would be invented.
    //
    // Scoped to a REPLY promise, not to any number of days: the copy does say
    // "changes their mind inside 30 days", which is the customer's returns
    // window and is a fact we hold. The first draft of this test failed on
    // exactly that, which is the right kind of failure to have had.
    expect(allCopy).not.toMatch(
      /(hear (back|from us)|come back to you|reply|respond|answer)[^.]*\b\d+\b[^.]*\b(days?|weeks?|hours?)\b/i,
    );
    expect(allCopy).not.toMatch(/\b(dpi|ppi|tiff|cmyk)\b/i);
  });
});

// House style, applied to the page an artist judges us by.
describe('house style', () => {
  it('uses no em dashes anywhere', () => {
    const everything = [
      INTRO,
      ...SECTIONS.flatMap(s => [s.heading, ...s.body]),
      NO.intro,
      ...NO.sections.flatMap(s => [s.heading, ...s.body]),
    ].join(' ');
    expect(everything).not.toContain('—');
  });
});
