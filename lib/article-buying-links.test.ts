import { describe, expect, it } from 'vitest';

import { applyBuyingLinks, buyingLinksByArticle } from '@/lib/article-buying-links';
import type { NotionBlock } from '@/lib/articles';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { getShopArtists } from '@/lib/published-artists';
import { BASE_URL } from '@/lib/site';

interface Seg {
  plain_text: string;
  href: string | null;
  text: { content: string; link: { url: string } | null };
  annotations: { bold: boolean; italic: boolean; code: boolean; strikethrough: boolean; underline: boolean };
}

const seg = (content: string, href: string | null = null, code = false): Seg => ({
  plain_text: content,
  href,
  text: { content, link: href ? { url: href } : null },
  annotations: { bold: false, italic: false, code, strikethrough: false, underline: false },
});

const block = (type: string, ...segments: Seg[]): NotionBlock => ({ id: `b-${Math.random()}`, type, [type]: { rich_text: segments } });

const texts = (b: NotionBlock) => ((b[b.type] as { rich_text: Seg[] }).rich_text).map(s => [s.plain_text, s.href]);

describe('the buying-links list', () => {
  it('only points at buying pages that exist', async () => {
    const artists = await getShopArtists();
    const valid = new Set<string>([
      '/products',
      '/nordic-art',
      '/scandinavian-wall-art',
      ...categoryLandings.map(c => `/category/${c.slug}`),
      ...collections.map(c => `/collection/${c.slug}`),
      ...artists.map(a => `/artist/${a.slug}`),
    ]);
    for (const [slug, links] of Object.entries(buyingLinksByArticle)) {
      for (const link of links) expect(valid, `${slug} links to ${link.href}`).toContain(link.href);
    }
  });

  it('keeps each article to a few links, each to a different page', () => {
    for (const [slug, links] of Object.entries(buyingLinksByArticle)) {
      expect(links.length, `${slug} has too many`).toBeLessThanOrEqual(3);
      expect(new Set(links.map(l => l.href)).size, `${slug} repeats a page`).toBe(links.length);
    }
  });

  it('gives every link words to sit on, inside its context where it has one', () => {
    for (const [slug, links] of Object.entries(buyingLinksByArticle)) {
      for (const link of links) {
        expect(link.text.trim(), `${slug} has a blank anchor`).not.toBe('');
        if (link.context) expect(link.context, `${slug}: ${link.text}`).toContain(link.text);
      }
    }
  });
});

describe('applyBuyingLinks', () => {
  // A real entry, so the test follows the list rather than a fixture copy.
  const slug = 'best-nordic-art-prints';

  it('links the chosen words where they first appear, keeping the rest of the sentence', () => {
    const blocks = [block('paragraph', seg('In a pale living room, a print makes a clear focal point.'))];
    const out = applyBuyingLinks(blocks, slug);
    expect(texts(out[0])).toEqual([
      ['In a ', null],
      ['pale living room', '/collection/living-room'],
      [', a print makes a clear focal point.', null],
    ]);
  });

  it('leaves the input blocks unchanged', () => {
    const blocks = [block('paragraph', seg('In a pale living room.'))];
    const before = JSON.stringify(blocks);
    applyBuyingLinks(blocks, slug);
    expect(JSON.stringify(blocks)).toBe(before);
  });

  it('skips headings, quotes, existing links and code', () => {
    const blocks = [
      block('heading_2', seg('A pale living room')),
      block('quote', seg('a pale living room')),
      block('paragraph', seg('pale living room', '/somewhere-else')),
      block('paragraph', seg('pale living room', null, true)),
    ];
    expect(JSON.stringify(applyBuyingLinks(blocks, slug))).toBe(JSON.stringify(blocks));
  });

  it('does not link a page the article already links to, by path or full address', () => {
    for (const existing of ['/collection/living-room', `${BASE_URL}/collection/living-room/`]) {
      const blocks = [
        block('paragraph', seg('see the '), seg('collection', existing)),
        block('paragraph', seg('In a pale living room.')),
      ];
      expect(texts(applyBuyingLinks(blocks, slug)[1])).toEqual([['In a pale living room.', null]]);
    }
  });

  it('places each link once', () => {
    const blocks = [block('paragraph', seg('A pale living room.')), block('bulleted_list_item', seg('Another pale living room.'))];
    const out = applyBuyingLinks(blocks, slug);
    expect(texts(out[1])).toEqual([['Another pale living room.', null]]);
  });

  it('matches whole words only', () => {
    const out = applyBuyingLinks([block('paragraph', seg('the pale living roomful'))], slug);
    expect(texts(out[0])).toEqual([['the pale living roomful', null]]);
  });

  it('uses the context to choose the right occurrence', () => {
    const out = applyBuyingLinks(
      [block('paragraph', seg('Five Nordic art books, and why Nordic art looks the way it does.'))],
      'nordic-art-and-design-books',
    );
    expect(texts(out[0])).toEqual([
      ['Five Nordic art books, and why ', null],
      ['Nordic art', '/nordic-art'],
      [' looks the way it does.', null],
    ]);
  });

  it('drops a link quietly when its words are no longer in the article', () => {
    const blocks = [block('paragraph', seg('A rewritten sentence.'))];
    expect(applyBuyingLinks(blocks, slug)).toEqual(blocks);
  });

  it('returns the blocks as they are for an article with no entry', () => {
    const blocks = [block('paragraph', seg('pale living room'))];
    expect(applyBuyingLinks(blocks, 'not-an-article')).toBe(blocks);
  });
});
