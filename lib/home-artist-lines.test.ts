import { describe, it, expect } from 'vitest';
import { artists } from '@/data/artists';
import { artistStatements } from './artist-statements';
import { homeStrings } from './home';
import { no } from './i18n/no';

const filled = (s: string | undefined) => (s ?? '').trim().length > 0;

// The homepage artist row prints one line under each name. A missing line
// leaves the card with a name and nothing else (Emma Iben, Patrik Wennerlund
// and Markus Naarttijarvi, 7 Oct 2026). Every artist in data/artists.ts needs
// the full set of text fields, in both languages, before they can ship.
describe('artist text fields, English and Norwegian', () => {
  describe.each(artists.map(a => [a.slug, a] as const))('%s', (slug, artist) => {
    const copy = (no.artists as Record<string, { location?: string; bio?: string }>)[slug];
    const noLines = no.home.v2.artists.lines as Record<string, string>;
    const enLines = homeStrings.artists.lines as Record<string, string>;
    const noStatements = no.artistStatements as Record<string, string>;

    it('has a homepage card line', () => {
      expect(filled(enLines[slug]), `English card line missing in lib/home.ts`).toBe(true);
      expect(filled(noLines[slug]), `Norwegian card line missing in lib/i18n/no.ts home.v2.artists.lines`).toBe(true);
    });
    it('has a bio', () => {
      expect(filled(artist.bio), 'English bio missing in data/artists.ts').toBe(true);
      expect(filled(copy?.bio), 'Norwegian bio missing in no.artists').toBe(true);
    });
    it('has a statement', () => {
      expect(filled(artistStatements[slug]), 'English statement missing in lib/artist-statements.ts').toBe(true);
      expect(filled(noStatements[slug]), 'Norwegian statement missing in no.artistStatements').toBe(true);
    });
    it('has a location', () => {
      expect(filled(artist.location), 'English location missing').toBe(true);
      expect(filled(copy?.location), 'Norwegian location missing in no.artists').toBe(true);
    });
  });
});
