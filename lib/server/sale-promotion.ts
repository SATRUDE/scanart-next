import { isSalePromotionActive, SALE_CODE } from '@/lib/sale-promotion';
import { lookupDiscountCode, type DiscountLookup } from '@/lib/server/discounts';

/**
 * Whether NORDIC20 is on, asked of the store on the server: the same lookup
 * /api/validate-discount answers the browser from, held to the same exact-offer
 * test the page uses (20%, unframed only), so the feed and the structured data
 * show the sale exactly when the page does. Fails closed like every discount
 * lookup: no database or a switched-off, expired or changed code means the
 * full price.
 */
export async function isSaleOn(lookup: DiscountLookup = lookupDiscountCode): Promise<boolean> {
  const discount = await lookup(SALE_CODE);
  return isSalePromotionActive(discount ? { valid: true, ...discount } : null);
}
