import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addButtonState } from './basket-bar';
import { no } from './i18n/no';

const EN = { soldOut: 'Sold out', selectSize: 'Select a size', addToCart: 'Add to basket' };
const noActions = no.productPage.actions;
const NO = { soldOut: noActions.soldOut, selectSize: noActions.selectSize, addToCart: noActions.addToCart };
const ready = { published: true, hasAvailableSizes: true, needsSize: false };

// One state for both buttons, so whatever the in-page button showed on a
// phone before it was hidden, the bar now shows instead.
describe('addButtonState', () => {
  it('offers the add when a size is chosen', () => {
    expect(addButtonState({ ...ready, locale: 'en', strings: EN })).toEqual({ label: 'Add to basket', disabled: false });
    expect(addButtonState({ ...ready, locale: 'no', strings: NO })).toEqual({ label: NO.addToCart, disabled: false });
  });
  it('says Coming soon, disabled, for an unpublished print, in both languages', () => {
    expect(addButtonState({ ...ready, published: false, locale: 'en', strings: EN })).toEqual({ label: 'Coming soon', disabled: true });
    expect(addButtonState({ ...ready, published: false, locale: 'no', strings: NO })).toEqual({ label: 'Kommer snart', disabled: true });
  });
  it('says Sold out, disabled, when no size can be bought', () => {
    expect(addButtonState({ ...ready, hasAvailableSizes: false, locale: 'en', strings: EN })).toEqual({ label: 'Sold out', disabled: true });
    expect(addButtonState({ ...ready, hasAvailableSizes: false, locale: 'no', strings: NO })).toEqual({ label: NO.soldOut, disabled: true });
  });
  it('asks for a size, disabled, until one is chosen', () => {
    expect(addButtonState({ ...ready, needsSize: true, locale: 'en', strings: EN })).toEqual({ label: 'Select a size', disabled: true });
  });
  it('lets Coming soon win over Sold out, as the button always has', () => {
    expect(addButtonState({ published: false, hasAvailableSizes: false, needsSize: true, locale: 'en', strings: EN }).label).toBe('Coming soon');
  });
});

// The component needs a browser to render, so these guard the source: one
// add button per width, both from the same handler, state and price.
describe('ProductActions: one add button per width', () => {
  const src = readFileSync(path.join(__dirname, '../components/ProductActions.tsx'), 'utf8');
  const css = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');
  const feedback = readFileSync(path.join(__dirname, '../components/FeedbackIntercept.tsx'), 'utf8');
  // Each element itself: the attribute on its own line or at the start of a
  // tag, not a mention in a comment.
  const mainAt = src.search(/<div data-basket-main /);
  const barAt = src.search(/^\s*data-basket-bar$/m);
  const main = src.slice(mainAt, src.indexOf('</div>', mainAt));
  const bar = src.slice(barAt, src.indexOf('</Button>', barAt));

  it('renders both, the in-page button first', () => {
    expect(mainAt).toBeGreaterThan(0);
    expect(barAt).toBeGreaterThan(mainAt);
  });

  it('hides the in-page button on phones and shows it from tablet up', () => {
    const cls = main.match(/className="([^"]+)"/)![1].split(' ');
    expect(cls).toContain('hidden');
    expect(cls).toContain('tab:block');
  });

  it('shows the bar on phones only, at all times', () => {
    const cls = bar.match(/className="([^"]+)"/)![1].split(' ');
    expect(cls).toContain('fixed');
    expect(cls).toContain('tab:hidden');
    expect(cls).toContain('z-30');
    expect(bar).toContain('env(safe-area-inset-bottom)');
    // Never conditional: no `{showBar && (` or similar before the bar.
    expect(src.slice(0, barAt)).not.toMatch(/\{\s*\w+\s*&&\s*\(\s*<div\s*$/);
    expect(src).not.toContain('IntersectionObserver');
    expect(src).not.toMatch(/addEventListener\('scroll'/);
  });

  it('uses the same breakpoint for the bar, the hidden button and the page padding', () => {
    // tab: is --breakpoint-tab, 834px; the CSS rules are written as width < 834px.
    expect(css).toMatch(/--breakpoint-tab:\s*834px/);
    expect(css).toMatch(/@media \(width < 834px\) \{\s*body:has\(\[data-basket-bar\]\) \{\s*padding-bottom: calc\(75px \+ env\(safe-area-inset-bottom\)\);/);
  });

  it('gives the bar the same handler, state and price as the in-page button', () => {
    expect(main).toMatch(/onClick=\{\(\) => handleAddToCart\('main'\)\}/);
    expect(bar).toMatch(/onClick=\{\(\) => handleAddToCart\('bar'\)\}/);
    for (const block of [main, bar]) {
      expect(block).toContain('disabled={addButton.disabled}');
      expect(block).toContain('price={priceNode}');
      expect(block).toContain('{addButton.label}');
    }
    expect(src).toMatch(/track\('add-to-cart', \{[^}]*placement/);
    expect(src).toContain('trackAdvertisingCart(');
    expect(src).toContain('if (!state.isOpen) toggleCart();');
  });

  it('keeps the feedback card off whichever button is showing', () => {
    expect(main).toContain('data-primary-cta="add-to-cart"');
    expect(bar).toContain('data-primary-cta="add-to-cart"');
    // A button hidden at this width has an empty rect and must not count.
    expect(feedback).toMatch(/if \(b\.width === 0 && b\.height === 0\) return false;/);
    // On phones the card and the pill sit above the bar, not over it.
    expect(feedback.match(/data-feedback-float/g)!.length).toBeGreaterThanOrEqual(2);
    expect(css).toMatch(/body:has\(\[data-basket-bar\]\) \[data-feedback-float\] \{\s*bottom: calc\(75px \+ env\(safe-area-inset-bottom\) \+ 1rem\);/);
  });
});
