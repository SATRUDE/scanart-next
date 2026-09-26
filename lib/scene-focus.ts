import focus from './scene-focus.json';

/**
 * Mark's rule (2026-09-26): wherever a room scene is cropped, the print stays
 * in view. Tiles crop with object-fit: cover, so each scene carries where its
 * print sits (lib/scene-focus.json, from scripts/v2/scene_focus.py) and this
 * turns that into an object-position.
 *
 * The position is worked out for the tightest crop the site uses (tiles run
 * from 2:3 to 6:5), centring the print in it as far as the image allows. A
 * looser crop at the same position always contains the tighter one, so the
 * print stays in view in every tile. lib/scene-focus.test.ts holds every scene
 * in use to this.
 */

export interface SceneFocus {
  /** The artwork's centre and size, in percent of the scene. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The scene's width / height. */
  ar: number;
  score: number | 'manual';
}

const FOCUS = focus as Record<string, SceneFocus>;

/** The tile shapes that crop scenes (width / height): 2:3 up to 6:5. */
export const TILE_ASPECTS = [2 / 3, 4 / 5, 1, 6 / 5];

/** The detector matches the art inside the mount; this adds the mount and frame back. */
export const FRAME_PAD = 1 / 0.72;

export function sceneFocus(src: string): SceneFocus | undefined {
  return FOCUS[src];
}

/** The share of the scene a tile shows along each axis, at the tightest tile. */
export function tightestWindow(ar: number): { x: number; y: number } {
  let x = 1;
  let y = 1;
  for (const t of TILE_ASPECTS) {
    if (t > ar) y = Math.min(y, ar / t);
    else x = Math.min(x, t / ar);
  }
  return { x, y };
}

function axis(centre: number, window: number): number {
  if (window >= 1) return 50;
  const p = (centre / 100 - window / 2) / (1 - window);
  return Math.round(Math.min(1, Math.max(0, p)) * 1000) / 10;
}

/** object-position for a scene, or undefined for an image with no focus entry. */
export function scenePosition(src: string | undefined): string | undefined {
  const f = src ? FOCUS[src] : undefined;
  if (!f) return undefined;
  const win = tightestWindow(f.ar);
  return `${axis(f.x, win.x)}% ${axis(f.y, win.y)}%`;
}
