import React from 'react';

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

interface NotionBlockRendererProps {
  blocks: NotionBlock[];
}

export const NotionBlockRenderer: React.FC<NotionBlockRendererProps> = ({ blocks }) => {
  const renderBlock = (block: NotionBlock) => {
    const { id, type } = block;

    switch (type) {
      case 'heading_1':
        return (<h1 key={id} className="text-3xl font-bold mb-6 mt-8">{block.heading_1?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</h1>);
      case 'heading_2':
        return (<h2 key={id} className="text-2xl font-semibold mb-4 mt-6">{block.heading_2?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</h2>);
      case 'heading_3':
        return (<h3 key={id} className="text-xl font-medium mb-3 mt-5">{block.heading_3?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</h3>);
      case 'paragraph':
        return (<p key={id} className="mb-4 leading-relaxed">{block.paragraph?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</p>);
      case 'bulleted_list_item':
        return (<li key={id} className="mb-2 ml-4">{block.bulleted_list_item?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</li>);
      case 'numbered_list_item':
        return (<li key={id} className="mb-2 ml-4">{block.numbered_list_item?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</li>);
      case 'image': {
        const imageUrl = block.image?.file?.url || block.image?.external?.url;
        return (
          <div key={id} className="my-6">
            <img src={imageUrl} alt={block.image?.caption?.[0]?.plain_text || 'Article image'} className="w-full h-auto rounded-lg" />
            {block.image?.caption?.length > 0 && (
              <p className="text-sm text-gray-600 mt-2 text-center">{block.image.caption.map((c: any, i: number) => <span key={i}>{c.plain_text}</span>)}</p>
            )}
          </div>
        );
      }
      case 'quote':
        return (<blockquote key={id} className="border-l-4 border-gray-300 pl-4 my-6 italic">{block.quote?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</blockquote>);
      case 'divider':
        return <hr key={id} className="my-8 border-gray-300" />;
      case 'code':
        return (<pre key={id} className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>{block.code?.rich_text?.map((text: any, i: number) => <span key={i}>{text.plain_text}</span>)}</code></pre>);
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
