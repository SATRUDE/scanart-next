import { describe, expect, it } from 'vitest';

import { SITE_LAUNCH, latestSitemapDate, sitemapDate } from './sitemap-dates';

// The real dates that motivated the floor: every product in the catalogue
// carries one of these two Notion timestamps, both from August 2025.
const NOTION_2025 = '2025-08-24T11:50:00.000Z';
const NOTION_2025_LATER = '2025-08-28T07:42:00.000Z';
const REAL_2026_EDIT = '2026-08-05T13:25:18.425Z';

describe('sitemapDate', () => {
  it('floors a pre-launch source date at the site launch', () => {
    expect(sitemapDate(NOTION_2025)).toEqual(SITE_LAUNCH);
    expect(sitemapDate(NOTION_2025_LATER)).toEqual(SITE_LAUNCH);
  });

  it('passes a genuine post-launch edit date through untouched', () => {
    expect(sitemapDate(REAL_2026_EDIT)).toEqual(new Date(REAL_2026_EDIT));
  });

  it('falls back to the launch date when there is no date at all', () => {
    expect(sitemapDate(undefined)).toEqual(SITE_LAUNCH);
    expect(sitemapDate(null)).toEqual(SITE_LAUNCH);
    expect(sitemapDate('')).toEqual(SITE_LAUNCH);
  });

  it('falls back to the launch date rather than emitting an invalid date', () => {
    expect(sitemapDate('not a date')).toEqual(SITE_LAUNCH);
    expect(sitemapDate(new Date('nonsense'))).toEqual(SITE_LAUNCH);
  });

  it('accepts a Date as readily as a string', () => {
    expect(sitemapDate(new Date(REAL_2026_EDIT))).toEqual(new Date(REAL_2026_EDIT));
    expect(sitemapDate(new Date(NOTION_2025))).toEqual(SITE_LAUNCH);
  });

  it('never returns a date before the site existed', () => {
    for (const value of [NOTION_2025, NOTION_2025_LATER, REAL_2026_EDIT, '', 'x', null]) {
      expect(sitemapDate(value).getTime()).toBeGreaterThanOrEqual(SITE_LAUNCH.getTime());
    }
  });
});

describe('latestSitemapDate', () => {
  it('takes the most recent of several dates', () => {
    expect(latestSitemapDate([REAL_2026_EDIT, '2026-07-01T00:00:00.000Z'])).toEqual(
      new Date(REAL_2026_EDIT)
    );
  });

  it('floors a set of entirely pre-launch dates, rather than taking the newest of them', () => {
    // The artist and category pages are dated by their prints. Every print is
    // dated August 2025, so without the floor these pages inherited 2025.
    expect(latestSitemapDate([NOTION_2025, NOTION_2025_LATER])).toEqual(SITE_LAUNCH);
  });

  it('lets one genuine 2026 edit lift a page above the floor', () => {
    expect(latestSitemapDate([NOTION_2025, REAL_2026_EDIT])).toEqual(new Date(REAL_2026_EDIT));
  });

  it('gives the launch date for an empty list', () => {
    expect(latestSitemapDate([])).toEqual(SITE_LAUNCH);
  });

  it('ignores unparseable entries instead of poisoning the result', () => {
    // Math.max over a NaN would otherwise yield an Invalid Date and throw
    // when Next serialises the sitemap.
    expect(latestSitemapDate(['nope', REAL_2026_EDIT])).toEqual(new Date(REAL_2026_EDIT));
    expect(latestSitemapDate(['nope', null, undefined])).toEqual(SITE_LAUNCH);
  });
});
