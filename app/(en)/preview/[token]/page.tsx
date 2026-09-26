import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { ReaderComments } from '@/components/ReaderComments';
import { markdownToBlocks } from '@/lib/markdown-blocks';
import { resolvePrintFeatures } from '@/lib/article-prints';
import { fetchPreviewArticle } from '@/lib/server/socialagent-preview';

// Always current, never statically generated or cached: a preview link is
// shared before the piece has a slug of its own, and an editor re-checking
// it after an edit must see that edit, not a build-time snapshot.
export const dynamic = 'force-dynamic';

// Never indexed, never followed: a draft has no business in search, and a
// link from it must not pass authority to whatever it points at.
export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const article = await fetchPreviewArticle(token);

  if (!article) {
    notFound();
  }

  // `::print[slug]` blocks get their catalogue data here, as on the article page.
  const blocks = await resolvePrintFeatures(markdownToBlocks(article.body));

  return (
    <div className="page-x pb-section">
      <div className="pt-6 type-caption">
        Preview · not published · expires {formatExpiry(article.expiresAt)}
      </div>

      <ArticleBody
        title={article.title}
        category={article.category}
        excerpt={article.excerpt}
        image={article.image}
        blocks={blocks}
        articleSlug={article.slug}
        heroImage="plain"
        bodyOverride={<ReaderComments token={token} blocks={blocks} articleSlug={article.slug} />}
      />
    </div>
  );
}
