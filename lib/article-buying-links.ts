// In-text links from journal articles to the buying pages (category,
// collection and artist pages, and the wall-art, Nordic-art and shop hubs).
//
// Why (plan experiment journal-links, T-0530): the buying pages sit at Google
// positions 15 to 29 (28 days to 16 Nov 2026: /scandinavian-wall-art 22.4,
// /nordic-art 24.0, /collection/living-room 24.8, /category/photography 22.8,
// /collection/home-office 38.4, /category/abstract 46.2, /products 48.7), while
// the journal is where the site's search impressions are. Links from inside the
// articles, on descriptive words a reader would click anyway, carry that
// standing to the pages that sell. Judged on average position after 28 days of
// search data from the day this ships to production (the start date is
// recorded on the PR and on T-0530 in Studio).
//
// Why here and not in the article bodies: bodies live in the socialagent
// Article table and reach the site at build (scripts/sync-articles.mjs).
// Editing them there would change the live site outside a pull request, so the
// links are layered on at render instead, the same way lib/article-
// enhancements.ts places the planner teaser. Each link names words that are
// already in the article; if Ken rewrites the sentence and the words go, that
// link quietly drops rather than landing somewhere it was never chosen for.
//
// Rules the list keeps: a few links per article at most, never forced (twelve
// articles have none because nothing in them fits); only destinations the body
// does not already link to; anchors that describe the page they lead to.

import type { NotionBlock } from '@/lib/articles';
import { BASE_URL } from '@/lib/site';

export interface BuyingLink {
  /** The words in the article that become the link. */
  text: string;
  /** Where it goes: a buying page on this site, as a path. */
  href: string;
  /**
   * A longer stretch of the article containing `text`, when `text` alone also
   * appears earlier in a place the link should not go. The link lands on
   * `text` inside the first occurrence of `context`.
   */
  context?: string;
}

export const buyingLinksByArticle: Record<string, BuyingLink[]> = {
  'the-art-of-choosing-art-comprehensive-guide': [
    { text: 'black and white photography', href: '/category/photography' },
    { text: 'abstract art', context: 'the intrigue of abstract art', href: '/category/abstract' },
  ],
  'who-are-scandinavian-art': [
    { text: 'Scandinavian art works', href: '/nordic-art' },
    { text: 'our collection', context: 'our collection is always fresh', href: '/products' },
  ],
  'an-interview-by-all-things-nordic': [
    { text: 'artists from across the Nordic region', href: '/nordic-art' },
  ],
  'an-interview-by-nordic-notes': [
    { text: 'bright botanicals', href: '/category/botanical' },
    { text: 'bold geometrics', href: '/category/abstract' },
  ],
  'create-an-art-wall': [
    { text: 'Simen Wahlqvist', href: '/artist/simen-wahlqvist' },
    { text: 'Sia Siamos', href: '/artist/sia-siamos' },
  ],
  'how-to-style-scandinavian-wall-art-living-room': [
    { text: 'abstract print', context: 'An abstract print beside a botanical', href: '/category/abstract' },
    { text: 'soft botanical', href: '/category/botanical' },
    { text: 'few-line illustrations', href: '/category/illustrations' },
  ],
  'complete-guide-choosing-print-sizes': [
    { text: 'square 50 x 50 illustrations', href: '/category/illustrations' },
  ],
  'nordic-art-and-design-books': [
    { text: 'Nordic art', context: 'why Nordic art looks the way it does', href: '/nordic-art' },
    { text: 'The prints we carry', href: '/products' },
  ],
  'what-is-scandinavian-art': [
    { text: 'pictures for real walls', href: '/scandinavian-wall-art' },
  ],
  'nordic-photography-books': [
    { text: 'Nordic photography', context: 'proves Nordic photography kept', href: '/category/photography' },
  ],
  'contemporary-nordic-art-books': [
    { text: 'the work being made today', href: '/nordic-art' },
    { text: 'the collection', context: 'the collection is a good place to wander', href: '/products' },
  ],
  // The piece names "the Scandinavian wall art page" and "the abstract
  // collection" as places to go but never linked them.
  'scandinavian-wall-decor-ideas': [
    { text: 'Scandinavian wall art page', href: '/scandinavian-wall-art' },
    { text: 'the abstract collection', href: '/category/abstract' },
    { text: 'the home office', context: 'a natural fit for the home office', href: '/collection/home-office' },
  ],
  'norwegian-words-behind-the-prints': [
    { text: 'Simen Wahlqvist', href: '/artist/simen-wahlqvist' },
    { text: 'Sia Siamos', href: '/artist/sia-siamos' },
    { text: 'Ingunn Dybendal', href: '/artist/ingunn-dybendal' },
  ],
  'best-scandinavian-art-prints': [
    { text: 'Sia Siamos', context: 'Sia Siamos paints four table scenes', href: '/artist/sia-siamos' },
    { text: 'a kitchen or dining wall', context: 'best somewhere with company, a kitchen or dining wall', href: '/collection/kitchen' },
  ],
  'best-nordic-art-prints': [
    { text: 'pale living room', href: '/collection/living-room' },
    { text: 'Hedvig Wallin', href: '/artist/hedvig-wallin' },
  ],
  'scandinavian-illustrators': [
    { text: 'Ingunn Dybendal', href: '/artist/ingunn-dybendal' },
    { text: 'Sia Siamos', href: '/artist/sia-siamos' },
  ],
  'famous-scandinavian-artists': [
    { text: 'Nordic work on paper', href: '/category/illustrations' },
  ],
  'how-to-choose-wall-art-for-a-scandinavian-interior': [
    { text: 'Above a standard sofa', href: '/collection/living-room' },
  ],
  'modern-scandinavian-art': [
    { text: 'the work being made today', href: '/nordic-art' },
    { text: 'Ishtar Bäcklund Dakhil', href: '/artist/ishtar-backlund-dakhil' },
  ],
  'how-to-frame-an-art-print': [
    { text: 'Simen Wahlqvist', href: '/artist/simen-wahlqvist' },
    { text: 'the photography', context: '40 x 50 cm for the photography', href: '/category/photography' },
  ],
  'art-print-or-poster': [
    { text: 'independent artists behind the gallery', href: '/nordic-art' },
  ],
  'bedroom-wall-art-ideas': [
    { text: 'deadpan illustrations', href: '/category/illustrations' },
    { text: 'home office', context: 'excellent company in a home office', href: '/collection/home-office' },
  ],
  'kitchen-and-dining-wall-art': [
    { text: 'kitchen and dining space', href: '/collection/kitchen' },
    { text: 'Simen Wahlqvist', href: '/artist/simen-wahlqvist' },
  ],
  'scandinavian-art-gifts': [
    { text: 'Simen Wahlqvist', context: 'Simen Wahlqvist draws with as few lines', href: '/artist/simen-wahlqvist' },
    { text: 'Markus Naarttijärvi', href: '/artist/markus-naarttijarvi' },
  ],
  'scandinavian-christmas-wall-art': [
    { text: 'Markus Naarttijärvi', href: '/artist/markus-naarttijarvi' },
    { text: 'a dining room or kitchen', href: '/collection/kitchen' },
    { text: 'living room', context: 'a living room in December', href: '/collection/living-room' },
  ],
  'small-space-wall-art': [
    { text: 'bedroom nook', href: '/collection/bedroom' },
    { text: 'Mikko Saarainen', href: '/artist/mikko-saarainen' },
  ],
  'home-office-wall-art': [
    { text: 'Simen Wahlqvist', href: '/artist/simen-wahlqvist' },
    { text: 'Mikko Saarainen', href: '/artist/mikko-saarainen' },
  ],
  'nordic-colour-palette-wall-art': [
    { text: 'Markus Naarttijärvi', href: '/artist/markus-naarttijarvi' },
  ],
  'scandinavian-design-style-wall-art': [
    { text: 'Ingunn Dybendal', href: '/artist/ingunn-dybendal' },
    { text: 'Hedvig Wallin', href: '/artist/hedvig-wallin' },
  ],
  'winter-in-nordic-photography': [
    { text: 'abstract work', href: '/category/abstract' },
    { text: 'bedroom', context: 'Put one in a bedroom', href: '/collection/bedroom' },
  ],
  'photography-as-scandinavian-art': [
    { text: 'an illustrated piece', href: '/category/illustrations' },
  ],
  'nordic-abstract-wall-art': [
    { text: 'bedroom', context: 'which suits a bedroom', href: '/collection/bedroom' },
    { text: 'living room wall', href: '/collection/living-room' },
  ],
  'scandinavian-painting-landscape': [
    { text: 'current work', href: '/nordic-art' },
    { text: 'Mikko Saarainen', href: '/artist/mikko-saarainen' },
    { text: 'Markus Naarttijärvi', href: '/artist/markus-naarttijarvi' },
  ],
};

interface Segment {
  plain_text?: string;
  href?: string | null;
  text?: { content?: string; link?: { url: string } | null };
  annotations?: { code?: boolean };
  [key: string]: unknown;
}

const LINKABLE = new Set(['paragraph', 'bulleted_list_item', 'numbered_list_item']);
const WORD = /[\p{L}\p{N}]/u;

function segmentsOf(block: NotionBlock): Segment[] | undefined {
  const payload = block[block.type] as { rich_text?: Segment[] } | undefined;
  return payload?.rich_text;
}

/** An internal path for a link target, so /x and https://www.…/x count as the same page. */
function internalPath(href: string): string {
  const path = href.startsWith(BASE_URL) ? href.slice(BASE_URL.length) || '/' : href;
  return path.replace(/[?#].*$/, '').replace(/(.)\/$/, '$1');
}

function linkedPaths(blocks: NotionBlock[]): Set<string> {
  const paths = new Set<string>();
  for (const block of blocks) {
    for (const seg of segmentsOf(block) ?? []) {
      const href = seg.href || seg.text?.link?.url;
      if (href) paths.add(internalPath(href));
    }
  }
  return paths;
}

function withText(seg: Segment, content: string, href: string | null): Segment {
  return {
    ...seg,
    plain_text: content,
    href,
    text: { ...(seg.text ?? {}), content, link: href ? { url: href } : null },
  };
}

/** Where `text` starts inside `content`, honouring `context` and whole words; -1 if absent. */
function findText(content: string, link: BuyingLink): number {
  const anchor = link.context ?? link.text;
  let from = 0;
  while (from <= content.length) {
    const at = content.indexOf(anchor, from);
    if (at < 0) return -1;
    const start = at + (link.context ? link.context.indexOf(link.text) : 0);
    const end = start + link.text.length;
    const before = content[start - 1];
    const after = content[end];
    if ((!before || !WORD.test(before)) && (!after || !WORD.test(after))) return start;
    from = at + 1;
  }
  return -1;
}

/**
 * Turn the article's chosen words into links to the buying pages. Only running
 * text (paragraphs and list items) is touched, never headings or quotes, and
 * only words that are not already a link or code. Each link is placed once, on
 * its first match; a destination the article already links to is skipped.
 * Returns new blocks and leaves the input alone.
 */
export function applyBuyingLinks<T extends NotionBlock>(blocks: T[], articleSlug: string): T[] {
  const links = buyingLinksByArticle[articleSlug];
  if (!links?.length) return blocks;
  if (links.some(link => link.context && !link.context.includes(link.text))) {
    throw new Error(`article-buying-links: a context for ${articleSlug} does not contain its text`);
  }

  const already = linkedPaths(blocks);
  const out = blocks.map(block => {
    const segs = segmentsOf(block);
    if (!LINKABLE.has(block.type) || !segs) return block;
    return { ...block, [block.type]: { ...(block[block.type] as object), rich_text: [...segs] } } as T;
  });

  for (const link of links) {
    if (already.has(internalPath(link.href))) continue;
    placed: for (const block of out) {
      if (!LINKABLE.has(block.type)) continue;
      const segs = segmentsOf(block);
      if (!segs) continue;
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        if (seg.href || seg.text?.link || seg.annotations?.code) continue;
        const content = seg.plain_text ?? '';
        const start = findText(content, link);
        if (start < 0) continue;
        const end = start + link.text.length;
        const parts = [
          withText(seg, content.slice(0, start), null),
          withText(seg, content.slice(start, end), link.href),
          withText(seg, content.slice(end), null),
        ].filter(part => part.plain_text);
        segs.splice(i, 1, ...parts);
        already.add(internalPath(link.href));
        break placed;
      }
    }
  }
  return out;
}
