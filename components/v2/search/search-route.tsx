import type { Metadata } from 'next';
import { searchStrings } from '@/lib/i18n';
import { buildSearchIndex } from '@/lib/search-index';
import { SEARCH_TABS, fill, searchIndex, type SearchTab } from '@/lib/site-search';
import { SearchPage } from '@/components/v2/search/SearchPage';

/**
 * The two /search routes (app/(en)/search, app/(no)/no/search) share this.
 *
 * SEO (docs/v2-seo.md, item 8): noindex, follow, like checkout. No canonical
 * and no hreflang pair (a noindex page should not ask to be indexed as
 * canonical, nor advertise itself as an alternate), and it is not in the
 * sitemap. follow, so the result links still pass. Only this page reads
 * searchParams; the layouts stay static.
 */
export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

async function readParams(searchParams: SearchParams) {
  const params = await searchParams;
  // Capped: the query is echoed into the title and the heading.
  const query = first(params.q).trim().slice(0, 100);
  const tabParam = first(params.tab) as SearchTab;
  const tab: SearchTab = SEARCH_TABS.includes(tabParam) ? tabParam : 'all';
  return { query, tab };
}

export async function searchMetadata(lang: 'en' | 'no', searchParams: SearchParams): Promise<Metadata> {
  const t = searchStrings[lang];
  const { query } = await readParams(searchParams);
  return {
    title: query ? fill(t.pageTitleFor, { q: query }) : t.pageTitle,
    description: t.pageDescription,
    robots: { index: false, follow: true },
  };
}

export async function SearchRoute({ lang, searchParams }: { lang: 'en' | 'no'; searchParams: SearchParams }) {
  const { query, tab } = await readParams(searchParams);
  const index = await buildSearchIndex(lang);
  const results = searchIndex(index, query);
  // Keyed by the query so a new search starts from its own field and tab.
  return <SearchPage key={query} lang={lang} query={query} initialTab={tab} index={index} results={results} />;
}
