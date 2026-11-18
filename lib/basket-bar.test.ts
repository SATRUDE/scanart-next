import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { basketBarShown } from './basket-bar';

describe('basketBarShown', () => {
  it('shows whenever something can be added', () => {
    expect(basketBarShown({ canAdd: true })).toBe(true);
  });
  it('never offers a sold out, coming soon or sizeless print', () => {
    expect(basketBarShown({ canAdd: false })).toBe(false);
  });
});

// The experiment is only measurable if a tap on the bar is the same add as a
// tap on the main button: same handler, so the same add-to-cart event and the
// same basket opening (cart-open). Guarded in source because the component
// needs a browser to render.
describe('ProductActions basket bar', () => {
  const src = readFileSync(path.join(__dirname, '../components/ProductActions.tsx'), 'utf8');
  // The bar element itself: the attribute on a line of its own, not a mention in a comment.
  const bar = src.slice(src.search(/^\s*data-basket-bar$/m));
  const css = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');

  it('is rendered by ProductActions', () => {
    expect(src).toContain('data-basket-bar');
  });
  it('calls the main button handler, so add-to-cart and cart-open fire as they do today', () => {
    expect(bar).toMatch(/onClick=\{\(\) => handleAddToCart\('bar'\)\}/);
    expect(src).toMatch(/onClick=\{\(\) => handleAddToCart\('main'\)\}/);
    expect(src).toMatch(/track\('add-to-cart', \{[^}]*placement/);
  });
  it('is fixed at all times: nothing watches the scroll to show or hide it', () => {
    expect(src).not.toContain('IntersectionObserver');
    expect(src).not.toMatch(/addEventListener\('scroll'/);
  });
  it('is phones only and sits under the feedback card, the basket panel and the consent banner', () => {
    const cls = bar.slice(0, 600);
    expect(cls).toContain('tab:hidden');
    expect(cls).toMatch(/\bz-30\b/);
    expect(cls).toContain('env(safe-area-inset-bottom)');
  });
  it('is not a primary CTA, so the feedback card can still show above it', () => {
    const barBlock = bar.slice(0, bar.indexOf('</Button>'));
    expect(barBlock).not.toContain('data-primary-cta');
  });
  it('pads the page bottom on phones so the footer is never hidden behind it', () => {
    expect(css).toMatch(/@media \(width < 834px\) \{\s*body:has\(\[data-basket-bar\]\) \{\s*padding-bottom: calc\(75px \+ env\(safe-area-inset-bottom\)\);/);
  });
});
