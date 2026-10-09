/**
 * Where an artist's city sits on the Nordic line map (public/images/map/nordics.svg,
 * 843 x 1053), for both maps on the site: the "Where the artists work" map on
 * /about and the single-city map on an artist page.
 *
 * One entry per city, as latitude and longitude, projected the way the brand
 * file's map/cities.json is: x = (lon - 3.5) * cos(62 deg) * 61.9225 and
 * y = (71.4 - lat) * 61.9225, in the SVG's own pixel space. That reproduces
 * the original five markers within 0.2 px, so a new artist's city needs only
 * its coordinates here. lib/artist-cities.test.ts fails when an artist's city
 * has no entry, so a new artist can never ship without a pin.
 */
export const MAP_SIZE = { W: 843, H: 1053 };

const SCALE = 61.9225;
const COS_REFERENCE = Math.cos((62 * Math.PI) / 180);

/** Latitude (N) and longitude (E) of each city the artists live in, keyed by the English name in data/artists.ts. */
const CITY_COORDINATES: Record<string, [lat: number, lon: number]> = {
  Oslo: [59.91, 10.75],
  Bergen: [60.39, 5.32],
  Gothenburg: [57.71, 11.97],
  Stockholm: [59.33, 18.07],
  Lahti: [60.98, 25.66],
  Umeå: [63.83, 20.26],
  Borås: [57.72, 12.94],
  Copenhagen: [55.68, 12.57],
  // Christina Hägerfors's home town; she lives in France (data/artists.ts `from`).
  Karlstad: [59.38, 13.5],
};

export interface CityPin {
  /** Pixels in the 843 x 1053 SVG space. */
  x: number;
  y: number;
}

export function pinFor(city: string): CityPin | null {
  const coordinates = CITY_COORDINATES[city];
  if (!coordinates) return null;
  const [lat, lon] = coordinates;
  return {
    x: Math.round((lon - 3.5) * COS_REFERENCE * SCALE * 10) / 10,
    y: Math.round((71.4 - lat) * SCALE * 10) / 10,
  };
}

export function hasPin(city: string): boolean {
  return city in CITY_COORDINATES;
}

/** The cities that have a pin, in the order the list falls back to for equal artist counts. */
export const PINNED_CITIES = Object.keys(CITY_COORDINATES);

/**
 * Which side of its pin a label goes. Labels run to the right by default; a pin
 * with another pin close to its right and at about the same height (Gothenburg
 * and Borås) puts its label on the left so the two never overlap.
 */
export function labelSides(pins: Record<string, CityPin>): Record<string, 'left' | 'right'> {
  const sides: Record<string, 'left' | 'right'> = {};
  for (const [city, pin] of Object.entries(pins)) {
    const crowded = Object.entries(pins).some(
      ([other, o]) => other !== city && o.x > pin.x && o.x - pin.x < 130 && Math.abs(o.y - pin.y) < 16
    );
    sides[city] = crowded ? 'left' : 'right';
  }
  return sides;
}
