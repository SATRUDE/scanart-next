import { describe, expect, it } from 'vitest';

import { markdownToBlocks } from '@/lib/markdown-blocks';

function richText(block: { [key: string]: unknown }, type: string) {
  return (block[type] as { rich_text: { plain_text: string }[] }).rich_text;
}

describe('markdownToBlocks', () => {
  it('converts headings to heading_1/2/3', () => {
    const blocks = markdownToBlocks('# One\n## Two\n### Three');
    expect(blocks.map((b) => b.type)).toEqual(['heading_1', 'heading_2', 'heading_3']);
    expect(richText(blocks[0], 'heading_1')[0].plain_text).toBe('One');
    expect(richText(blocks[1], 'heading_2')[0].plain_text).toBe('Two');
    expect(richText(blocks[2], 'heading_3')[0].plain_text).toBe('Three');
  });

  it('converts bulleted and numbered list lines', () => {
    const blocks = markdownToBlocks('- first\n- second\n1. one\n2. two');
    expect(blocks.map((b) => b.type)).toEqual([
      'bulleted_list_item',
      'bulleted_list_item',
      'numbered_list_item',
      'numbered_list_item',
    ]);
    expect(richText(blocks[0], 'bulleted_list_item')[0].plain_text).toBe('first');
    expect(richText(blocks[2], 'numbered_list_item')[0].plain_text).toBe('one');
  });

  it('converts a quote and a divider', () => {
    const blocks = markdownToBlocks('> a quote\n\n---');
    expect(blocks.map((b) => b.type)).toEqual(['quote', 'divider']);
    expect(richText(blocks[0], 'quote')[0].plain_text).toBe('a quote');
    expect(blocks[1].divider).toEqual({});
  });

  it('keeps a link as its own segment with href set', () => {
    const blocks = markdownToBlocks('See [our prints](https://example.com/products) today.');
    const segs = richText(blocks[0], 'paragraph');
    expect(segs.map((s) => s.plain_text)).toEqual(['See ', 'our prints', ' today.']);
    const link = segs[1] as unknown as { href: string | null; text: { link: { url: string } | null } };
    expect(link.href).toBe('https://example.com/products');
    expect(link.text.link).toEqual({ url: 'https://example.com/products' });
  });

  it('keeps bold formatting nested inside a link', () => {
    const blocks = markdownToBlocks('[**bold link**](https://example.com)');
    const segs = richText(blocks[0], 'paragraph') as unknown as {
      plain_text: string;
      href: string | null;
      annotations: { bold: boolean };
    }[];
    expect(segs).toHaveLength(1);
    expect(segs[0].plain_text).toBe('bold link');
    expect(segs[0].href).toBe('https://example.com');
    expect(segs[0].annotations.bold).toBe(true);
  });

  it('converts a standalone image line to an image block matching NotionBlockRenderer', () => {
    const blocks = markdownToBlocks('![A gallery wall](https://example.com/hero.jpg)');
    expect(blocks).toHaveLength(1);
    const image = blocks[0].image as {
      external: { url: string };
      caption: { plain_text: string }[];
    };
    expect(blocks[0].type).toBe('image');
    expect(image.external.url).toBe('https://example.com/hero.jpg');
    expect(image.caption[0].plain_text).toBe('A gallery wall');
  });

  it('gives an image with no alt text an empty caption array', () => {
    const blocks = markdownToBlocks('![](https://example.com/hero.jpg)');
    const image = blocks[0].image as { caption: unknown[] };
    expect(image.caption).toEqual([]);
  });

  it('strips a [note: …] aside before converting, same as socialagent', () => {
    const blocks = markdownToBlocks('Paragraph one.\n\n[note: ask Mark about this]\n\nParagraph two.');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
    expect(richText(blocks[0], 'paragraph')[0].plain_text).toBe('Paragraph one.');
    expect(richText(blocks[1], 'paragraph')[0].plain_text).toBe('Paragraph two.');
  });

  it('keeps each non-blank line as its own paragraph block (no joining)', () => {
    const blocks = markdownToBlocks('Line one.\nLine two.');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
    expect(richText(blocks[0], 'paragraph')[0].plain_text).toBe('Line one.');
    expect(richText(blocks[1], 'paragraph')[0].plain_text).toBe('Line two.');
  });

  it('skips blank lines and assigns sequential block ids', () => {
    const blocks = markdownToBlocks('# Heading\n\nBody text.');
    expect(blocks.map((b) => b.id)).toEqual(['md-1', 'md-2']);
  });

  it('returns an empty array for empty or undefined markdown', () => {
    expect(markdownToBlocks('')).toEqual([]);
    expect(markdownToBlocks(undefined as unknown as string)).toEqual([]);
  });
});
