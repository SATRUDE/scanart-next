import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { analyticsQuery, resultClickPath, shouldTrackSiteSearch, trackSearchResultClick, trackSearchSubmit } from './site-search-signal';

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

// T-0151. Every event goes to a mocked tracker: a test must never send to the
// live Umami (/api/send), so fetch is stubbed to fail the test if anything
// tries the network.

describe('analyticsQuery', () => {
  it('trims, lowercases and collapses spaces', () => {
    expect(analyticsQuery('  Simen   WAHLQVIST ')).toBe('simen wahlqvist');
  });

  it('keeps at most 100 characters', () => {
    expect(analyticsQuery('a'.repeat(250))).toHaveLength(100);
  });

  it('never carries an email address or a long number', () => {
    expect(analyticsQuery('Order for jane.doe@example.com')).toBe('order for [email]');
    expect(analyticsQuery('+47 912 34 567')).toBe('[number]');
    expect(analyticsQuery('order 1234567')).toBe('order [number]');
  });

  it('keeps sizes and short numbers, which are real searches', () => {
    expect(analyticsQuery('50x70')).toBe('50x70');
    expect(analyticsQuery('print 2024')).toBe('print 2024');
  });
});

describe('resultClickPath', () => {
  const origin = 'https://www.scandinavianart.co.uk';
  const link = (href: string) => ({ closest: () => ({ getAttribute: () => href }) }) as unknown as EventTarget;

  it('gives the path of an internal link, without query or hash', () => {
    expect(resultClickPath(link('/product/vinkveld?ref=x#top'), origin)).toBe('/product/vinkveld');
    expect(resultClickPath(link(`${origin}/no/artist/sia-siamos`), origin)).toBe('/no/artist/sia-siamos');
  });

  it('ignores an outside link and a click that is not on a link', () => {
    expect(resultClickPath(link('https://example.com/x'), origin)).toBeNull();
    expect(resultClickPath({ closest: () => null } as unknown as EventTarget, origin)).toBeNull();
    expect(resultClickPath(null, origin)).toBeNull();
  });
});

describe('search submit and result-click events', () => {
  const fetchSpy = vi.fn(() => {
    throw new Error('a test tried the network');
  });
  beforeEach(() => vi.stubGlobal('fetch', fetchSpy));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchSpy.mockClear();
  });

  it('records a submit with the cleaned query and the result count', () => {
    const track = vi.fn();
    trackSearchSubmit(track, '  Dragon ', 4, 'overlay', 20);
    expect(track).toHaveBeenCalledWith('site-search-submit', { query: 'dragon', results: 4, source: 'overlay' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('records a zero-result submit, the catalogue-gap signal', () => {
    const track = vi.fn();
    trackSearchSubmit(track, 'renate thor', 0, 'search-page', 20);
    expect(track).toHaveBeenCalledWith('site-search-submit', { query: 'renate thor', results: 0, source: 'search-page' });
  });

  it('records nothing for an empty query or an unreadable catalogue', () => {
    const track = vi.fn();
    trackSearchSubmit(track, '   ', 0, 'overlay', 20);
    trackSearchSubmit(track, 'dragon', 0, 'overlay', 0);
    expect(track).not.toHaveBeenCalled();
  });

  it('records a result click with the query and the path', () => {
    const track = vi.fn();
    trackSearchResultClick(track, 'Sia', '/artist/sia-siamos', 'overlay');
    expect(track).toHaveBeenCalledWith('site-search-click', { query: 'sia', path: '/artist/sia-siamos', source: 'overlay' });
  });

  it('records nothing for a click that went nowhere on the site', () => {
    const track = vi.fn();
    trackSearchResultClick(track, 'sia', null, 'overlay');
    trackSearchResultClick(track, '', '/artist/sia-siamos', 'overlay');
    expect(track).not.toHaveBeenCalled();
  });
});
