import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles';

interface ArticleCardProps {
  article: Article;
  // Heading level for the title: h2 on the journal page (under its h1), h3 when
  // the card sits under a section heading (e.g. the homepage teaser).
  titleAs?: 'h2' | 'h3';
  /**
   * The image aspect ratio. Story tiles sit at their own ratio (2:3, 4:5 or
   * 1:1, Figma Story tile 45:131), so a row of them is never a uniform grid;
   * the caller picks which. Responsive prefixes are fine ("aspect-[4/5]
   * tab:aspect-[2/3]").
   */
  imageAspectClass?: string;
  /**
   * Set on the one card above the fold so its image is preloaded rather than
   * lazy. Same prop name as PrintCard's, and like PrintCard it maps to
   * next/image's `preload` (Next 16 deprecated `priority` on the image itself).
   * Defaults to false, which is what the homepage teaser wants: those cards sit
   * at the bottom of the page and must stay lazy.
   */
  priority?: boolean;
  /** Responsive width hint; the default fits a three-column row. */
  sizes?: string;
  /** Visible category label (localised on /no); defaults to the raw category. */
  categoryLabel?: string;
  /** Show the excerpt under the title. Off in the V2 tile; kept for callers that still want it. */
  showExcerpt?: boolean;
  className?: string;
}

/**
 * Story tile (Figma 45:131): the room-scene image at its ratio, then 8 below
 * the category in text-accent Caption and the title in Body. No excerpt and no
 * price. The whole tile is one link, so the title is the anchor text.
 */
export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  titleAs = 'h3',
  imageAspectClass = 'aspect-[4/5]',
  priority = false,
  sizes = '(max-width: 833px) 100vw, 33vw',
  categoryLabel,
  showExcerpt = false,
  className = '',
}) => {
  const TitleTag = titleAs;
  return (
    <Link href={`/article/${article.slug}`} className={`group flex flex-col gap-tight ${className}`}>
      {article.image && (
        <div className={`relative ${imageAspectClass} w-full overflow-hidden bg-image-bg`}>
          <Image
            src={article.image}
            alt={article.imageAlt || article.title}
            style={article.image.includes('-room-') ? { objectPosition: 'center top' } : undefined}
            fill
            sizes={sizes}
            preload={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        {article.category && <p className="type-caption text-text-accent">{categoryLabel ?? article.category}</p>}
        <TitleTag className="type-body transition-colors group-hover:text-brand">{article.title}</TitleTag>
        {showExcerpt && article.excerpt && <p className="type-small">{article.excerpt}</p>}
      </div>
    </Link>
  );
};
