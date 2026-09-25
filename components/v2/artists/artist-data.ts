import type { Artist } from '@/data/artists';
import { getArtistInitials } from '@/data/artists';
import { getLowestProductPrices, type CurrencyPrices } from '@/lib/pricing';
import { shopScenes, type ShopScene } from '@/lib/shop-scenes';
import { artistHeroScene } from '@/lib/artist-editorial';
import { frameOptions } from '@/config/frame';

/*
 * Server-side helpers for the V2 artist pages (/artists, /artist/[slug] and
 * their /no twins). Everything here is derived from the data layer, so a new
 * artist with published prints gets a complete page with no copy to write:
 * "At a glance" only ever states what data/artists.ts, the catalogue and the
 * frame config actually hold.
 */

type ProductLike = {
  slug: string;
  name: string;
  prices: Record<string, CurrencyPrices>;
};

/**
 * The toned portraits (brand file artists/*-tone.png, Mark 2026-09-25: one
 * brown tone so mixed-quality photos read as a set), shipped as 400 px WebP.
 * Same photographs as public/images/artists, so the Person JSON-LD and the
 * social card keep `artist.image`; only what the page shows changes. An artist
 * not listed falls back to their original photo, then to initials.
 */
const TONED: Record<string, string> = {
  'helene-brox': '/images/artists/helene-brox-tone.webp',
  'simen-wahlqvist': '/images/artists/simen-wahlqvist-tone.webp',
  'sia-siamos': '/images/artists/sia-siamos-tone.webp',
  'hedvig-wallin': '/images/artists/hedvig-wallin-tone.webp',
};

export function portraitFor(artist: Pick<Artist, 'slug' | 'image' | 'name'>): { src?: string; initials: string } {
  return { src: TONED[artist.slug] || artist.image || undefined, initials: getArtistInitials(artist.name) };
}

/** '50x70cm' → '50 × 70 cm'. PrintCard has the same helper, but it is a
 *  'use client' module, and a server import of it is a client reference. */
export function sizeLabel(size: string): string {
  const m = size.match(/^(\d+)x(\d+)cm$/i);
  return m ? `${m[1]} × ${m[2]} cm` : size;
}

/** "Oslo, Norway" → "Oslo". The card and the map use the city on its own. */
export function cityOf(location: string | undefined): string {
  return (location ?? '').split(',')[0].trim();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** The cheapest price in each currency across an artist's prints ("from £35"). */
export function lowestPrices(products: ProductLike[]): CurrencyPrices | null {
  let low: CurrencyPrices | null = null;
  for (const p of products) {
    const prices = getLowestProductPrices(p);
    if (!prices || !prices.GBP) continue;
    if (!low) low = { ...prices };
    else for (const c of Object.keys(low) as (keyof CurrencyPrices)[]) low[c] = Math.min(low[c], prices[c]);
  }
  return low;
}

/**
 * The formats an artist is sold in, from the catalogue: "50 × 70 cm", or, when
 * one or two prints are the exception, the design's wording, "50 × 50 cm, and
 * 50 × 70 cm for Morgenstrekk".
 */
export function formatsLine(products: ProductLike[], words: { and: string; for: string }): string {
  const bySize = new Map<string, string[]>();
  for (const p of products) {
    for (const size of Object.keys(p.prices)) {
      bySize.set(size, [...(bySize.get(size) ?? []), p.name]);
    }
  }
  const sizes = [...bySize.entries()].sort((a, b) => b[1].length - a[1].length);
  if (sizes.length === 0) return '';
  const [main, ...rest] = sizes;
  if (rest.length === 0) return sizeLabel(main[0]);
  const others = rest.map(([size, names]) =>
    names.length <= 2 ? `${sizeLabel(size)} ${words.for} ${names.join(` ${words.and} `)}` : sizeLabel(size)
  );
  return `${sizeLabel(main[0])}, ${words.and} ${others.join(`, ${words.and} `)}`;
}

/** "Unframed, or wood, black or white", from config/frame.ts. */
export function framingLine(prefix: string, and: string, labels?: Record<string, string>): string {
  const framed = frameOptions
    .filter(f => f.id !== 'no-frame')
    .map(f => (labels?.[f.id] ?? f.name).toLowerCase());
  if (framed.length === 0) return '';
  const list = framed.length === 1 ? framed[0] : `${framed.slice(0, -1).join(', ')} ${and} ${framed[framed.length - 1]}`;
  return `${prefix} ${list}`;
}

/** The hero's room scene: the design's pick, else the first print with a scene. */
export function heroSceneFor<P extends ProductLike>(slug: string, products: P[]): { scene: ShopScene; product: P } | null {
  const pick = artistHeroScene[slug];
  const ordered = pick ? [...products.filter(p => p.slug === pick), ...products.filter(p => p.slug !== pick)] : products;
  for (const product of ordered) {
    const scene = shopScenes[product.slug];
    if (scene) return { scene, product };
  }
  return null;
}

/** "in a child's drawing corner", from the scene's English alt, for the hero caption. */
export function scenePhrase(alt: string): string | null {
  const m = alt.match(/ framed (in|above|on) (.+)$/);
  return m ? `${m[1]} ${m[2]}` : null;
}
