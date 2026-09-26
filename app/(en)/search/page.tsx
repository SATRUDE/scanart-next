import type { Metadata } from 'next';
import { SearchRoute, searchMetadata, type SearchParams } from '@/components/v2/search/search-route';

// /search?q=: noindex, follow, no canonical, not in the sitemap
// (docs/v2-seo.md, item 8). See components/v2/search/search-route.tsx.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  return searchMetadata('en', searchParams);
}

export default function Search({ searchParams }: { searchParams: SearchParams }) {
  return <SearchRoute lang="en" searchParams={searchParams} />;
}
