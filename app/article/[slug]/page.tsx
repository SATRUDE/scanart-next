import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllArticles, getArticleBySlug } from '@/lib/articles';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.featuredImage ? [article.featuredImage] : [],
      type: 'article',
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getAllArticles();
  const relatedArticles = allArticles
    .filter(a => a.id !== article.id)
    .slice(0, 3);

  return (
    <div className="container mx-auto px-8 py-8">
      <Link href="/journal" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Journal
      </Link>

      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          {article.category && (
            <span className="text-sm text-muted-foreground uppercase tracking-wider">{article.category}</span>
          )}
          <h1 className="text-4xl text-neutral-900 mt-2 mb-4">{article.title}</h1>
          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
          )}
        </header>

        {article.featuredImage && (
          <div className="aspect-[16/9] overflow-hidden bg-neutral-50 rounded mb-8">
            <img src={article.featuredImage} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-neutral max-w-none">
          {article.contentSection1 && <div dangerouslySetInnerHTML={{ __html: article.contentSection1 }} />}
          {article.contentSection2 && <div dangerouslySetInnerHTML={{ __html: article.contentSection2 }} />}
          {article.contentSection3 && <div dangerouslySetInnerHTML={{ __html: article.contentSection3 }} />}
        </div>

        {article.quoteText && (
          <blockquote className="my-12 border-l-4 border-primary pl-6 text-xl text-neutral-700 italic">
            <p>{article.quoteText}</p>
            {article.quoteAuthor && <cite className="text-sm text-muted-foreground not-italic mt-2 block">— {article.quoteAuthor}</cite>}
          </blockquote>
        )}
      </article>

      {relatedArticles.length > 0 && (
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl text-neutral-900 mb-8">More Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map(ra => (
              <Link key={ra.id} href={`/article/${ra.slug}`} className="group">
                {ra.featuredImage && (
                  <div className="aspect-[4/3] overflow-hidden bg-neutral-50 rounded mb-3">
                    <img src={ra.featuredImage} alt={ra.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  </div>
                )}
                <h3 className="text-sm font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">{ra.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt,
            image: article.featuredImage,
            datePublished: article.publishedDate,
            publisher: {
              '@type': 'Organization',
              name: 'Scandinavian Art Gallery',
            },
          }),
        }}
      />
    </div>
  );
}
