import { describe, expect, it } from 'vitest';

import { BRAND_SUFFIX, META_TITLE_MAX_LENGTH, metaTitle } from './meta-title';
import articlesData from '../public/notion-data/articles.json';

/** What the rendered <title> ends up being, given what metaTitle returns. */
function rendered(title: string): string {
  const result = metaTitle(title);
  return typeof result === 'string' ? `${result}${BRAND_SUFFIX}` : result.absolute;
}

describe('metaTitle', () => {
  it('keeps the brand suffix on a title short enough to carry it', () => {
    // 33 characters plus the 27-character suffix is exactly the budget.
    const title = 'Levering og retur for kunsttrykk';
    expect(metaTitle(title)).toBe(title);
    expect(rendered(title).length).toBeLessThanOrEqual(META_TITLE_MAX_LENGTH);
  });

  it('drops the suffix rather than let it push the page out of the slot', () => {
    // The real case: this headline is 40 characters and reads fine, but the
    // templated title was 67 and got cut on the site's biggest impression
    // earner (243 impressions over the 28 days to 15 Aug).
    const title = 'Nordic art and design books worth owning';
    expect(metaTitle(title)).toEqual({ absolute: title });
    expect(rendered(title)).toBe(title);
    expect(rendered(title).length).toBeLessThanOrEqual(META_TITLE_MAX_LENGTH);
  });

  it('returns a title that overflows on its own as absolute too', () => {
    // Nothing here can save the tail from being cut. Dropping the suffix at
    // least means the cut falls in the page's own sentence, not after a brand
    // name that pushed the sentence out. Shortening it is Ken's call, not this
    // function's.
    const title =
      'Hyttefrokost, vinkveld, morgenstrekk: the Norwegian words behind the prints';
    expect(title.length).toBeGreaterThan(META_TITLE_MAX_LENGTH);
    expect(metaTitle(title)).toEqual({ absolute: title });
  });

  it('ignores surrounding whitespace when measuring', () => {
    expect(metaTitle('  Kunstnere  ')).toBe('Kunstnere');
  });

  it('leaves no journal headline cut by the suffix rather than by its own length', () => {
    // The guard that matters: the fix is only worth having if it clears the
    // titles it was written for. 22 of the 26 journal headlines rendered past
    // the slot before this; the ones still over are exactly those already too
    // long on their own, where no suffix decision can help and shortening is a
    // copy call. Written as the rule rather than a fixed list so a new article
    // does not have to be added here.
    const titles = (articlesData as { title: string }[]).map(a => a.title);
    const stillOver = titles.filter(t => rendered(t).length > META_TITLE_MAX_LENGTH);

    expect(stillOver.every(t => t.length > META_TITLE_MAX_LENGTH)).toBe(true);
    // And the fix has to actually move the needle, not just hold the line.
    const wasOver = titles.filter(t => `${t}${BRAND_SUFFIX}`.length > META_TITLE_MAX_LENGTH);
    expect(stillOver.length).toBeLessThan(wasOver.length / 2);
  });
});
