// The consent banner as a slim bar on phones (Mark's decision board, 18 Nov
// 2026): on a product page the stacked phone panel covered everything under the
// picture. Since 27 Nov 2026 (option 3) it is a one-row strip on phones that
// stacks on top of the phone basket bar instead of covering Add to basket. The bar must stay legally the same banner: the same two choices with
// the same weight, nothing chosen in advance, and nothing loaded before Accept.
import { readFileSync } from 'node:fs';
import path from 'node:path';
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
    expect(html).toMatch(/<div class="grid shrink-0 grid-cols-2 gap-2 tab:flex tab:gap-3">/);
  });

  it('keeps both choices at least 44 px tall', () => {
    for (const b of buttons(render())) expect(b[1].split(' ')).toContain('min-h-11');
  });

  it('is one row on phones and keeps the tablet column and desktop row', () => {
    const html = render();
    expect(html).toContain('flex max-w-7xl flex-row items-center gap-3 tab:flex-col tab:items-stretch tab:gap-5 desk:flex-row desk:items-center desk:gap-10');
  });

  it('uses the short wording on phones and the full wording from tablet up', () => {
    const en = render();
    expect(en).toContain('<span class="tab:hidden">We use cookies for ads and site stats.</span>');
    expect(en).toContain('<span class="hidden tab:inline">We use cookies to improve your experience and show you relevant ads.</span>');
    expect(en).toMatch(/<span class="tab:hidden">Privacy<\/span><span class="hidden tab:inline">Privacy policy<\/span>/);
    const no = render('no');
    expect(no).toContain('<span class="tab:hidden">Vi bruker informasjons\u00ADkapsler til annonser og statistikk.</span>');
    expect(no).toContain('Vi bruker informasjonskapsler for å gi deg en bedre opplevelse og relevante annonser.');
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
    expect(cls).toContain('pt-[6px]');
    expect(cls).toContain('tab:py-6');
    expect(cls).toContain('tab:shadow-lg');
    expect(cls).not.toMatch(/(^|\s)shadow-lg/);
    expect(cls).toContain('env(safe-area-inset-bottom)');
    expect(cls).not.toMatch(/(^|\s)py-6/);
  });

  it('stacks on top of the phone basket bar instead of covering it', () => {
    const css = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');
    const phone = css.slice(css.indexOf('@media (width < 834px) {'));
    expect(phone).toMatch(/body:has\(\[data-basket-bar\]\) #advertising-consent \{\s*bottom: calc\(75px \+ env\(safe-area-inset-bottom\)\);/);
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
