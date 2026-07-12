import React from 'react';

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
}

// Render a Notion rich-text array, preserving inline links and formatting.
// Previously every segment was rendered as plain text, which dropped links
// (Amazon links, internal /products and /artists links) and bold/italic.
function renderRichText(richText?: RichTextSegment[]): React.ReactNode {
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
      node = (
        <a
          href={href}
          className="underline underline-offset-2 hover:text-neutral-600 transition-colors"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
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

export const NotionBlockRenderer: React.FC<NotionBlockRendererProps> = ({ blocks }) => {
  const renderBlock = (block: NotionBlock) => {
    const { id, type } = block;

    switch (type) {
      case 'heading_1':
        return (<h1 key={id} className="text-3xl font-bold mb-6 mt-8">{renderRichText(richTextOf(block, 'heading_1'))}</h1>);
      case 'heading_2':
        return (<h2 key={id} className="text-2xl font-semibold mb-4 mt-6">{renderRichText(richTextOf(block, 'heading_2'))}</h2>);
      case 'heading_3':
        return (<h3 key={id} className="text-xl font-medium mb-3 mt-5">{renderRichText(richTextOf(block, 'heading_3'))}</h3>);
      case 'paragraph':
        return (<p key={id} className="mb-4 leading-relaxed">{renderRichText(richTextOf(block, 'paragraph'))}</p>);
      case 'bulleted_list_item':
        return (<li key={id} className="mb-2 ml-4">{renderRichText(richTextOf(block, 'bulleted_list_item'))}</li>);
      case 'numbered_list_item':
        return (<li key={id} className="mb-2 ml-4">{renderRichText(richTextOf(block, 'numbered_list_item'))}</li>);
      case 'image': {
        const image = block.image as { file?: { url: string }; external?: { url: string }; caption?: RichTextSegment[] } | undefined;
        const imageUrl = image?.file?.url || image?.external?.url;
        return (
          <div key={id} className="my-6">
            <img src={imageUrl} alt={image?.caption?.[0]?.plain_text || 'Article image'} className="w-full h-auto rounded-lg" />
            {image?.caption && image.caption.length > 0 && (
              <p className="text-sm text-gray-600 mt-2 text-center">{renderRichText(image.caption)}</p>
            )}
          </div>
        );
      }
      case 'quote':
        return (<blockquote key={id} className="border-l-4 border-gray-300 pl-4 my-6 italic">{renderRichText(richTextOf(block, 'quote'))}</blockquote>);
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

    blocks.forEach(block => {
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
    });
    flush();
    return rendered;
  };

  return <div className="prose prose-lg max-w-none">{renderBlocks()}</div>;
};
