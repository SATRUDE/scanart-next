import warm from './warm-images.json';

const WARM: Record<string, string> = warm;

/**
 * The V2 version of a standard product shot: the same photograph with its grey
 * studio backdrop warmed to the image-bg colour (scripts/v2/warm_backdrops.py).
 * The print and frame are untouched. Falls back to the original, so a new
 * product without a warm copy yet still shows. Feeds keep the originals.
 */
export function warmImage(src: string): string {
  return WARM[src] ?? src;
}
