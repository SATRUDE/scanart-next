import { notFound, redirect } from 'next/navigation';
import { catalogueReviewEnabled } from '@/lib/server/catalogue-review';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ lang?: string }>;
};

// Artist-facing branch: old review links lead to the ordinary storefront.
export default async function CatalogueReviewPage({ params, searchParams }: Props) {
  if (!catalogueReviewEnabled()) notFound();
  const [{ path = [] }, query] = await Promise.all([params, searchParams]);
  const prefix = query.lang === 'no' ? '/no' : '';
  if (!path.length) redirect(`${prefix}/artist/ishtar-backlund-dakhil`);
  if (path.length !== 2 || !['artist', 'product'].includes(path[0])) notFound();
  redirect(`${prefix}/${path[0]}/${encodeURIComponent(path[1])}`);
}
