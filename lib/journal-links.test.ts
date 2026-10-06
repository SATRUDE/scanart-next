import { describe, expect, it } from 'vitest';
import { categoryJournalLinks, collectionJournalLinks, journalLinks, journalLinksFor, wallArtJournalLinks } from './journal-links';

describe('journal links', () => {
  it('links every article once or more from a landing page', () => {
    const linked = new Set<string>([
      ...Object.values(collectionJournalLinks).flat(),
      ...Object.values(categoryJournalLinks).flat(),
      ...wallArtJournalLinks,
    ]);
    expect([...linked].sort()).toEqual(Object.keys(journalLinks).sort());
  });

  it('has labels in both languages and no em dashes', () => {
    for (const link of Object.values(journalLinks)) {
      for (const label of Object.values(link.label)) {
        expect(label.length).toBeGreaterThan(10);
        expect(label).not.toContain('—');
      }
    }
  });

  it('resolves slugs per locale and tolerates no list', () => {
    expect(journalLinksFor(undefined, 'en')).toEqual([]);
    expect(journalLinksFor(['bedroom-wall-art-ideas'], 'no')[0]).toMatchObject({ slug: 'bedroom-wall-art-ideas' });
  });
});
