import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';
import { noPathFor } from './i18n';

const request = (path: string, extra: Record<string, string> = {}) =>
  new NextRequest(`https://www.scandinavianart.co.uk${path}`, {
    headers: { 'x-vercel-ip-country': 'NO', 'user-agent': 'Mozilla/5.0', ...extra },
  });

describe('manual language choice and first-visit redirects', () => {
  it.each(['/products', '/product/sunday-brunch', '/inspire', '/journal', '/privacy', '/terms', '/scandinavian-wall-art', '/feedback'])(
    'offers the translated %s without automatically redirecting the visitor', path => {
      expect(noPathFor(path)).toBe(`/no${path}`);
      expect(proxy(request(path)).headers.get('location')).toBeNull();
    },
  );

  it('keeps an existing automatic redirect and its query string', () => {
    expect(proxy(request('/collection/kitchen?utm_source=test')).headers.get('location'))
      .toBe('https://www.scandinavianart.co.uk/no/collection/kitchen?utm_source=test');
  });

  it('does not redirect a returning visitor or crawler', () => {
    expect(proxy(request('/collection/kitchen', { cookie: 'locale-offered=1' })).headers.get('location')).toBeNull();
    expect(proxy(request('/collection/kitchen', { 'user-agent': 'Googlebot' })).headers.get('location')).toBeNull();
  });

  it('keeps checkout outside both policies', () => {
    expect(noPathFor('/checkout')).toBeNull();
    expect(proxy(request('/checkout')).headers.get('location')).toBeNull();
  });

  it('does not overwrite an existing currency choice', () => {
    expect(proxy(request('/products', { cookie: 'geo-country=GB' })).cookies.get('geo-country')).toBeUndefined();
  });
});
