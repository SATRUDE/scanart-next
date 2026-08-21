import { describe, it, expect } from 'vitest';
import { outboundHost } from '@/components/OutboundLink';

// The host is what groups outbound clicks in Umami, so a malformed href in
// article copy must degrade the event rather than break the reader's click.
describe('outboundHost', () => {
  it('strips the scheme and www so one destination groups as one host', () => {
    expect(outboundHost('https://www.amazon.co.uk/dp/993542040X')).toBe('amazon.co.uk');
    expect(outboundHost('https://amazon.co.uk/dp/993542040X')).toBe('amazon.co.uk');
  });

  it('keeps distinct publishers distinct', () => {
    expect(outboundHost('https://www.dewilewis.com/products/here-far-away')).toBe('dewilewis.com');
    expect(outboundHost('https://setantabooks.com/product/x')).toBe('setantabooks.com');
    expect(outboundHost('https://lenz.press/anything')).toBe('lenz.press');
  });

  it('lowercases, so a capitalised href does not split the group', () => {
    expect(outboundHost('https://WWW.Amazon.co.UK/dp/1')).toBe('amazon.co.uk');
  });

  it('returns a marker rather than throwing on a malformed href', () => {
    expect(outboundHost('not a url')).toBe('unparsed');
    expect(outboundHost('')).toBe('unparsed');
  });
});
