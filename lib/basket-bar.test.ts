import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { basketBarVisible } from './basket-bar';

describe('basketBarVisible', () => {
  it('shows only when the main button is off screen, the footer is not in view and something can be added', () => {
    expect(basketBarVisible({ mainButtonInView: false, footerInView: false, canAdd: true })).toBe(true);
  });
  it('hides while the main button is on screen', () => {
    expect(basketBarVisible({ mainButtonInView: true, footerInView: false, canAdd: true })).toBe(false);
  });
  it('steps aside for the footer', () => {
    expect(basketBarVisible({ mainButtonInView: false, footerInView: true, canAdd: true })).toBe(false);
  });
  it('never offers a sold out, coming soon or sizeless print', () => {
    expect(basketBarVisible({ mainButtonInView: false, footerInView: false, canAdd: false })).toBe(false);
  });
});

// The experiment is only measurable if a tap on the bar is the same add as a
// tap on the main button: same handler, so the same add-to-cart event and the
// same basket opening (cart-open). Guarded in source because the component
// needs a browser to render.
describe('ProductActions basket bar', () => {
  const src = readFileSync(path.join(__dirname, '../components/ProductActions.tsx'), 'utf8');
  const bar = src.slice(src.indexOf('data-basket-bar'));

  it('is rendered by ProductActions', () => {
    expect(src).toContain('data-basket-bar');
  });
  it('calls the main button handler, so add-to-cart and cart-open fire as they do today', () => {
    expect(bar).toMatch(/onClick=\{\(\) => handleAddToCart\('bar'\)\}/);
    expect(src).toMatch(/onClick=\{\(\) => handleAddToCart\('main'\)\}/);
    expect(src).toMatch(/track\('add-to-cart', \{[^}]*placement/);
  });
  it('is phones only and sits under the consent banner and the basket panel', () => {
    const cls = bar.slice(0, 600);
    expect(cls).toContain('tab:hidden');
    expect(cls).toMatch(/\bz-30\b/);
  });
});
