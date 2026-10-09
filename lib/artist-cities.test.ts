import { describe, expect, it } from 'vitest';
import { artists } from '@/data/artists';
import { cityOf } from '@/components/v2/artists/artist-data';
import { aboutPlaces } from '@/components/v2/about/about-data';
import { hasCity } from '@/components/v2/artists/ArtistMap';
import { labelSides, pinFor } from '@/lib/artist-cities';
import type { PublishedArtist } from '@/lib/published-artists';

describe('artist city pins', () => {
  it('has a pin for the city of every artist in the catalogue, so the map follows the list', () => {
    const missing = artists.map(a => a.mapCity ?? cityOf(a.location)).filter(city => city && !pinFor(city));
    expect(missing).toEqual([]);
  });

  it('puts every city in the About list on the map', () => {
    const places = aboutPlaces(artists.map(a => ({ ...a, printCount: 1 }) as unknown as PublishedArtist));
    expect(places.length).toBeGreaterThan(0);
    for (const place of places) {
      expect(place.x, place.label).not.toBeNull();
      expect(place.y, place.label).not.toBeNull();
    }
  });

  it('gives the artist page a map for every artist city too', () => {
    for (const a of artists) expect(hasCity(a.mapCity ?? cityOf(a.location)), a.name).toBe(true);
  });

  it('reproduces the original markers within half a pixel', () => {
    const original: Record<string, [number, number]> = {
      Oslo: [210.8, 711.4], Bergen: [52.9, 681.7], Gothenburg: [246.2, 847.7],
      Stockholm: [423.5, 747.4], Lahti: [644.2, 645.2], Umeå: [487.2, 468.8], Borås: [274.4, 847.1],
    };
    for (const [city, [x, y]] of Object.entries(original)) {
      const pin = pinFor(city)!;
      expect(Math.abs(pin.x - x), city).toBeLessThan(0.5);
      expect(Math.abs(pin.y - y), city).toBeLessThan(0.5);
    }
  });

  it('turns Gothenburg\'s label left when Borås sits just beside it, and leaves lone cities alone', () => {
    const sides = labelSides({ Gothenburg: pinFor('Gothenburg')!, Borås: pinFor('Borås')!, Oslo: pinFor('Oslo')! });
    expect(sides).toEqual({ Gothenburg: 'left', Borås: 'right', Oslo: 'right' });
    expect(labelSides({ Gothenburg: pinFor('Gothenburg')! }).Gothenburg).toBe('right');
  });
});
