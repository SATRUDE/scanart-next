import type { ReactNode } from 'react';
import Image from 'next/image';
import { NotionBlockRenderer } from '@/components/NotionBlockRenderer';
import type { NotionBlock } from '@/lib/articles';

export interface ArticleBodyProps {
  title: string;
  category?: string;
  excerpt?: string;
  image?: string;
  blocks: NotionBlock[];
  articleSlug?: string;
  /** Replaces the default NotionBlockRenderer, e.g. the preview page's
   *  per-block ReaderComments wrapper. Omit for the plain renderer. */
  bodyOverride?: ReactNode;
  /** Rendered inside the article, after the body — e.g. the live page's
   *  "Keep browsing" footer. Absent on the preview page. */
  children?: ReactNode;
  /**
   * 'optimized' (default) routes the hero through next/image, which refuses
   * a host absent from next.config.ts's images.remotePatterns — true of
   * every published article's image today. The preview page passes 'plain'
   * (a bare <img>, same reasoning NotionBlockRenderer already uses for
   * in-body images): a draft's hero can live on any host socialagent
   * happens to serve draft media from, which that allowlist can't promise.
   */
  heroImage?: 'optimized' | 'plain';
}

/**
 * The hero/standfirst/prose layout shared by the live article page
 * (app/(en)/article/[slug]/page.tsx) and the draft preview
 * (app/(en)/preview/[token]/page.tsx). Pulled out of the article page
 * verbatim (2026-09) so the preview route doesn't duplicate it: same
 * classes, same structure, so a published piece looks identical to its own
 * preview modulo the preview's top bar and comment affordances.
 */
export function ArticleBody({
  title,
  category,
  excerpt,
  image,
  blocks,
  articleSlug,
  bodyOverride,
  children,
  heroImage = 'optimized',
}: ArticleBodyProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        {category && (
          <span className="text-sm text-muted-foreground uppercase tracking-wider">{category}</span>
        )}
        <h1 className="text-4xl text-neutral-900 mt-2 mb-4">{title}</h1>
        {excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed">{excerpt}</p>
        )}
      </header>

      {image && (
        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-50 rounded mb-8">
          {heroImage === 'plain' ? (
            // eslint-disable-next-line @next/next/no-img-element -- a draft's hero can be on any host socialagent serves preview media from, which next/image would refuse without a matching remotePattern
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              preload
            />
          )}
        </div>
      )}

      {bodyOverride ?? (blocks.length > 0 && (
        <NotionBlockRenderer blocks={blocks} articleSlug={articleSlug} />
      ))}

      {children}
    </article>
  );
}
