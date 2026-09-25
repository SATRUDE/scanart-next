import React from 'react';
import { OutboundLink } from '@/components/OutboundLink';
import { GalleryWallPlannerTeaser } from '@/components/GalleryWallPlannerTeaser';
import { galleryWallCalculatorInsertionIndex } from '@/lib/article-enhancements';
import { ListItem } from '@/components/v2/ui';

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface RichTextSegment {
  plain_text: string;
  href?: string | null;
  text?: { link?: { url: string } | null };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}

interface NotionBlockRendererProps {
  blocks: NotionBlock[];
  /** The article these blocks belong to, so an outbound click can be attributed
   *  to the piece that sent it. Optional: a caller with no slug still renders. */
  articleSlug?: string;
  /**
   * 'grid' (default): the V2 article body, a page-grid where running text sits
   * on columns 4-9 (after a 3-column rail) and a pull quote runs to 9 columns
   * (Figma Article 75:220). 'column': one plain column, for callers that
   * render a block at a time inside their own column (ReaderComments).
   */
  layout?: 'grid' | 'column';
}

/** The article's running-text column: after the 3-column rail on desktop. */
export const ARTICLE_TEXT_COLUMN = 'col-span-full tab:col-start-2 tab:col-span-6 desk:col-start-4 desk:col-span-6';
/** The pull quote: 9 columns from the same line. */
const ARTICLE_QUOTE_COLUMN = 'col-span-full tab:col-start-2 tab:col-span-7 desk:col-start-4 desk:col-span-9';

const HEADING_TYPES = new Set(['heading_1', 'heading_2', 'heading_3']);
const BREAKOUT_TYPES = new Set(['image', 'quote']);

/**
 * The space above a block, from the four tiers (layout.md rule 2): a section
 * heading opens with the section gap (48 / 80 / 128), a figure or pull quote
 * sits a block away from the text either side, everything else is a group (24).
 */
function spaceAbove(prev: string | null, type: string): string {
  if (prev === null) return '';
  if (HEADING_TYPES.has(type)) return type === 'heading_3' ? 'mt-10 tab:mt-band' : 'mt-12 tab:mt-20 desk:mt-32';
  if (BREAKOUT_TYPES.has(type) || BREAKOUT_TYPES.has(prev)) return 'mt-10 tab:mt-band desk:mt-24';
  return 'mt-6';
}

// Render a Notion rich-text array, preserving inline links and formatting.
// Previously every segment was rendered as plain text, which dropped links
// (Amazon links, internal /products and /artists links) and bold/italic.
function renderRichText(richText?: RichTextSegment[], articleSlug?: string): React.ReactNode {
  if (!richText) return null;
  return richText.map((seg, i) => {
    const annotations = seg.annotations || {};
    let node: React.ReactNode = seg.plain_text;

    if (annotations.code) node = <code className="bg-surface px-1 py-0.5 text-[0.9em]">{node}</code>;
    if (annotations.bold) node = <strong>{node}</strong>;
    if (annotations.italic) node = <em>{node}</em>;
    if (annotations.strikethrough) node = <s>{node}</s>;
    if (annotations.underline) node = <u>{node}</u>;

    const href = seg.href || seg.text?.link?.url;
    if (href) {
      const isExternal = /^https?:\/\//i.test(href);
      // V2: links are never underlined; text-accent, ink on hover.
      const className = 'text-text-accent transition-colors hover:text-ink';
      // External links go through OutboundLink so the click is recorded; the
      // rendered anchor, its classes and its rel/target are unchanged.
      node = isExternal ? (
        <OutboundLink href={href} articleSlug={articleSlug} label={seg.plain_text} className={className}>
          {node}
        </OutboundLink>
      ) : (
        <a href={href} className={className}>
          {node}
        </a>
      );
    }

    return <span key={i}>{node}</span>;
  });
}

// Pull a typed rich_text array off a block's type-specific payload.
function richTextOf(block: NotionBlock, key: string): RichTextSegment[] | undefined {
  const payload = block[key] as { rich_text?: RichTextSegment[] } | undefined;
  return payload?.rich_text;
}

export const NotionBlockRenderer: React.FC<NotionBlockRendererProps> = ({ blocks, articleSlug, layout = 'grid' }) => {
  const grid = layout === 'grid';
  const text = grid ? ARTICLE_TEXT_COLUMN : '';
  const quoteColumn = grid ? ARTICLE_QUOTE_COLUMN : '';

  const renderBlock = (block: NotionBlock, space: string, listIndex = 0) => {
    const { id, type } = block;

    switch (type) {
      // A body heading_1 renders as <h2>, not <h1>: the article template already
      // gives the page its single <h1> (the title), so an <h1> here is a duplicate.
      // It takes the same V2 style as heading_2 (the H3 text style, which is what
      // the Figma article uses for its section heads under the Display title).
      // heading_2 and heading_3 keep their tags on purpose — most articles use
      // heading_2 for their sections, which is already correct under the page h1,
      // and demoting them would skip a level on every article with no heading_1.
      case 'heading_1':
        return (<h2 key={id} className={`${text} ${space} type-h3`}>{renderRichText(richTextOf(block, 'heading_1'), articleSlug)}</h2>);
      case 'heading_2':
        return (<h2 key={id} className={`${text} ${space} type-h3`}>{renderRichText(richTextOf(block, 'heading_2'), articleSlug)}</h2>);
      case 'heading_3':
        // A sub-head: the serif at the Mobile/H3 size on every screen, a step
        // below the section head.
        return (<h3 key={id} className={`${text} ${space} font-serif text-[22px] leading-[28px]`}>{renderRichText(richTextOf(block, 'heading_3'), articleSlug)}</h3>);
      case 'paragraph':
        return (<p key={id} className={`${text} ${space} type-body`}>{renderRichText(richTextOf(block, 'paragraph'), articleSlug)}</p>);
      case 'bulleted_list_item':
        return (<ListItem key={id} type="bullet">{renderRichText(richTextOf(block, 'bulleted_list_item'), articleSlug)}</ListItem>);
      case 'numbered_list_item':
        // Serif numerals in text-accent, 01, 02, 03 (layout.md rule 12).
        return (<ListItem key={id} type="number" number={String(listIndex + 1).padStart(2, '0')}>{renderRichText(richTextOf(block, 'numbered_list_item'), articleSlug)}</ListItem>);
      case 'image': {
        const image = block.image as { file?: { url: string }; external?: { url: string }; caption?: RichTextSegment[] } | undefined;
        const imageUrl = image?.file?.url || image?.external?.url;
        // Figure 258:3946: the image at its own ratio on the text column, the
        // caption 8 below on its left edge.
        return (
          <figure key={id} className={`${text} ${space} flex flex-col gap-tight`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Notion serves images from arbitrary signed URLs that next/image would refuse without a domain allowlist */}
            <img src={imageUrl} alt={image?.caption?.[0]?.plain_text || 'Article image'} loading="lazy" className="h-auto w-full bg-image-bg" />
            {image?.caption && image.caption.length > 0 && (
              <figcaption className="type-caption">{renderRichText(image.caption)}</figcaption>
            )}
          </figure>
        );
      }
      case 'quote':
        // Pull quote: H1 on 9 columns under a rule (no rule on mobile).
        return (<blockquote key={id} className={`${quoteColumn} ${space} type-h1 tab:border-t tab:border-ink tab:pt-band`}>{renderRichText(richTextOf(block, 'quote'), articleSlug)}</blockquote>);
      case 'divider':
        return <hr key={id} className={`${text} ${space} border-line`} />;
      case 'code':
        // Code stays plain text (no inline links/formatting inside a code block)
        return (<pre key={id} className={`${text} ${space} overflow-x-auto bg-surface p-4 type-small`}><code>{(richTextOf(block, 'code') || []).map((seg, i) => <span key={i}>{seg.plain_text}</span>)}</code></pre>);
      default:
        return null;
    }
  };

  const renderBlocks = () => {
    const rendered: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let listType: 'bulleted' | 'numbered' | null = null;
    let listSpace = '';
    let prev: string | null = null;

    const flush = () => {
      if (currentList.length > 0) {
        const cls = `${text} ${listSpace} flex flex-col gap-4`;
        if (listType === 'numbered') rendered.push(<ol key={`list-${rendered.length}`} className={cls}>{currentList}</ol>);
        else rendered.push(<ul key={`list-${rendered.length}`} className={cls}>{currentList}</ul>);
        currentList = [];
        listType = null;
      }
    };

    const calculatorInsertionIndex = galleryWallCalculatorInsertionIndex(blocks, articleSlug);

    blocks.forEach((block, index) => {
      if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
        const kind = block.type === 'bulleted_list_item' ? 'bulleted' : 'numbered';
        if (listType !== kind) {
          flush();
          listType = kind;
          listSpace = spaceAbove(prev, 'list');
        }
        currentList.push(renderBlock(block, '', currentList.length));
      } else {
        flush();
        rendered.push(renderBlock(block, spaceAbove(prev, block.type)));
      }
      prev = block.type === 'bulleted_list_item' || block.type === 'numbered_list_item' ? 'list' : block.type;

      if (index === calculatorInsertionIndex && articleSlug) {
        flush();
        rendered.push(
          <div key="gallery-wall-planner-teaser" className={`${text} mt-10 tab:mt-band`}>
            <GalleryWallPlannerTeaser articleSlug={articleSlug} />
          </div>
        );
        prev = 'image';
      }
    });
    flush();
    return rendered;
  };

  return <div className={grid ? 'page-grid' : 'flex flex-col'}>{renderBlocks()}</div>;
};
