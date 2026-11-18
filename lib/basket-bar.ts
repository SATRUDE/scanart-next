// The phone basket bar (experiment basket-in-view, T-0529, approved by Mark
// 18 Nov 2026; changed on his reviews of PR #292 to "fixed at all times" and
// then "I don't need 2 buttons, just the fixed button"): on a product page on
// a phone, a slim bar pinned to the bottom of the screen carries Add to basket
// with the price. It does not come and go on scroll, and it is the ONLY add
// button on a phone: the in-page button is hidden below the tablet breakpoint
// and shown exactly as before from tablet up, where the bar is hidden.
// Goal: 1.5% of phone visits open the basket, judged after 28 days.
//
// Both buttons share one handler (same add, same add-to-cart event, same
// basket opening), one price and one state from addButtonState below, so
// whatever the in-page button says (Coming soon, Sold out, Select a size) the
// bar says too. Widths from tablet up hide the bar in CSS (`tab:hidden`), and
// the body gets matching bottom padding on phones in app/globals.css so the
// footer and the last content are never hidden behind it.

export const BASKET_BAR_EXPERIMENT = 'basket-in-view';

export interface AddButtonInput {
  /** False only when the product is explicitly unpublished (coming soon). */
  published: boolean;
  /** At least one size can be bought. */
  hasAvailableSizes: boolean;
  /** The product has sizes and none is chosen yet. */
  needsSize: boolean;
  locale: 'en' | 'no';
  strings: { soldOut: string; selectSize: string; addToCart: string };
}

export interface AddButtonState {
  label: string;
  disabled: boolean;
}

/** What the add button says and whether it can be pressed. The in-page
 *  button (tablet up) and the phone bar both render from this, so neither can
 *  offer an add the other refuses. */
export function addButtonState({ published, hasAvailableSizes, needsSize, locale, strings }: AddButtonInput): AddButtonState {
  if (!published) return { label: locale === 'no' ? 'Kommer snart' : 'Coming soon', disabled: true };
  if (!hasAvailableSizes) return { label: strings.soldOut, disabled: true };
  if (needsSize) return { label: strings.selectSize, disabled: true };
  return { label: strings.addToCart, disabled: false };
}
