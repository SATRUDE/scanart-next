import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAMPAIGN_KEYS, campaignFromSearch, captureCampaign, cleanCampaign, cleanCampaignValue, resetCampaignForTest, visitCampaign } from './campaign';

beforeEach(() => resetCampaignForTest());
afterEach(() => vi.unstubAllGlobals());

describe('campaign label validation', () => {
  it('keeps plain labels and lower-cases them', () => {
    expect(cleanCampaignValue('meta')).toBe('meta');
    expect(cleanCampaignValue('first-ads-2026-11-09')).toBe('first-ads-2026-11-09');
    expect(cleanCampaignValue('vinkveld_room.static')).toBe('vinkveld_room.static');
    expect(cleanCampaignValue('Pinterest')).toBe('pinterest');
    expect(cleanCampaignValue('x'.repeat(80))).toBe('x'.repeat(80));
  });
  it('drops quotes, spaces, unicode, over-long, empty and non-string values', () => {
    for (const value of ["me'ta", 'me"ta', 'paid social', ' meta', 'meta;drop', 'me\\ta', 'vinkveld-æ', 'мета', 'x'.repeat(81), '', 5, null, undefined, {}, ['meta']]) {
      expect(cleanCampaignValue(value)).toBeUndefined();
    }
  });
  it('keeps only the four known keys and tolerates any input shape', () => {
    expect(cleanCampaign({ utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'c', utm_content: 'd', utm_term: 't', source: 'x' }))
      .toEqual({ utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'c', utm_content: 'd' });
    for (const input of [null, undefined, 'meta', 3, [], ['utm_source'], { utm_source: 'bad value' }]) expect(cleanCampaign(input)).toEqual({});
    expect(CAMPAIGN_KEYS).toEqual(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']);
  });
  it('reads a landing URL and ignores repeated or malformed parameters', () => {
    expect(campaignFromSearch('?utm_source=pinterest&utm_medium=paid&utm_campaign=first-pins-2026-11-10&utm_content=vinkveld-room-static&fbclid=abc'))
      .toEqual({ utm_source: 'pinterest', utm_medium: 'paid', utm_campaign: 'first-pins-2026-11-10', utm_content: 'vinkveld-room-static' });
    expect(campaignFromSearch('?utm_source=meta&utm_source=google&utm_medium=paid%20social')).toEqual({});
    expect(campaignFromSearch('')).toEqual({});
  });
});

describe('first touch, in memory only', () => {
  it('keeps the first campaign of the visit and ignores later ones', () => {
    captureCampaign('?utm_source=meta&utm_campaign=first-ads-2026-11-09');
    captureCampaign('?utm_source=google&utm_campaign=first-search-2026-11-10');
    expect(visitCampaign()).toEqual({ utm_source: 'meta', utm_campaign: 'first-ads-2026-11-09' });
  });
  it('is empty for a visit with no campaign, and a later tagged URL can still be captured', () => {
    captureCampaign('');
    expect(visitCampaign()).toEqual({});
    captureCampaign('?utm_source=pinterest');
    expect(visitCampaign()).toEqual({ utm_source: 'pinterest' });
  });
  it('hands out a copy, so a caller cannot change the stored campaign', () => {
    captureCampaign('?utm_source=meta');
    const copy = visitCampaign();
    copy.utm_source = 'changed';
    expect(visitCampaign()).toEqual({ utm_source: 'meta' });
  });
  it('writes nothing to cookies or any browser storage', () => {
    const touched: string[] = [];
    const trap = (name: string) => new Proxy({}, { get: (_t, key) => { touched.push(`${name}.${String(key)}`); return () => null; }, set: (_t, key) => { touched.push(`${name}.${String(key)}=`); return true; } });
    vi.stubGlobal('window', { location: { search: '?utm_source=meta&utm_medium=paid' }, localStorage: trap('localStorage'), sessionStorage: trap('sessionStorage'), indexedDB: trap('indexedDB') });
    vi.stubGlobal('document', trap('document'));
    captureCampaign();
    expect(visitCampaign()).toEqual({ utm_source: 'meta', utm_medium: 'paid' });
    expect(touched).toEqual([]);
  });
});
