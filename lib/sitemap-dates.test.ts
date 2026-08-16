import { describe, expect, it } from 'vitest';

import {
  CATALOGUE_REVISED,
  SITE_LAUNCH,
  catalogueDate,
  latestCatalogueDate,
  latestSitemapDate,
  sitemapDate,
} from './sitemap-dates';

// The real dates that motivated the floor: every product in the catalogue
// carries one of these two Notion timestamps, both from August 2025.
const NOTION_2025 = '2025-08-24T11:50:00.000Z';
const NOTION_2025_LATER = '2025-08-28T07:42:00.000Z';
const REAL_2026_EDIT = '2026-08-05T13:25:18.425Z';
// An edit later than the catalogue floor, for the pass-through cases.
const AFTER_CATALOGUE_REVISED = '2026-09-02T09:00:00.000Z';

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

// The catalogue floor exists because a print's page is decided by three things
// and its Notion record is only one of them; the published prices and the page
// template have no date the sitemap can read. Every product record predates the
// site, so without a higher floor these URLs reported SITE_LAUNCH for ever.
describe('catalogueDate', () => {
  it('floors a product record at the catalogue revision, not the site launch', () => {
    expect(catalogueDate(NOTION_2025)).toEqual(CATALOGUE_REVISED);
    expect(catalogueDate(NOTION_2025_LATER)).toEqual(CATALOGUE_REVISED);
  });

  it('is what stops every product URL reporting the April floor for ever', () => {
    // The regression this was written for: 43 of 72 live URLs all read
    // 2026-04-14 on 2026-08-16, product pages included.
    expect(catalogueDate(NOTION_2025)).not.toEqual(SITE_LAUNCH);
    expect(catalogueDate(NOTION_2025).getTime()).toBeGreaterThan(SITE_LAUNCH.getTime());
  });

  it('lets a record edited after the revision pass through untouched', () => {
    expect(catalogueDate(AFTER_CATALOGUE_REVISED)).toEqual(new Date(AFTER_CATALOGUE_REVISED));
  });

  it('falls back to the revision for a missing or unusable date', () => {
    expect(catalogueDate(undefined)).toEqual(CATALOGUE_REVISED);
    expect(catalogueDate(null)).toEqual(CATALOGUE_REVISED);
    expect(catalogueDate('')).toEqual(CATALOGUE_REVISED);
    expect(catalogueDate('not a date')).toEqual(CATALOGUE_REVISED);
  });
});

describe('latestCatalogueDate', () => {
  it('floors a set of entirely pre-revision dates at the revision', () => {
    expect(latestCatalogueDate([NOTION_2025, NOTION_2025_LATER, REAL_2026_EDIT])).toEqual(
      CATALOGUE_REVISED
    );
  });

  it('lets one genuinely later edit lift the page above the floor', () => {
    expect(latestCatalogueDate([NOTION_2025, AFTER_CATALOGUE_REVISED])).toEqual(
      new Date(AFTER_CATALOGUE_REVISED)
    );
  });

  it('gives the revision for an empty list, and ignores unparseable entries', () => {
    expect(latestCatalogueDate([])).toEqual(CATALOGUE_REVISED);
    expect(latestCatalogueDate(['nope', null, undefined])).toEqual(CATALOGUE_REVISED);
  });
});

describe('the two floors together', () => {
  it('keeps the catalogue floor at or after the site launch', () => {
    // A catalogue revision earlier than the launch would reintroduce the
    // impossible pre-launch dates the site floor exists to prevent.
    expect(CATALOGUE_REVISED.getTime()).toBeGreaterThanOrEqual(SITE_LAUNCH.getTime());
  });

  it('does not lift an article that genuinely has not changed', () => {
    // The reason articles keep sitemapDate: they carry real edit dates spread
    // across the year, and stamping them all with the catalogue revision would
    // be the stamp-everything pattern Google learns to discount.
    expect(sitemapDate(REAL_2026_EDIT)).toEqual(new Date(REAL_2026_EDIT));
    expect(sitemapDate(REAL_2026_EDIT).getTime()).toBeLessThan(CATALOGUE_REVISED.getTime());
  });
});
