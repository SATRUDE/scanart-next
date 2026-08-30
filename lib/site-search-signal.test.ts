import { describe, it, expect } from 'vitest';
import { shouldTrackSiteSearch } from './site-search-signal';

describe('shouldTrackSiteSearch', () => {
  it('tracks a real search against a catalogue that loaded', () => {
    expect(shouldTrackSiteSearch('simen', 16)).toBe(true);
  });

  it('tracks a genuine zero-result search, which is the signal we want', () => {
    // "renate thor" against a live catalogue really is a gap: her work came off
    // the site on 2026-08-21, and that row should keep arriving.
    expect(shouldTrackSiteSearch('renate thor', 16)).toBe(true);
  });

  it('does not track a search against an unreadable or empty catalogue', () => {
    // The false zero this exists to stop: nothing to search is not a gap.
    expect(shouldTrackSiteSearch('simen', 0)).toBe(false);
  });

  it('does not track an empty query, which clears the filter rather than searching', () => {
    expect(shouldTrackSiteSearch('', 16)).toBe(false);
  });

  it('does not track an empty query even when the catalogue is empty too', () => {
    expect(shouldTrackSiteSearch('', 0)).toBe(false);
  });
});
