import { describe, expect, it } from 'vitest';

import { siteMetadata } from '@/app/site-metadata';
import { ARTICLE_META_TITLES } from '@/lib/article-meta';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { no } from '@/lib/i18n/no';
import { BRAND_SUFFIX, META_TITLE_MAX_LENGTH, metaTitle } from '@/lib/meta-title';

// T-0174 / T-0178 (21 Oct 2026): the titles and descriptions rewritten from the
// Search Console queries each page already shows for. These pin the wording
// that was approved and keep every snippet inside the budget a result shows:
// a title at or under 60 characters as rendered (with the brand suffix when
// metaTitle keeps it), a description at or under 160.
const DESCRIPTION_MAX_LENGTH = 160;

const rendered = (title: string) => {
  const t = metaTitle(title);
  return typeof t === 'string' ? t + BRAND_SUFFIX : t.absolute;
};

const category = (slug: string) => categoryLandings.find((c) => c.slug === slug)!;
const collection = (slug: string) => collections.find((c) => c.slug === slug)!;

describe('search titles and descriptions (T-0174, T-0178)', () => {
  const cases: { page: string; title: string; description: string }[] = [
    {
      page: '/',
      title: (siteMetadata.title as { default: string }).default,
      description: siteMetadata.description as string,
    },
    { page: '/no', title: no.home.meta.title, description: no.home.meta.description },
    {
      page: '/category/illustrations',
      title: rendered(category('illustrations').title),
      description: category('illustrations').description,
    },
    {
      page: '/no/category/illustrations',
      title: rendered(no.categories.illustrations.title),
      description: no.categories.illustrations.description,
    },
    {
      page: '/category/abstract',
      title: rendered(category('abstract').title),
      description: category('abstract').description,
    },
    {
      page: '/category/botanical',
      title: rendered(category('botanical').title),
      description: category('botanical').description,
    },
    {
      page: '/collection/birds-and-animals',
      title: rendered(collection('birds-and-animals').title),
      description: collection('birds-and-animals').description,
    },
    {
      page: '/no/collection/birds-and-animals',
      title: rendered(no.collections['birds-and-animals'].title),
      description: no.collections['birds-and-animals'].description,
    },
    {
      page: '/no/artists',
      title: rendered(no.artistsIndex.meta.title),
      description: no.artistsIndex.meta.description,
    },
  ];

  it.each(cases)('$page fits the title and description budget', ({ title, description }) => {
    expect(title.length).toBeLessThanOrEqual(META_TITLE_MAX_LENGTH);
    expect(description.length).toBeLessThanOrEqual(DESCRIPTION_MAX_LENGTH);
  });

  it('names the searches each page already ranks for', () => {
    expect((siteMetadata.title as { default: string }).default).toBe(
      'Scandinavian Art Gallery | Nordic & Scandi Art Prints',
    );
    expect(rendered(category('illustrations').title)).toBe(
      'Scandinavian Illustration Prints | Scandinavian Art Gallery',
    );
    expect(rendered(category('abstract').title)).toBe(
      'Scandinavian Abstract Art Prints | Scandinavian Art Gallery',
    );
    expect(rendered(category('botanical').title)).toBe(
      'Scandinavian Botanical Prints | Scandinavian Art Gallery',
    );
    expect(rendered(collection('birds-and-animals').title)).toBe(
      'Scandinavian Bird & Animal Art | Scandinavian Art Gallery',
    );
    expect(rendered(ARTICLE_META_TITLES['best-scandinavian-art-prints'])).toBe(
      'Best Scandinavian Art Prints: Five Picks by Nordic Artists',
    );
    // Too long for the suffix, so metaTitle drops it rather than cut the words.
    expect(rendered(no.artistsIndex.meta.title)).toBe('Skandinaviske illustratører og fotografer');
  });

  it('keeps the brand at the end of every titled page except home', () => {
    for (const { page, title } of cases) {
      if (page === '/' || page === '/no') continue;
      if (title.includes('Scandinavian Art Gallery')) expect(title.endsWith(BRAND_SUFFIX)).toBe(true);
    }
  });
});
