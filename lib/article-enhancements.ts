interface RichTextSegment {
  plain_text?: string;
}

interface ArticleBlock {
  type: string;
  [key: string]: unknown;
}

const GALLERY_WALL_SLUG = 'create-an-art-wall';
const SPACING_HEADING = 'space the pieces like they know each other';

function blockText(block: ArticleBlock): string {
  const payload = block[block.type] as { rich_text?: RichTextSegment[] } | undefined;
  return (payload?.rich_text ?? []).map(segment => segment.plain_text ?? '').join('').trim();
}

/** Return the block index after which the spacing calculator should appear. */
export function galleryWallCalculatorInsertionIndex(
  blocks: ArticleBlock[],
  articleSlug?: string,
): number {
  if (articleSlug !== GALLERY_WALL_SLUG) return -1;

  const headingIndex = blocks.findIndex(
    block => block.type.startsWith('heading_') && blockText(block).toLowerCase() === SPACING_HEADING,
  );
  if (headingIndex < 0) return -1;

  const adviceIndex = blocks.findIndex(
    (block, index) => index > headingIndex && block.type === 'paragraph',
  );
  return adviceIndex;
}

