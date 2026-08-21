import { describe, it, expect } from 'vitest';
import { feedDate } from '@/app/feed.xml/route';

// The two cases that actually happened, measured against the live feed on
// 2026-08-19 before this fix:
//   astrup-fearnley-in-focus-august-2026  created 10 Aug, published 18 Aug
//   norwegian-words-behind-the-prints     created  8 Aug, published 15 Aug
// Both entered the feed stamped with the draft date, so they arrived already
// buried below whatever had appeared in the intervening week.
describe('feedDate', () => {
  it('prefers the publish date over the draft date', () => {
    expect(
      feedDate({ published_time: '2026-08-18T09:00:00.000Z', created_time: '2026-08-10T12:00:00.000Z' })
    ).toBe('2026-08-18T09:00:00.000Z');
  });

  it('falls back to the draft date when the snapshot predates the field', () => {
    expect(feedDate({ created_time: '2026-07-23T08:00:00.000Z' })).toBe('2026-07-23T08:00:00.000Z');
  });

  it('treats an explicit null the same as absent, since drafts carry null', () => {
    expect(
      feedDate({ published_time: null, created_time: '2026-07-23T08:00:00.000Z' })
    ).toBe('2026-07-23T08:00:00.000Z');
  });

  it('falls back again to last edit rather than emitting nothing', () => {
    expect(feedDate({ last_edited_time: '2026-08-01T00:00:00.000Z' })).toBe('2026-08-01T00:00:00.000Z');
  });

  it('sorts newest-published first, which is the whole point', () => {
    const backdated = { published_time: '2026-08-18T09:00:00.000Z', created_time: '2026-08-10T00:00:00.000Z' };
    const older = { published_time: '2026-08-15T09:00:00.000Z', created_time: '2026-08-12T00:00:00.000Z' };
    const sorted = [older, backdated].sort(
      (a, b) => new Date(feedDate(b) ?? 0).getTime() - new Date(feedDate(a) ?? 0).getTime()
    );
    expect(sorted[0]).toBe(backdated);
    // and by the old rule the order would have been wrong
    const byCreated = [older, backdated].sort(
      (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    );
    expect(byCreated[0]).toBe(older);
  });
});
