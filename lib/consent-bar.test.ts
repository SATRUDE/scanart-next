// The consent banner as a slim bar on phones (Mark's decision board, 18 Nov
// 2026): on a product page the stacked phone panel covered everything under the
// picture. The bar must stay legally the same banner: the same two choices with
// the same weight, nothing chosen in advance, and nothing loaded before Accept.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/advertising', () => ({ ADVERTISING_ENABLED: true }));

import { AdvertisingConsent } from '@/components/AdvertisingConsent';
import { Button } from '@/components/v2/ui';
import { loadConsentedAdvertising } from './advertising-consent';

const render = (locale: 'en' | 'no' = 'en') => renderToStaticMarkup(createElement(AdvertisingConsent, { locale }));
const buttons = (html: string) => [...html.matchAll(/<button[^>]*class="([^"]*)"[^>]*>(.*?)<\/button>/g)];
const sectionClass = (html: string) => html.match(/<section[^>]*class="([^"]*)"/)?.[1] ?? '';

afterEach(() => { vi.unstubAllGlobals(); });

describe('consent bar on phones', () => {
  it('offers exactly Reject and Accept, with identical styling, Reject first', () => {
    const found = buttons(render());
    expect(found.map(b => b[2].replace(/<[^>]+>/g, ''))).toEqual(['Reject', 'Accept']);
    expect(found[0][1]).toBe(found[1][1]);
    expect(found[0][1]).toContain('border-ink');
    expect(buttons(render('no')).map(b => b[2].replace(/<[^>]+>/g, ''))).toEqual(['Avslå', 'Godta']);
  });

  it('puts the two choices side by side on phones, so neither sits lower than the other', () => {
    const html = render();
    expect(html).toMatch(/<div class="grid grid-cols-2 gap-3 tab:flex tab:flex-row desk:shrink-0">/);
  });

  it('pre-ticks nothing: no checkbox, toggle or pre-selected control', () => {
    const html = render();
    expect(html).not.toMatch(/type="checkbox"|role="switch"|aria-checked|aria-pressed|checked/);
  });

  it('keeps the same copy and the privacy link', () => {
    const html = render();
    expect(html).toContain('We use cookies to improve your experience and show you relevant ads.');
    expect(html).toContain('href="/privacy#advertising"');
    expect(render('no')).toContain('href="/no/privacy#advertising"');
  });

  it('keeps the heading for screen readers on phones and shows it from tablet up', () => {
    const html = render();
    expect(html).toMatch(/<h2 id="advertising-consent-title" class="sr-only tab:not-sr-only type-h3">Cookies<\/h2>/);
    expect(html).toContain('aria-labelledby="advertising-consent-title"');
  });

  it('is slim on phones and keeps the tablet and desktop padding', () => {
    const cls = sectionClass(render());
    expect(cls).toContain('pt-3');
    expect(cls).toContain('tab:py-6');
    expect(cls).toContain('env(safe-area-inset-bottom)');
    expect(cls).not.toMatch(/(^|\s)py-6/);
  });

  it('stays non-modal and above everything fixed at the bottom of the page', () => {
    const html = render();
    expect(html).not.toContain('aria-modal');
    expect(sectionClass(html)).toContain('z-[60]');
  });

  it('loads no advertising script until a saved Accept exists', () => {
    const appended: unknown[] = [];
    vi.stubGlobal('window', {
      location: { hostname: 'www.scandinavianart.co.uk' },
      screen: { width: 390, height: 844 },
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    });
    vi.stubGlobal('navigator', { webdriver: false, userAgent: 'iPhone', maxTouchPoints: 5 });
    vi.stubGlobal('document', { createElement: () => ({}), head: { appendChild: (s: unknown) => appended.push(s) } });
    render();
    loadConsentedAdvertising();
    expect(appended).toEqual([]);
  });
});

describe('Button compact size', () => {
  const cls = (size?: 'regular' | 'compact') =>
    renderToStaticMarkup(Button({ variant: 'secondary', size, children: 'x' })).match(/class="([^"]*)"/)?.[1] ?? '';

  it('is shorter on phones only and regular from tablet up', () => {
    expect(cls('compact')).toContain('py-[10px]');
    expect(cls('compact')).toContain('tab:py-4');
  });
  it('leaves every existing button unchanged by default', () => {
    expect(cls()).toContain('px-6 py-4');
    expect(cls()).not.toContain('py-[10px]');
  });
});
