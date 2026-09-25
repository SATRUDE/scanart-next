'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { basketStrings, chromeAria, isNoPath } from '@/lib/i18n';
import { SmartImage } from '@/components/SmartImage';
import { getProductPrices, formatDisplayPrice, type Currency } from '@/lib/pricing';
import { getFramePrice } from '@/config/frame';
import { shippingRates } from '@/config/shipping';
import { track } from '@/lib/analytics';
import { printImageAlt } from '@/lib/product-image-alt';
import { Button, Hairline } from '@/components/v2/ui';

/** '50x70cm' → '50 × 70 cm' (as PrintCard's sizeLabel). */
function sizeLabel(size: string): string {
  const m = size.match(/^(\d+)x(\d+)cm$/i);
  return m ? `${m[1]} × ${m[2]} cm` : size;
}

/**
 * "As a guide: UK £5.99, Norway and Denmark £6.59, …": the real rates from
 * config/shipping.ts in the buyer's currency, with regions that cost the same
 * joined, so the guide can never disagree with what checkout charges.
 */
function deliveryGuide(currency: Currency, regions: Record<string, string>, and: string): string {
  const groups: { names: string[]; cost: number }[] = [];
  for (const rate of shippingRates) {
    const cost = rate.costs[currency];
    const name = regions[rate.countryCode] ?? rate.countryName;
    const same = groups.find(g => g.cost === cost && rate.countryCode !== 'ELSEWHERE');
    if (same) same.names.push(name);
    else groups.push({ names: [name], cost });
  }
  // Pence stay visible ("£5.99"): these are exact rates, not rounded prices.
  const format = (cost: number) =>
    currency === 'GBP' ? `£${cost.toFixed(2)}` : currency === 'USD' ? `$${cost.toFixed(2)}` : formatDisplayPrice(cost, currency);
  return groups
    .sort((a, b) => a.cost - b.cost)
    .map(g => `${g.names.length > 1 ? `${g.names.slice(0, -1).join(', ')} ${and} ${g.names[g.names.length - 1]}` : g.names[0]} ${format(g.cost)}`)
    .join(', ');
}

/**
 * The basket panel (Figma Basket panel 242:4070; pages 215:3131 desktop,
 * 215:3414 mobile, 215:3297 / 215:3477 empty). A 480 panel from the right over
 * the scrim on desktop, a full-screen sheet on mobile. Opens from the
 * header's Basket button and after Add to basket.
 *
 * All the cart logic is CartContext's, unchanged: items, quantity, remove,
 * totals in the buyer's currency. This file only draws it, and keeps the
 * funnel events it always fired (cart-open, remove-from-cart, checkout).
 * Checkout follows the page's language: /no/checkout from the Norwegian tree.
 */
export const Cart: React.FC = () => {
  const { state, removeFromCart, updateQuantity, closeCart, getTotalPriceInCurrency, getTotalItems } = useCart();
  const { selectedCountry } = useLanguage();
  const locale = isNoPath(usePathname() || '/') ? 'no' : 'en';
  const aria = chromeAria[locale];
  const t = basketStrings[locale];
  const prefix = locale === 'no' ? '/no' : '';
  const router = useRouter();
  const currency = selectedCountry.currency;
  const count = getTotalItems();

  // The cart-open step sits between add-to-cart and checkout in the funnel.
  useEffect(() => {
    if (state.isOpen) {
      track('cart-open', {
        itemCount: state.items.reduce((n, i) => n + i.quantity, 0),
      });
    }
    // Deliberately only on open/close: mutating items with the cart open is
    // not a second "open".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isOpen]);

  const subtotal = getTotalPriceInCurrency(currency);

  const handleCheckout = () => {
    track('checkout', {
      itemCount: state.items.reduce((n, i) => n + i.quantity, 0),
      total: subtotal,
      currency,
    });
    closeCart();
    // Norwegian visitors check out in Norwegian: /no/checkout exists and is
    // noindex like the English one.
    router.push(locale === 'no' ? '/no/checkout' : '/checkout');
  };

  return (
    <Dialog.Root open={state.isOpen} onOpenChange={open => { if (!open) closeCart(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim overlay-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="cart-slide-in fixed inset-y-0 right-0 z-50 flex w-full flex-col gap-5 overflow-y-auto bg-bg px-margin pt-6 pb-8 tab:w-[480px] tab:gap-group tab:p-10"
        >
          <div className="flex items-baseline justify-between gap-6">
            <Dialog.Title className="type-h2">
              {count > 0 ? t.titleCount.replace('{count}', String(count)) : t.title}
            </Dialog.Title>
            <Dialog.Close className="type-small transition-colors hover:text-brand">{t.close}</Dialog.Close>
          </div>

          {state.items.length === 0 ? (
            <div className="flex flex-col gap-group border-t border-ink pt-8">
              <p className="type-h3">{t.emptyHeading}</p>
              <p className="type-body">{t.emptyBody}</p>
              <div className="flex flex-wrap items-center gap-group">
                <Button href={`${prefix}/products`} onClick={closeCart}>{t.seePrints}</Button>
                <Link href={`${prefix}/inspire`} onClick={closeCart} className="type-body transition-colors hover:text-brand">
                  {t.startFromWall}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ul>
                {state.items.map(item => {
                  const unit = getProductPrices(item.product, item.size)[currency] + getFramePrice(item.frame || 'no-frame', item.size, currency);
                  const line = Math.round(unit * item.quantity * 100) / 100;
                  const description = [item.size ? sizeLabel(item.size) : null, t.frames[item.frame || 'no-frame']].filter(Boolean).join(', ');
                  return (
                    <li
                      key={`${item.product.id}-${item.size || 'no-size'}-${item.frame || 'no-frame'}`}
                      className="flex gap-5 border-t border-ink py-5"
                    >
                      <Link
                        href={`${prefix}/product/${item.product.slug}`}
                        onClick={closeCart}
                        className="h-[120px] w-[96px] shrink-0 bg-image-bg"
                      >
                        {/* 96 × 120 box: without this hint SmartImage's '100vw'
                            default makes the browser pick a full-viewport
                            variant to fill a thumbnail. */}
                        <SmartImage
                          src={item.product.image}
                          alt={printImageAlt({ name: item.product.name, artist: item.product.artist, brand: item.product.brand, category: item.product.category }, locale)}
                          className="h-full w-full"
                          sizes="96px"
                        />
                      </Link>
                      <div className="flex min-h-[120px] min-w-0 flex-1 flex-col justify-between gap-3">
                        <div className="flex flex-col gap-[2px]">
                          <div className="flex items-start justify-between gap-4 type-body">
                            <p>{item.product.name}</p>
                            <p className="shrink-0">{formatDisplayPrice(line, currency)}</p>
                          </div>
                          {(item.product.artist || item.product.brand) && <p className="type-small">{item.product.artist || item.product.brand}</p>}
                          <p className="type-small">{description}</p>
                        </div>
                        <div className="flex items-center justify-between type-small">
                          {/* Quantity 237:3701 */}
                          <div className="flex items-center gap-[14px]">
                            <button
                              type="button"
                              aria-label={aria.cart.decreaseQuantity}
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.frame)}
                              className="transition-colors hover:text-brand"
                            >
                              −
                            </button>
                            <span aria-live="polite">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={aria.cart.increaseQuantity}
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.frame)}
                              className="transition-colors hover:text-brand"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label={`${aria.cart.removePrefix} ${item.product.name}`}
                            onClick={() => {
                              track('remove-from-cart', { productId: item.product.id, productName: item.product.name, size: item.size, frame: item.frame });
                              removeFromCart(item.product.id, item.size, item.frame);
                            }}
                            className="transition-colors hover:text-brand"
                          >
                            {t.remove}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Basket summary 240:4490 */}
              <div className="flex flex-col gap-[10px] border-t border-ink pt-5">
                <div className="flex items-start justify-between type-body">
                  <p>{t.subtotal}</p>
                  <p>{formatDisplayPrice(subtotal, currency)}</p>
                </div>
                <div className="flex items-start justify-between gap-4 type-small">
                  <p>{t.delivery}</p>
                  <p>{t.deliveryValue}</p>
                </div>
                <p className="type-caption">
                  {t.guidePrefix} {deliveryGuide(currency, t.regions, t.and)}.
                </p>
              </div>

              <ul className="flex flex-col gap-[6px]">
                {t.assurance.map(line => (
                  <li key={line} className="flex items-center gap-[10px] type-caption">
                    <Hairline />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="p-[3px]">
                <Button onClick={handleCheckout} fullWidth price={formatDisplayPrice(subtotal, currency)}>
                  {t.checkout}
                </Button>
              </div>
              <button type="button" onClick={closeCart} className="self-start type-body transition-colors hover:text-brand">
                {t.continueShopping}
              </button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
