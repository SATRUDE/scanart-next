'use client';

import React, { useState, useEffect, useMemo, useId } from 'react';
import type { ProductActionsStrings } from '@/lib/i18n';
import { useCart, Product } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductPrices } from '@/lib/pricing';
import { frameOptions, getFramePrice } from '@/config/frame';
import { worldwideFrom, formatDeliveryPrice, type DeliveryGuide } from '@/lib/delivery-guide';
import { track } from '@/lib/analytics';
import { Button, Hairline } from '@/components/v2/ui';
import { OPTION_PAD } from '@/components/v2/OptionTrack';
import { sizeLabel } from '@/components/PrintCard';

const EN: ProductActionsStrings & { assurance: NonNullable<ProductActionsStrings['assurance']> } = {
  size: 'Size',
  frame: 'Frame',
  decreaseQuantity: 'Decrease quantity',
  increaseQuantity: 'Increase quantity',
  soldOut: 'Sold out',
  selectSize: 'Select a size',
  addToCart: 'Add to basket',
  frameLabels: {
    'no-frame': 'None',
    wood: 'Wood',
    black: 'Black',
    white: 'White',
  },
  // Facts from data/help.ts ("How long will my order take?", "Can I return my
  // order?", "What are your prints made of?"). {price} is the store's
  // cheapest delivery for an unframed print outside the UK, in the buyer's
  // currency (lib/server/delivery-guide.ts); the Delivery row says the exact
  // amount is worked out at checkout.
  assurance: {
    printed: 'Printed to order on 200gsm uncoated paper, made in 1–4 working days',
    delivery: 'UK delivery 2–3 working days, worldwide from {price} unframed',
    returns: '14 days to change your mind',
  },
};

interface ProductActionsProps {
  product: Product;
  /** Localised labels; defaults to the English strings above. */
  strings?: ProductActionsStrings;
  /** The store's "from" delivery prices, computed where the page renders. */
  deliveryGuide: DeliveryGuide;
  /** The page's language, for how the price is written ("£4,50" in Norwegian). */
  locale?: 'en' | 'no';
}

const SIZE_ORDER: Record<string, number> = {
  'A5': 1, 'A4': 2, 'A3': 3, '50x50cm': 4, 'A2': 5, '50x70cm': 6, 'A1': 7, 'A0': 8,
};

/**
 * The buying half of the V2 product panel (Figma 116:400): the Size and Frame
 * option groups (241:3726), Add to basket with the total in the button, and
 * the assurance lines (237:3729).
 *
 * The logic is the one this component has always had: sizes sorted and the
 * first selected by default, frame prices by size from config/frame.ts, the
 * total in the visitor's currency, and the add-to-cart / select-size /
 * select-frame events. Two things changed with the design: the quantity
 * stepper moved to the basket (Quantity 237:3701 lives on Basket item), so
 * the button adds one; and adding opens the basket panel, which is the
 * design's confirmation on a product page (the Toast is for surfaces where the
 * panel does not open).
 *
 * Both groups are shown even with one option (the Option group rule), as
 * native radio buttons so the choice is announced and arrow keys work.
 */
export const ProductActions: React.FC<ProductActionsProps> = ({ product, strings, deliveryGuide, locale = 'en' }) => {
  const t = { ...EN, ...strings, assurance: strings?.assurance ?? EN.assurance };
  const { addToCart, state, toggleCart } = useCart();
  const { formatPrice, selectedCountry } = useLanguage();
  const quantity = 1;
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>('no-frame');
  const groupId = useId();

  // Memoised because the array's identity feeds the useEffect below: a fresh
  // array every render would re-run the effect every render.
  const availableSizes = useMemo(
    () =>
      product.sizes
        ? Object.entries(product.sizes)
            .filter(([, available]) => available)
            .map(([size]) => size)
            .sort((a, b) => (SIZE_ORDER[a] ?? 99) - (SIZE_ORDER[b] ?? 99))
        : [],
    [product.sizes],
  );

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off: default the selected size once the available options are known
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) return;
    addToCart(product, quantity, selectedSize || undefined, selectedFrame);
    track('add-to-cart', {
      productId: product.id,
      productName: product.name,
      quantity,
      size: selectedSize || undefined,
      frame: selectedFrame || undefined,
    });
    if (!state.isOpen) toggleCart();
  };

  const currentPrices = getProductPrices(product, selectedSize || undefined);
  const framePrices = {
    GBP: getFramePrice(selectedFrame, selectedSize || undefined, 'GBP'),
    NOK: getFramePrice(selectedFrame, selectedSize || undefined, 'NOK'),
    USD: getFramePrice(selectedFrame, selectedSize || undefined, 'USD'),
    DKK: getFramePrice(selectedFrame, selectedSize || undefined, 'DKK'),
    SEK: getFramePrice(selectedFrame, selectedSize || undefined, 'SEK'),
  };

  const totalPrices = {
    GBP: (currentPrices.GBP || 0) + framePrices.GBP,
    NOK: (currentPrices.NOK || 0) + framePrices.NOK,
    USD: (currentPrices.USD || 0) + framePrices.USD,
    DKK: (currentPrices.DKK || 0) + framePrices.DKK,
    SEK: (currentPrices.SEK || 0) + framePrices.SEK,
  };

  const hasAvailableSizes = availableSizes.length > 0;
  const frameLabel = (id: string) => t.frameLabels?.[id] ?? frameOptions.find(f => f.id === id)?.name ?? id;

  // "worldwide from £4.50 unframed": the store's cheapest delivery outside
  // the UK, in the buyer's currency, from the same prices checkout charges.
  const currency = selectedCountry.currency;
  const deliveryLine = t.assurance.delivery.replace(
    '{price}',
    formatDeliveryPrice(worldwideFrom(deliveryGuide, currency), currency, locale),
  );

  const optionCls = 'peer sr-only';
  // Each option carries its own hairline (.option-mark in globals.css): the old
  // one shrinks away, the new one grows in, and the reserved space means nothing jumps.
  const labelCls =
    `relative flex cursor-pointer items-center ${OPTION_PAD} type-body tab:type-small opacity-55 transition-opacity hover:opacity-100 peer-checked:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus`;

  return (
    <div className="flex flex-col gap-group">
      <fieldset className="flex flex-col gap-3 border-t border-ink pt-4 tab:border-line tab:pt-5">
        <legend className="float-left w-full type-small tab:type-caption">{t.size}</legend>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {availableSizes.map(size => (
            <div key={size} className="relative">
              <input
                type="radio"
                id={`${groupId}-size-${size}`}
                name={`${groupId}-size`}
                value={size}
                checked={selectedSize === size}
                onChange={() => {
                  setSelectedSize(size);
                  track('select-size', { productId: product.id, productName: product.name, size });
                }}
                className={optionCls}
              />
              <label htmlFor={`${groupId}-size-${size}`} data-option={size} className={labelCls}>
                <span aria-hidden className="option-mark" />
                {sizeLabel(size)}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-ink pt-4 tab:border-t-0 tab:pt-0">
        <legend className="float-left flex w-full items-start justify-between type-small tab:type-caption">
          <span>{t.frame}</span>
          {selectedFrame !== 'no-frame' && (
            // Only the extra cost: the chosen frame is already marked below.
            <span>+{formatPrice(framePrices)}</span>
          )}
        </legend>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {frameOptions.map(frame => (
            <div key={frame.id} className="relative">
              <input
                type="radio"
                id={`${groupId}-frame-${frame.id}`}
                name={`${groupId}-frame`}
                value={frame.id}
                checked={selectedFrame === frame.id}
                onChange={() => {
                  setSelectedFrame(frame.id);
                  track('select-frame', { productId: product.id, productName: product.name, frame: frame.id });
                }}
                className={optionCls}
              />
              <label htmlFor={`${groupId}-frame-${frame.id}`} data-option={frame.id} className={labelCls}>
                <span aria-hidden className="option-mark" />
                {frameLabel(frame.id)}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="p-[3px]">
        <Button
          onClick={handleAddToCart}
          disabled={!hasAvailableSizes || (product.sizes && !selectedSize)}
          fullWidth
          price={hasAvailableSizes && selectedSize ? formatPrice(totalPrices) : undefined}
          // Watched by FeedbackIntercept: the card refuses to render if it would
          // cover this. Occlusion is the test, not co-presence.
          data-primary-cta="add-to-cart"
        >
          {!hasAvailableSizes ? t.soldOut : (product.sizes && !selectedSize) ? t.selectSize : t.addToCart}
        </Button>
      </div>

      <ul className="flex flex-col gap-[6px] tab:gap-1">
        {[t.assurance.printed, deliveryLine, t.assurance.returns].map(line => (
          <li key={line} className="flex items-start gap-[10px] type-caption tab:items-center tab:gap-tight">
            <Hairline className="mt-[9px] tab:mt-0" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
