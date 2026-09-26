// Markdown -> Notion-shaped block JSON, the exact conversion
// `scripts/sync-articles.mjs` used to do inline. Moved here (2026-09) so the
// preview route (app/(en)/preview/[token]/page.tsx) can convert a draft's
// markdown body on the fly, at request time, the same way the sync script
// converts a published one at build time — one converter, two callers, the
// same output NotionBlockRenderer already knows how to read.
//
// The script itself stays a plain-`node`-runnable .mjs (no ts-node/tsx as a
// new runtime dependency): it reaches this module through the small shim at
// scripts/markdown-blocks-shim.mjs, not by importing this file directly.
//
// Paragraph joining: markdown convention treats two lines separated by a
// single newline (no blank line between them) as one hard-wrapped paragraph.
// This converter does NOT do that — every non-blank line still becomes its
// own block, exactly as `scripts/sync-articles.mjs` always has. Checked
// against two committed block files (public/notion-data/c8kx92f8injmsnh34rx.json,
// c9df4bebe2be51e1b38bd6ca1.json): every paragraph block in both is a
// complete, independently punctuated sentence or two, not a fragment that
// continues into the next block, so nothing in the already-synced articles
// looks like a hard-wrapped paragraph split across lines that joining would
// repair. Joining would instead risk merging genuinely separate short
// paragraphs (several appear back to back) into one block and losing the
// paragraph gap between them on every existing article. Kept as-is.
import { stripNotes } from '@/lib/notes';

export interface RichTextSegment {
  type: 'text';
  plain_text: string;
  href: string | null;
  text: { content: string; link: { url: string } | null };
  annotations: {
    bold: boolean;
    italic: boolean;
    code: boolean;
    strikethrough: boolean;
    underline: boolean;
  };
}

export interface NotionBlock {
  object: 'block';
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
}

interface SegmentOptions {
  href?: string | null;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

function segment(content: string, opts: SegmentOptions = {}): RichTextSegment {
  return {
    type: 'text',
    plain_text: content,
    href: opts.href ?? null,
    text: { content, link: opts.href ? { url: opts.href } : null },
    annotations: {
      bold: Boolean(opts.bold),
      italic: Boolean(opts.italic),
      code: Boolean(opts.code),
      strikethrough: false,
      underline: false,
    },
  };
}

const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;

// Inline markdown -> rich-text segments. Link text gets a nested pass so
// [**bold**](url) keeps both the link and the bold.
function inlineToSegments(text: string, inherited: SegmentOptions = {}): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index === undefined) continue;
    if (m.index > last) segments.push(segment(text.slice(last, m.index), inherited));
    if (m[1] !== undefined) {
      segments.push(...inlineToSegments(m[1], { ...inherited, href: m[2] }));
    } else if (m[3] !== undefined) {
      segments.push(segment(m[3], { ...inherited, bold: true }));
    } else if (m[4] !== undefined) {
      segments.push(segment(m[4], { ...inherited, italic: true }));
    } else {
      segments.push(segment(m[5], { ...inherited, code: true }));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push(segment(text.slice(last), inherited));
  return segments.filter((s) => s.plain_text.length > 0);
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

// The two journal modules markdown has no word for (Figma Article 194:5979).
// Both are written as lines that read as plain text anywhere this converter
// is not the one doing the reading (socialagent's editor, a feed, a diff), so
// an unsupported renderer shows a stray line, never broken HTML.
//
//   ::print[hummer-og-vin]           the Print feature, by product slug
//
//   ::images                         an image row, running off the right edge
//   ![Alt text](/images/a.jpg "Sunday Brunch | Hedvig Wallin")
//   ![Alt text](https://…/b.jpg)
//   ::
//
// Alt text is required in a row: a line with an empty alt is dropped. The
// optional "title" is the caption; a " | " in it becomes the brand hairline.
const PRINT_LINE = /^::print\[([a-z0-9][a-z0-9-]*)\]$/i;
const ROW_OPEN = '::images';
const ROW_CLOSE = '::';
const ROW_IMAGE_LINE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;

export interface ImageRowItem {
  url: string;
  alt: string;
  /** Caption parts, shown with the hairline between them; empty for none. */
  caption: string[];
}

/** One image line inside an `::images` row, or null if it is not one Ken may use. */
export function parseRowImage(line: string): ImageRowItem | null {
  const m = ROW_IMAGE_LINE.exec(line.trim());
  if (!m) return null;
  const alt = m[1].trim();
  if (!alt) return null;
  const caption = (m[3] ?? '')
    .split(' | ')
    .map((part) => part.trim())
    .filter(Boolean);
  return { url: m[2], alt, caption };
}

/**
 * Convert a markdown body into the Notion-shaped block array
 * `NotionBlockRenderer` and `lib/articles.ts#getArticleBlocks` already
 * consume. `[note: …]` asides are stripped first (see lib/notes.ts) so a
 * private editorial aside never reaches a rendered block, matching the
 * guarantee socialagent's own preview endpoint makes for its payload.
 */
export function markdownToBlocks(markdown: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  let n = 0;
  const push = (type: string, text: string) => {
    blocks.push({
      object: 'block',
      id: `md-${++n}`,
      type,
      has_children: false,
      [type]: type === 'divider' ? {} : { rich_text: inlineToSegments(text) },
    });
  };
  const pushImage = (alt: string, url: string) => {
    blocks.push({
      object: 'block',
      id: `md-${++n}`,
      type: 'image',
      has_children: false,
      image: {
        external: { url },
        // Empty rather than a one-item array holding a blank caption: with an
        // alt of '' NotionBlockRenderer would still render the caption <p>
        // (its check is on caption.length, not on the text inside), just with
        // nothing in it.
        caption: alt ? [segment(alt)] : [],
      },
    });
  };

  const pushBlock = (type: string, payload: Record<string, unknown>) => {
    blocks.push({ object: 'block', id: `md-${++n}`, type, has_children: false, [type]: payload });
  };

  // The image row being collected, from its `::images` line to its `::`.
  let row: ImageRowItem[] | null = null;
  const closeRow = () => {
    if (row && row.length > 0) pushBlock('image_row', { images: row });
    row = null;
  };

  for (const raw of stripNotes(markdown ?? '').split(/\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (row) {
      const trimmed = line.trim();
      if (trimmed === ROW_CLOSE) {
        closeRow();
        continue;
      }
      if (ROW_IMAGE_LINE.test(trimmed)) {
        // A line without alt text is left out rather than shown unlabelled.
        const item = parseRowImage(trimmed);
        if (item) row.push(item);
        continue;
      }
      // Anything else ends a row whose `::` was forgotten, and is read as usual.
      closeRow();
    }
    if (line.trim() === ROW_OPEN) {
      row = [];
      continue;
    }
    // A stray closing line on its own says nothing to a reader.
    if (line.trim() === ROW_CLOSE) continue;
    const print = PRINT_LINE.exec(line.trim());
    if (print) {
      pushBlock('print_feature', { slug: print[1].toLowerCase() });
      continue;
    }
    const image = IMAGE_LINE.exec(line);
    if (image) pushImage(image[1], image[2]);
    else if (line.startsWith('### ')) push('heading_3', line.slice(4));
    else if (line.startsWith('## ')) push('heading_2', line.slice(3));
    else if (line.startsWith('# ')) push('heading_1', line.slice(2));
    else if (line.startsWith('- ')) push('bulleted_list_item', line.slice(2));
    else if (/^\d+\. /.test(line)) push('numbered_list_item', line.replace(/^\d+\. /, ''));
    else if (line.startsWith('> ')) push('quote', line.slice(2));
    else if (line === '---') push('divider', '');
    else push('paragraph', line);
  }
  closeRow();
  return blocks;
}
