import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles';

interface ArticleCardProps {
  article: Article;
  // Heading level for the title: h2 on the journal page (under its h1), h3 when
  // the card sits under a section heading (e.g. the homepage teaser).
  titleAs?: 'h2' | 'h3';
  // The image aspect ratio, so the homepage teaser can vary card heights.
  imageAspectClass?: string;
  /**
   * Set on the one card above the fold so its image is preloaded rather than
   * lazy. Same prop name as PrintCard's, and like PrintCard it maps to
   * next/image's `preload` (Next 16 deprecated `priority` on the image itself).
   * Defaults to false, which is what the homepage teaser wants: those cards sit
   * at the bottom of the page and must stay lazy.
   */
  priority?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  titleAs = 'h3',
  imageAspectClass = 'aspect-[4/3]',
  priority = false,
}) => {
  const TitleTag = titleAs;
  return (
    <Link href={`/article/${article.slug}`} className="group">
      {article.image && (
        <div className={`relative ${imageAspectClass} overflow-hidden bg-neutral-50 rounded mb-4`}>
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            preload={priority}
            className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
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
