import React from 'react';
import Link from 'next/link';
import { Article } from '@/lib/articles';

interface ArticleCardProps {
  article: Article;
  // Heading level for the title: h2 on the journal page (under its h1), h3 when
  // the card sits under a section heading (e.g. the homepage teaser).
  titleAs?: 'h2' | 'h3';
  // The image aspect ratio, so the homepage teaser can vary card heights.
  imageAspectClass?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  titleAs = 'h3',
  imageAspectClass = 'aspect-[4/3]',
}) => {
  const TitleTag = titleAs;
  return (
    <Link href={`/article/${article.slug}`} className="group">
      {article.image && (
        <div className={`${imageAspectClass} overflow-hidden bg-neutral-50 rounded mb-4`}>
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="space-y-2">
        {article.category && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{article.category}</span>
        )}
        <TitleTag className="text-lg font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
          {article.title}
        </TitleTag>
        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
        )}
      </div>
    </Link>
  );
};
