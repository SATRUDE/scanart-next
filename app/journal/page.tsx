import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Read about Scandinavian art, Nordic design, and the artists behind our curated collection.',
};

export default async function JournalPage() {
  const articles = await getAllArticles();

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-neutral-900 mb-2">Journal</h1>
        <p className="text-muted-foreground">{articles.length} articles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map(article => (
          <Link key={article.id} href={`/article/${article.slug}`} className="group">
            {article.featuredImage && (
              <div className="aspect-[4/3] overflow-hidden bg-neutral-50 rounded mb-4">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
                />
              </div>
            )}
            <div className="space-y-2">
              {article.category && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{article.category}</span>
              )}
              <h2 className="text-lg font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No articles yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
