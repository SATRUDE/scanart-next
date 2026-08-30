import { describe, expect, it } from 'vitest';

import { artistMetaDescription, artistMetaTitle } from './artist-meta';
import { META_SNIPPET_MAX_LENGTH } from './meta-snippet';
import { artists } from '@/data/artists';

describe('artistMetaTitle', () => {
  it('names the offer, not just the person', () => {
    expect(artistMetaTitle('Sia Siamos')).toBe('Sia Siamos art prints');
  });

  it('uses Norwegian for the Norwegian page', () => {
    expect(artistMetaTitle('Sia Siamos', 'no')).toBe('Kunsttrykk av Sia Siamos');
  });

  it('trims stray whitespace so the root template joins cleanly', () => {
    expect(artistMetaTitle('  Helene Brox  ')).toBe('Helene Brox art prints');
  });
});

describe('artistMetaDescription', () => {
  it('leads with the offer and keeps the biography as the distinguishing part', () => {
    expect(
      artistMetaDescription(
        'Simen Wahlqvist',
        'Simen Wahlqvist is a Norwegian graphic designer and illustrator based in Oslo. In his work he aims to capture moments.',
      ),
    ).toBe(
      'Art prints by Simen Wahlqvist, a Norwegian graphic designer and illustrator based in Oslo. Framed or unframed, delivered worldwide.',
    );
  });

  it('drops the biography’s opening "<name> is" so the name is not said twice', () => {
    const result = artistMetaDescription('Sia Siamos', 'Sia Siamos is an illustrator living in Bergen.');
    expect(result).toBe('Art prints by Sia Siamos, an illustrator living in Bergen. Framed or unframed, delivered worldwide.');
    expect(result.match(/Sia Siamos/g)).toHaveLength(1);
  });

  it('cuts a long biography at a comma so the clause stays complete', () => {
    const result = artistMetaDescription(
      'Ingunn Dybendal',
      'Ingunn Dybendal is an illustrator living and working in Oslo, part of the Heiaklubben collective, with an illustration degree from Falmouth.',
    );
    expect(result).toBe(
      'Art prints by Ingunn Dybendal, an illustrator living and working in Oslo, part of the Heiaklubben collective. Framed or unframed, delivered worldwide.',
    );
    expect(result).not.toContain('Falmouth');
  });

  it('never emits an ellipsis, because the sentence is closed with a full stop', () => {
    for (const artist of artists) {
      expect(artistMetaDescription(artist.name, artist.bio)).not.toContain('…');
      expect(artistMetaDescription(artist.name, artist.bio)).not.toContain('...');
    }
  });

  it('keeps every real artist inside the snippet budget', () => {
    for (const artist of artists) {
      const result = artistMetaDescription(artist.name, artist.bio);
      expect(result.length, `${artist.name}: ${result}`).toBeLessThanOrEqual(META_SNIPPET_MAX_LENGTH);
    }
  });

  it('always keeps the offer and the delivery line, whatever the biography does', () => {
    for (const artist of artists) {
      const result = artistMetaDescription(artist.name, artist.bio);
      expect(result.startsWith(`Art prints by ${artist.name}`)).toBe(true);
      expect(result.endsWith('Framed or unframed, delivered worldwide.')).toBe(true);
    }
  });

  it('uses the Norwegian homepage’s own phrasing on the Norwegian page', () => {
    expect(
      artistMetaDescription('Sia Siamos', 'Sia Siamos er en illustratør som bor i Bergen.', 'no'),
    ).toBe('Kunsttrykk av Sia Siamos, en illustratør som bor i Bergen. Med eller uten ramme, levert til hele verden.');
  });

  it('still says what we sell when there is no biography at all', () => {
    expect(artistMetaDescription('Sia Siamos', '')).toBe('Art prints by Sia Siamos. Framed or unframed, delivered worldwide.');
    expect(artistMetaDescription('Sia Siamos', null)).toBe('Art prints by Sia Siamos. Framed or unframed, delivered worldwide.');
    expect(artistMetaDescription('Sia Siamos', undefined, 'no')).toBe(
      'Kunsttrykk av Sia Siamos. Med eller uten ramme, levert til hele verden.',
    );
  });

  it('falls back to the bare offer when a long name leaves no room for a clause', () => {
    const name = 'A'.repeat(100);
    const result = artistMetaDescription(name, `${name} is an illustrator based in Oslo who works in ink.`);
    expect(result).toBe(`Art prints by ${name}. Framed or unframed, delivered worldwide.`);
  });

  it('leaves a biography that does not open with the name intact', () => {
    expect(artistMetaDescription('Sia Siamos', 'Works in ink and gouache.')).toBe(
      'Art prints by Sia Siamos, Works in ink and gouache. Framed or unframed, delivered worldwide.',
    );
  });

  it('does not trip over a name containing regex punctuation', () => {
    expect(artistMetaDescription('A. (Bo) Ek', 'A. (Bo) Ek is a printmaker in Malmö.')).toBe(
      'Art prints by A. (Bo) Ek, a printmaker in Malmö. Framed or unframed, delivered worldwide.',
    );
  });
});
