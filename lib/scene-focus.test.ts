import { describe, expect, it } from 'vitest';

import { HERO_SCENES } from '@/lib/home';
import { getAllProducts } from '@/lib/products';
import { FRAME_PAD, TILE_ASPECTS, sceneFocus, scenePosition } from '@/lib/scene-focus';
import { shopScenes } from '@/lib/shop-scenes';

/**
 * Mark's rule (2026-09-26): wherever a room scene is cropped, the print stays
 * in view. A scene added without running scripts/v2/scene_focus.py fails here.
 */

async function scenesInUse(): Promise<string[]> {
  const products = await getAllProducts();
  const scenes = new Set<string>();
  for (const p of products) if (p.secondaryImage) scenes.add(p.secondaryImage);
  for (const s of Object.values(shopScenes)) scenes.add(s.image);
  for (const s of Object.values(HERO_SCENES)) scenes.add(s);
  return [...scenes].sort();
}

/** Where the print lands in a tile of this aspect, in the tile's own 0 to 1 coordinates. */
function printInTile(src: string, tile: number, pad = 1) {
  const f0 = sceneFocus(src)!;
  const f = { ...f0, w: f0.w * pad, h: f0.h * pad };
  const [px, py] = scenePosition(src)!.split(' ').map(v => parseFloat(v) / 100);
  const winX = tile < f.ar ? tile / f.ar : 1;
  const winY = tile > f.ar ? f.ar / tile : 1;
  const place = (centre: number, size: number, win: number, p: number) => {
    const start = p * (1 - win);
    return [(centre / 100 - size / 200 - start) / win, (centre / 100 + size / 200 - start) / win];
  };
  return { x: place(f.x, f.w, winX, px), y: place(f.y, f.h, winY, py) };
}

describe('scene focus', () => {
  it('has a focal point for every room scene the shop shows', async () => {
    const missing = (await scenesInUse()).filter(src => !sceneFocus(src));
    expect(missing, 'run python3 scripts/v2/scene_focus.py').toEqual([]);
  });

  it('keeps the print whole, frame included, in every tile shape', async () => {
    const cut: string[] = [];
    for (const src of await scenesInUse()) {
      for (const tile of TILE_ASPECTS) {
        const { x, y } = printInTile(src, tile, FRAME_PAD);
        const eps = 0.005;
        if (x[0] < -eps || x[1] > 1 + eps || y[0] < -eps || y[1] > 1 + eps) {
          cut.push(`${src} at ${tile.toFixed(2)}: x ${x.map(v => v.toFixed(2))} y ${y.map(v => v.toFixed(2))}`);
        }
      }
    }
    expect(cut).toEqual([]);
  });

  it('checks the Dragon scene Mark saw cut off', () => {
    const dragon = shopScenes['dragon']?.image;
    expect(dragon && sceneFocus(dragon)).toBeTruthy();
    const { y } = printInTile(dragon!, 6 / 5, FRAME_PAD);
    expect(y[0]).toBeGreaterThanOrEqual(0);
    expect(y[1]).toBeLessThanOrEqual(1);
  });
});
