// The phone basket bar (experiment basket-in-view, T-0529, approved by Mark
// 18 Nov 2026): on a product page on a phone, a slim bar pinned to the bottom
// of the screen repeats Add to basket whenever the main button is off screen.
// Goal: 1.5% of phone visits open the basket, judged after 28 days.
//
// The bar only ever repeats the main button: same handler, same events, same
// price. This file holds the one rule for when it shows, so it can be tested
// without a browser. Widths from tablet up hide it in CSS (`tab:hidden`).

export const BASKET_BAR_EXPERIMENT = 'basket-in-view';

export interface BasketBarInput {
  /** The main Add to basket button is at least partly on screen. */
  mainButtonInView: boolean;
  /** The site footer is on screen: the bar steps aside so it never sits on it. */
  footerInView: boolean;
  /** The main button would add something (a size is chosen, the print is on sale). */
  canAdd: boolean;
}

export function basketBarVisible({ mainButtonInView, footerInView, canAdd }: BasketBarInput): boolean {
  return canAdd && !mainButtonInView && !footerInView;
}
