// The phone basket bar (experiment basket-in-view, T-0529, approved by Mark
// 18 Nov 2026; changed on his review of PR #292 to "fixed at all times"): on a
// product page on a phone, a slim bar pinned to the bottom of the screen
// repeats Add to basket with the price. It does not come and go on scroll.
// Goal: 1.5% of phone visits open the basket, judged after 28 days.
//
// The bar only ever repeats the main button: same handler, same events, same
// price. Widths from tablet up hide it in CSS (`tab:hidden`), and the body
// gets matching bottom padding on phones in app/globals.css so the footer and
// the last content are never hidden behind it.

export const BASKET_BAR_EXPERIMENT = 'basket-in-view';

export interface BasketBarInput {
  /** The main button would add something (a size is chosen, the print is on sale). */
  canAdd: boolean;
}

/** Whether the bar is rendered. Scroll position plays no part: once a print
 *  can be added, the bar stays put for the whole visit to the page. */
export function basketBarShown({ canAdd }: BasketBarInput): boolean {
  return canAdd;
}
