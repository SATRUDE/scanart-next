import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import { getAllArticles } from './articles';
import { getInspireScenes } from './inspire';
import { shopScenes } from './shop-scenes';

afterEach(() => vi.restoreAllMocks());

describe('curated scenes survive refreshed CMS snapshots', () => {
  it('replaces the known article hero and its alt while preserving unrelated photography', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([
      { slug: 'bedroom-wall-art-ideas', image: '/cms/retired-birdie.jpg', published: true },
      { slug: 'art-in-oslo-july-2026', image: '/museum/exhibition.jpg', published: true },
      { slug: 'how-to-frame-an-art-print', image: '/cms/old.jpg', published: false },
    ]));
    const articles = await getAllArticles();
    expect(articles).toHaveLength(2);
    expect(articles[0]).toMatchObject({ image: shopScenes['rosa-blomster'].image, imageAlt: shopScenes['rosa-blomster'].alt });
    expect(articles[1].image).toBe('/museum/exhibition.jpg');
  });

  it('refreshes single-work inspiration dimensions and alt without changing paired compositions', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([
      { image: '/cms/old.jpg', alt: 'Old composition', slugs: ['dancer'], width: 1600, height: 1394 },
      { image: '/cms/pair.jpg', alt: 'A pair', slugs: ['dancer', 'half-man'], width: 1600, height: 900 },
    ]));
    const scenes = await getInspireScenes();
    expect(scenes[0]).toMatchObject({ ...shopScenes.dancer, slugs: ['dancer'] });
    expect(scenes[1]).toMatchObject({ image: '/cms/pair.jpg', alt: 'A pair', width: 1600, height: 900 });
  });
});
