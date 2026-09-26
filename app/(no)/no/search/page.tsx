import type { Metadata } from 'next';
import { SearchRoute, searchMetadata, type SearchParams } from '@/components/v2/search/search-route';

// /no/search?q=: the Norwegian twin, noindex, follow, no canonical and no
// hreflang, not in the sitemap (docs/v2-seo.md, item 8).
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  return searchMetadata('no', searchParams);
}

export default function NorwegianSearch({ searchParams }: { searchParams: SearchParams }) {
  return <SearchRoute lang="no" searchParams={searchParams} />;
}
