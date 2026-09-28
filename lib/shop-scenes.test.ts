import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import { getAllArticles } from './articles';
import { getInspireScenes } from './inspire';
import { displayedScenePaperSize, shopScenes } from './shop-scenes';

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

describe('room image paper size', () => {
  it('uses the offered catalogue size and the scene orientation', () => {
    const portrait = shopScenes['through-the-willows'];
    const landscape = shopScenes['sun-over-the-forest'];
    expect(displayedScenePaperSize('through-the-willows', portrait.image, { '50x70cm': true }))
      .toMatchObject({ depicted: { catalogSize: '50x70cm', widthCm: 50, heightCm: 70 }, sameFormat: true });
    expect(displayedScenePaperSize('sun-over-the-forest', landscape.image, { '45x60cm': true }))
      .toMatchObject({ depicted: { catalogSize: '45x60cm', widthCm: 60, heightCm: 45 }, sameFormat: true });
  });

  it('identifies an older room format and orients the current offered size', () => {
    expect(displayedScenePaperSize('through-the-willows', shopScenes['through-the-willows'].image, { '45x60cm': true }))
      .toMatchObject({ current: { widthCm: 45, heightCm: 60 }, sameFormat: false });
    expect(displayedScenePaperSize('morning-cabin-room', shopScenes['morning-cabin-room'].image, { '45x60cm': true }))
      .toMatchObject({ current: { widthCm: 60, heightCm: 45 }, sameFormat: false });
    expect(displayedScenePaperSize('swan-on-still-water', shopScenes['swan-on-still-water'].image, { '40x50cm': true }))
      .toMatchObject({ current: { widthCm: 50, heightCm: 40 }, sameFormat: false });
  });

  it('omits the size when the image changes, no current size is offered, or the scene is unknown', () => {
    const scene = shopScenes['through-the-willows'];
    expect(displayedScenePaperSize('through-the-willows', '/images/other-room.avif', { '50x70cm': true })).toBeUndefined();
    expect(displayedScenePaperSize('through-the-willows', scene.image, { '50x70cm': false })).toBeUndefined();
    expect(displayedScenePaperSize('through-the-willows', scene.image, undefined)).toBeUndefined();
    expect(displayedScenePaperSize('through-the-willows', scene.image, { '45x60cm': true, '40x50cm': true })).toBeUndefined();
    expect(displayedScenePaperSize('dancer', shopScenes.dancer.image, { '50x70cm': true })).toBeUndefined();
  });
});
