import { describe, expect, it } from 'vitest';

import { stripNotes } from '@/lib/notes';

describe('stripNotes', () => {
  it('drops a note that sits on its own paragraph, keeping one blank line', () => {
    const markdown = 'Paragraph one.\n\n[note: ask Mark about the framing]\n\nParagraph two.';
    expect(stripNotes(markdown)).toBe('Paragraph one.\n\nParagraph two.');
  });

  it('drops an inline note without joining the words either side of it', () => {
    const markdown = 'Some text [note: check this later] continues here.';
    expect(stripNotes(markdown)).toBe('Some text continues here.');
  });

  it('is non-greedy and multi-line, so it stops at the first closing bracket', () => {
    const markdown = '[note: first\nnote] kept text [note: second] more text';
    expect(stripNotes(markdown)).toBe('kept text more text');
  });

  it('is case-insensitive', () => {
    expect(stripNotes('before [NOTE: shout] after')).toBe('before after');
  });

  it('collapses a run of several removed notes to one blank line', () => {
    const markdown = 'Top.\n\n[note: one]\n\n[note: two]\n\nBottom.';
    expect(stripNotes(markdown)).toBe('Top.\n\nBottom.');
  });

  it('leaves markdown with no notes untouched', () => {
    const markdown = '# Heading\n\nA plain paragraph with a [link](https://example.com).';
    expect(stripNotes(markdown)).toBe(markdown);
  });

  it('handles a note at the very start or end of the body', () => {
    expect(stripNotes('[note: intro aside]\n\nBody text.')).toBe('Body text.');
    expect(stripNotes('Body text.\n\n[note: closing aside]')).toBe('Body text.');
  });

  it('treats a missing body as empty', () => {
    expect(stripNotes(undefined as unknown as string)).toBe('');
  });
});
