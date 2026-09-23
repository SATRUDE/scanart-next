interface RichTextSegment {
  plain_text?: string;
}

interface ArticleBlock {
  type: string;
  [key: string]: unknown;
}

// Editorial placements checked against the published article bodies on 23 Sep.
// A changed or missing heading skips the teaser rather than guessing a place.
const PLANNER_HEADINGS: Record<string, string> = {
  'create-an-art-wall': 'space the pieces like they know each other',
  'scandinavian-wall-decor-ideas': '2. a gallery wall with breathing room',
  'complete-guide-choosing-print-sizes': 'the tape test: try before you buy',
  'how-to-style-scandinavian-wall-art-living-room': 'the feature wall',
};

function blockText(block: ArticleBlock): string {
  const payload = block[block.type] as { rich_text?: RichTextSegment[] } | undefined;
  return (payload?.rich_text ?? []).map(segment => segment.plain_text ?? '').join('').trim();
}

/** Return the block index after which the planner teaser should appear. */
export function galleryWallCalculatorInsertionIndex(
  blocks: ArticleBlock[],
  articleSlug?: string,
): number {
  const heading = articleSlug ? PLANNER_HEADINGS[articleSlug] : undefined;
  if (!heading) return -1;

  const headingIndex = blocks.findIndex(
    block => block.type.startsWith('heading_') && blockText(block).toLowerCase() === heading,
  );
  if (headingIndex < 0) return -1;

  // Stay within the selected section if its opening paragraph is removed.
  for (let i = headingIndex + 1; i < blocks.length; i++) {
    if (blocks[i].type.startsWith('heading_')) return -1;
    if (blocks[i].type === 'paragraph') return i;
  }
  return -1;
}
