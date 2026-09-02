import React from 'react';
import { OutboundLink } from '@/components/OutboundLink';
import { GalleryWallPlannerTeaser } from '@/components/GalleryWallPlannerTeaser';
import { galleryWallCalculatorInsertionIndex } from '@/lib/article-enhancements';

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
}

// Render a Notion rich-text array, preserving inline links and formatting.
// Previously every segment was rendered as plain text, which dropped links
// (Amazon links, internal /products and /artists links) and bold/italic.
function renderRichText(richText?: RichTextSegment[], articleSlug?: string): React.ReactNode {
  if (!richText) return null;
  return richText.map((seg, i) => {
    const annotations = seg.annotations || {};
    let node: React.ReactNode = seg.plain_text;

    if (annotations.code) node = <code className="bg-gray-100 px-1 py-0.5 rounded text-[0.9em]">{node}</code>;
    if (annotations.bold) node = <strong>{node}</strong>;
    if (annotations.italic) node = <em>{node}</em>;
    if (annotations.strikethrough) node = <s>{node}</s>;
    if (annotations.underline) node = <u>{node}</u>;

    const href = seg.href || seg.text?.link?.url;
    if (href) {
      const isExternal = /^https?:\/\//i.test(href);
      const className = 'underline underline-offset-2 hover:text-neutral-600 transition-colors';
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

export const NotionBlockRenderer: React.FC<NotionBlockRendererProps> = ({ blocks, articleSlug }) => {
  const renderBlock = (block: NotionBlock) => {
    const { id, type } = block;

    switch (type) {
      // A body heading_1 renders as <h2>, not <h1>: the article template already
      // gives the page its single <h1> (the title), so an <h1> here is a duplicate.
      // The classes are unchanged, so the heading looks exactly as it always has.
      // heading_2 and heading_3 keep their tags on purpose — most articles use
      // heading_2 for their sections, which is already correct under the page h1,
      // and demoting them would skip a level on every article with no heading_1.
      case 'heading_1':
        return (<h2 key={id} className="text-3xl font-bold mb-6 mt-8">{renderRichText(richTextOf(block, 'heading_1'), articleSlug)}</h2>);
      case 'heading_2':
        return (<h2 key={id} className="text-2xl font-semibold mb-4 mt-6">{renderRichText(richTextOf(block, 'heading_2'), articleSlug)}</h2>);
      case 'heading_3':
        return (<h3 key={id} className="text-xl font-medium mb-3 mt-5">{renderRichText(richTextOf(block, 'heading_3'), articleSlug)}</h3>);
      case 'paragraph':
        return (<p key={id} className="mb-4 leading-relaxed">{renderRichText(richTextOf(block, 'paragraph'), articleSlug)}</p>);
      case 'bulleted_list_item':
        return (<li key={id} className="mb-2 ml-4">{renderRichText(richTextOf(block, 'bulleted_list_item'), articleSlug)}</li>);
      case 'numbered_list_item':
        return (<li key={id} className="mb-2 ml-4">{renderRichText(richTextOf(block, 'numbered_list_item'), articleSlug)}</li>);
      case 'image': {
        const image = block.image as { file?: { url: string }; external?: { url: string }; caption?: RichTextSegment[] } | undefined;
        const imageUrl = image?.file?.url || image?.external?.url;
        return (
          <div key={id} className="my-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- Notion serves images from arbitrary signed URLs that next/image would refuse without a domain allowlist */}
            <img src={imageUrl} alt={image?.caption?.[0]?.plain_text || 'Article image'} className="w-full h-auto rounded-lg" />
            {image?.caption && image.caption.length > 0 && (
              <p className="text-sm text-gray-600 mt-2 text-center">{renderRichText(image.caption)}</p>
            )}
          </div>
        );
      }
      case 'quote':
        return (<blockquote key={id} className="border-l-4 border-gray-300 pl-4 my-6 italic">{renderRichText(richTextOf(block, 'quote'), articleSlug)}</blockquote>);
      case 'divider':
        return <hr key={id} className="my-8 border-gray-300" />;
      case 'code':
        // Code stays plain text (no inline links/formatting inside a code block)
        return (<pre key={id} className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>{(richTextOf(block, 'code') || []).map((seg, i) => <span key={i}>{seg.plain_text}</span>)}</code></pre>);
      default:
        return null;
    }
  };

  const renderBlocks = () => {
    const rendered: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let listType: 'bulleted' | 'numbered' | null = null;

    const flush = () => {
      if (currentList.length > 0) {
        if (listType === 'numbered') rendered.push(<ol key={`list-${rendered.length}`} className="mb-4">{currentList}</ol>);
        else rendered.push(<ul key={`list-${rendered.length}`} className="mb-4">{currentList}</ul>);
        currentList = [];
        listType = null;
      }
    };

    const calculatorInsertionIndex = galleryWallCalculatorInsertionIndex(blocks, articleSlug);

    blocks.forEach((block, index) => {
      if (block.type === 'bulleted_list_item') {
        if (listType !== 'bulleted') { flush(); listType = 'bulleted'; }
        currentList.push(renderBlock(block));
      } else if (block.type === 'numbered_list_item') {
        if (listType !== 'numbered') { flush(); listType = 'numbered'; }
        currentList.push(renderBlock(block));
      } else {
        flush();
        rendered.push(renderBlock(block));
      }

      if (index === calculatorInsertionIndex) {
        flush();
        rendered.push(<GalleryWallPlannerTeaser key="gallery-wall-planner-teaser" />);
      }
    });
    flush();
    return rendered;
  };

  return <div className="prose prose-lg max-w-none">{renderBlocks()}</div>;
};
