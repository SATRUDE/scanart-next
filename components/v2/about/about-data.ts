import type { PublishedArtist } from '@/lib/published-artists';
import { artistPlace } from '@/data/artists';
import { artistStatements } from '@/lib/artist-statements';
import { cityOf, portraitFor } from '@/components/v2/artists/artist-data';
import type { ArtistCardData } from '@/components/v2/artists/ArtistCard';
import type { AboutPlace } from './AboutBody';
import type { WindowPool } from './HeadlineWithWindows';
import { MAP_SIZE, PINNED_CITIES, labelSides, pinFor, type CityPin } from '@/lib/artist-cities';

/** The bio's first sentence, for a card with no one-line statement. */
function firstSentence(text: string): string {
  const [first] = text.trim().split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/u);
  return (first ?? text).trim();
}

/**
 * Where the artists work, derived from the artists with published prints:
 * one place per city, most artists first, each artist in the roster's order.
 */
export function aboutPlaces(artists: PublishedArtist[], cityLabels: Record<string, string> = {}): AboutPlace[] {
  const byCity = new Map<string, string[]>();
  for (const artist of artists) {
    // Lives outside the Nordics: the map would show where they are from, not where they work.
    if (artist.from) continue;
    const city = cityOf(artist.location);
    if (!city) continue;
    byCity.set(city, [...(byCity.get(city) ?? []), artist.name]);
  }
  const pins: Record<string, CityPin> = {};
  for (const city of byCity.keys()) {
    const pin = pinFor(city);
    if (pin) pins[city] = pin;
  }
  const sides = labelSides(pins);
  return [...byCity.entries()]
    .sort((a, b) => b[1].length - a[1].length || rank(a[0]) - rank(b[0]))
    .map(([city, names]) => {
      const point = pins[city];
      return {
        label: cityLabels[city] ?? city,
        x: point ? (point.x / MAP_SIZE.W) * 100 : null,
        y: point ? (point.y / MAP_SIZE.H) * 100 : null,
        side: sides[city] ?? 'right',
        artists: names,
      };
    });
}

function rank(city: string): number {
  const i = PINNED_CITIES.indexOf(city);
  return i === -1 ? PINNED_CITIES.length : i;
}

/**
 * The Artist cards: the toned portrait, one line about the work (the artist
 * statement the product pages use, else the bio's first sentence), and the
 * city with the print count.
 */
export function rosterCards(
  artists: PublishedArtist[],
  words: {
    statements?: Record<string, string>;
    bios?: Record<string, { bio: string; location?: string }>;
    cityLabels?: Record<string, string>;
    printCount: (n: number) => string;
  }
): ArtistCardData[] {
  const statements = words.statements ?? artistStatements;
  return artists.map(artist => {
    const portrait = portraitFor(artist);
    const bio = words.bios?.[artist.slug]?.bio ?? artist.bio;
    const city = cityOf(artistPlace(artist).value);
    return {
      slug: artist.slug,
      name: artist.name,
      portrait: portrait.src,
      initials: portrait.initials,
      about: statements[artist.slug] ?? firstSentence(bio),
      city: words.cityLabels?.[city] ?? city,
      prints: words.printCount(artist.printCount),
    };
  });
}

/**
 * The three windows' pools (brand file motion/about-windows, crops of the
 * shop's own room scenes and prints; nature from the brand file's texture and
 * nature images, Wikimedia Commons photographs credited at /credits from
 * lib/credits.ts). The first of each is the Figma state 1 snapshot and
 * the server-rendered one; the rest are shuffled per visit.
 */
const w = (name: string) => `/images/v2/about/windows/${name}.webp`;
export const ABOUT_WINDOW_POOLS: Record<WindowPool, string[]> = {
  prints: [
    'hummer-og-vin-0', 'trysilkaffe-0', 'hyttefrokost-1', 'hummer-og-vin-1', 'trysilkaffe-2',
    'hyttefrokost-0', 'sunday-brunch-2', 'rosa-blomster-0',
  ].map(w),
  homes: [
    'eltsjoen-0', 'small-house-big-ocean-1', 'massa-applen-1', 'slingshot-0',
    'sunday-brunch-1', 'trysilkaffe-1', 'eltsjoen-2', 'slingshot-1',
  ].map(w),
  nature: ['nature-forest-floor', 'nature-moss', 'nature-sea-ripples', 'nature-lupins', 'nature-forest-spruce'].map(w),
};
