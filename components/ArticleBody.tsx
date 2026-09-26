import type { ReactNode } from 'react';
import Image from 'next/image';
import { NotionBlockRenderer, ARTICLE_TEXT_COLUMN } from '@/components/NotionBlockRenderer';
import type { NotionBlock } from '@/lib/articles';

export interface ArticleBodyProps {
  title: string;
  category?: string;
  excerpt?: string;
  image?: string;
  imageAlt?: string;
  blocks: NotionBlock[];
  articleSlug?: string;
  /** Above the title: the live page's visible breadcrumb. */
  breadcrumb?: ReactNode;
  /** Under the lead: the "4 min read — 7 prints" line and the share links. */
  meta?: ReactNode;
  /** Under the hero image, 8 below on its left edge ("Hyttefrokost — Sia Siamos"). */
  heroCaption?: ReactNode;
  /** Replaces the default NotionBlockRenderer, e.g. the preview page's
   *  per-block ReaderComments wrapper. Omit for the plain renderer. */
  bodyOverride?: ReactNode;
  /** Rendered inside the article, after the body, on the text column — e.g.
   *  the live page's "Keep browsing" footer. Absent on the preview page. */
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
 * The header/hero/prose layout shared by the live article page
 * (app/(en)/article/[slug]/page.tsx) and the draft preview
 * (app/(en)/preview/[token]/page.tsx), so a published piece looks identical
 * to its own preview modulo the preview's top bar and comment affordances.
 *
 * V2 (Figma Article 75:220 / 190:1489): breadcrumb, the title as the page's
 * one H1 in Display (Mobile H1), the excerpt as the lead on 7 columns and the
 * meta line; the hero across the frame (full bleed and 4:5 on mobile); then
 * the body on a 12-column grid, running text on columns 4-9. Callers render
 * it inside `page-x`.
 */
export function ArticleBody({
  title,
  category,
  excerpt,
  image,
  imageAlt,
  blocks,
  articleSlug,
  breadcrumb,
  meta,
  heroCaption,
  bodyOverride,
  children,
  heroImage = 'optimized',
}: ArticleBodyProps) {
  return (
    <article>
      <header className="flex flex-col gap-4 pt-10 tab:gap-group tab:pt-band">
        {breadcrumb}
        {/* The category only where there is no breadcrumb to carry it (the preview). */}
        {!breadcrumb && category && <p className="type-caption">{category}</p>}
        <h1 className="type-h1 tab:type-display tab:max-w-[1061px]">{title}</h1>
        {(excerpt || meta) && (
          <div className="flex flex-col gap-4 tab:gap-group tab:pt-4">
            {excerpt && <p className="type-lead desk:max-w-[733px]">{excerpt}</p>}
            {meta}
          </div>
        )}
      </header>

      {image && (
        <figure className="mt-8 flex flex-col gap-tight tab:mt-band">
          {/* Full bleed on mobile (out through the page margin), the 1280 frame at 2:1 from tablet. */}
          <div className="relative -mx-margin aspect-[4/5] overflow-hidden bg-image-bg tab:mx-0 tab:aspect-[2/1]">
            {heroImage === 'plain' ? (
              // eslint-disable-next-line @next/next/no-img-element -- a draft's hero can be on any host socialagent serves preview media from, which next/image would refuse without a matching remotePattern
              <img src={image} alt={imageAlt || title} className="h-full w-full object-cover" style={image.includes('-room-') ? { objectPosition: 'center top' } : undefined} />
            ) : (
              // The article's LCP element, so it is preloaded (docs/v2-seo.md).
              <Image
                src={image}
                alt={imageAlt || title}
                style={image.includes('-room-') ? { objectPosition: 'center 30%' } : undefined}
                fill
                sizes="(max-width: 1439px) 100vw, 1280px"
                className="object-cover"
                preload
              />
            )}
          </div>
          {heroCaption && <figcaption className="type-caption">{heroCaption}</figcaption>}
        </figure>
      )}

      <div className="mt-12 tab:mt-24 desk:mt-32">
        {bodyOverride ? (
          <div className="page-grid">
            <div className={ARTICLE_TEXT_COLUMN}>{bodyOverride}</div>
          </div>
        ) : (
          blocks.length > 0 && <NotionBlockRenderer blocks={blocks} articleSlug={articleSlug} />
        )}
      </div>

      {children && (
        <div className="page-grid">
          <div className={ARTICLE_TEXT_COLUMN}>{children}</div>
        </div>
      )}
    </article>
  );
}
