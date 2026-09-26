import { getInspireScenes } from '@/lib/inspire';
import { getAllProducts } from '@/lib/products';
import { shopScenes } from '@/lib/shop-scenes';
import { sceneImageAlt } from '@/lib/product-image-alt';
import { BASE_URL } from '@/lib/site';
import { TAGGED_ROOMS, SCENE_PRINTS } from '@/lib/inspire-walls';
import type { InspireRoom } from './InspireWall';

/**
 * The rooms on /inspire and /no/inspire, resolved against the live catalogue.
 *
 * First the V2 rooms, tagged with their wall and room type (lib/inspire-walls),
 * then any older Inspire scene (public/notion-data/inspire.json) that is not
 * one of them. Those have no measured wall, so they show under All only, but
 * they stay on the page: /inspire's scenes are image-search surface, and
 * dropping them from the gallery would drop them from its ImageGallery too.
 *
 * A scene whose every print has been retired drops out rather than
 * dead-linking, as it always has.
 */
export async function getInspireRooms(locale: 'en' | 'no'): Promise<InspireRoom[]> {
  const [legacyScenes, all] = await Promise.all([getInspireScenes(), getAllProducts()]);
  const bySlug = new Map(all.map(p => [p.slug, p]));
  const printsFor = (slugs: string[]) =>
    slugs
      .map(s => bySlug.get(s))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(p => ({ slug: p.slug, name: p.name, artist: p.artist ?? "", prices: p.prices }));
  // The scene alt where the scene is shown. shopScenes' alts are English, so
  // the Norwegian wall describes the same picture from the catalogue in bokmål
  // (sceneImageAlt), as the product pages do.
  const altFor = (alt: string, slugs: string[]) => {
    if (locale === 'en') return alt;
    const lead = bySlug.get(slugs[0]);
    return lead ? sceneImageAlt({ name: lead.name, artist: lead.artist, brand: lead.brand, category: lead.category }, 'no') : alt;
  };

  const rooms: InspireRoom[] = [];
  for (const tagged of TAGGED_ROOMS) {
    const scene = shopScenes[tagged.scene];
    if (!scene) continue;
    const slugs = SCENE_PRINTS[tagged.scene] ?? [tagged.scene];
    const prints = printsFor(slugs);
    if (prints.length === 0) continue;
    rooms.push({
      image: scene.image,
      alt: altFor(scene.alt, slugs),
      width: scene.width,
      height: scene.height,
      wall: tagged.wall,
      room: tagged.room,
      ratio: tagged.ratio,
      prints,
    });
  }

  const seen = new Set(rooms.map(r => r.image));
  for (const scene of legacyScenes) {
    if (seen.has(scene.image)) continue;
    const prints = printsFor(scene.slugs);
    if (prints.length === 0) continue;
    seen.add(scene.image);
    rooms.push({
      image: scene.image,
      alt: altFor(scene.alt, scene.slugs),
      width: scene.width,
      height: scene.height,
      ratio: 'natural',
      prints,
    });
  }
  return rooms;
}

/** Relative image paths made absolute: ImageObject.contentUrl must be a full URL. */
export function absoluteUrl(src: string): string {
  return /^https?:\/\//.test(src) ? src : `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

/**
 * The wall as an ImageGallery of ImageObjects, each pointing at the products
 * it features: the Google Images signal the own-domain image sitemap cannot
 * carry for every scene.
 */
export function inspireGalleryJsonLd({
  rooms,
  name,
  galleryName,
  path,
  productPrefix,
  inLanguage,
}: {
  rooms: InspireRoom[];
  name: string;
  galleryName: string;
  path: string;
  productPrefix: string;
  inLanguage?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: `${BASE_URL}${path}`,
    ...(inLanguage ? { inLanguage } : {}),
    mainEntity: {
      '@type': 'ImageGallery',
      name: galleryName,
      image: rooms.map(room => ({
        '@type': 'ImageObject',
        // Absolute since V2 (docs/v2-seo.md, "Inspire contentUrl is relative").
        contentUrl: absoluteUrl(room.image),
        description: room.alt,
        width: room.width,
        height: room.height,
        // Plain URL references: declaring typed Product entities here made
        // Search Console demand offers/review/aggregateRating on each. The
        // product pages carry the full Product markup; the wall just points.
        about: room.prints.map(p => `${BASE_URL}${productPrefix}/product/${p.slug}`),
      })),
    },
  };
}
