'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductActionsStrings } from '@/lib/i18n';

const EN: ProductActionsStrings = {
  size: 'Size',
  frame: 'Frame',
  decreaseQuantity: 'Decrease quantity',
  increaseQuantity: 'Increase quantity',
  soldOut: 'Sold Out',
  selectSize: 'Select Size',
  addToCart: 'Add to Cart',
};
import { useCart, Product } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductPrices } from '@/lib/pricing';
import { frameOptions, getFramePrice } from '@/config/frame';
import { track } from '@/lib/analytics';

interface ProductActionsProps {
  product: Product;
  /** Localised labels; defaults to the English strings above. */
  strings?: ProductActionsStrings;
}

const SIZE_ORDER: Record<string, number> = {
  'A5': 1, 'A4': 2, 'A3': 3, '50x50cm': 4, 'A2': 5, '50x70cm': 6, 'A1': 7, 'A0': 8,
};

export const ProductActions: React.FC<ProductActionsProps> = ({ product, strings }) => {
  const t = strings ?? EN;
  const { addToCart } = useCart();
  const { formatPrice } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>('no-frame');


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
  };

  const currentPrices = getProductPrices(product, selectedSize || undefined);
  const framePriceGBP = getFramePrice(selectedFrame, selectedSize || undefined, 'GBP');
  const framePriceNOK = getFramePrice(selectedFrame, selectedSize || undefined, 'NOK');
  const framePriceUSD = getFramePrice(selectedFrame, selectedSize || undefined, 'USD');
  const framePriceDKK = getFramePrice(selectedFrame, selectedSize || undefined, 'DKK');
  const framePriceSEK = getFramePrice(selectedFrame, selectedSize || undefined, 'SEK');

  const totalPrices = {
    GBP: (currentPrices.GBP || 0) + framePriceGBP,
    NOK: (currentPrices.NOK || 0) + framePriceNOK,
    USD: (currentPrices.USD || 0) + framePriceUSD,
    DKK: (currentPrices.DKK || 0) + framePriceDKK,
    SEK: (currentPrices.SEK || 0) + framePriceSEK,
  };

  const hasAvailableSizes = availableSizes.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-2xl">{formatPrice(totalPrices)}</div>

      {availableSizes.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">{t.size}</p>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  track('select-size', { productId: product.id, productName: product.name, size });
                }}
                className={`px-4 py-2 border rounded text-sm transition-colors ${
                  selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm text-muted-foreground mb-2">{t.frame}</p>
        <div className="flex flex-wrap gap-2">
          {frameOptions.map(frame => (
            <button
              key={frame.id}
              onClick={() => {
                setSelectedFrame(frame.id);
                track('select-frame', { productId: product.id, productName: product.name, frame: frame.id });
              }}
              className={`px-4 py-2 border rounded text-sm transition-colors ${
                selectedFrame === frame.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'
              }`}
            >
              {t.frameLabels?.[frame.id] ?? frame.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button size="icon" variant="outline" aria-label={t.decreaseQuantity} onClick={() => setQuantity(Math.max(1, quantity - 1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center">{quantity}</span>
        <Button size="icon" variant="outline" aria-label={t.increaseQuantity} onClick={() => setQuantity(quantity + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={!hasAvailableSizes || (product.sizes && !selectedSize)}
        className="w-full"
        size="lg"
        // Watched by FeedbackIntercept: the card refuses to render if it would
        // cover this. Occlusion is the test, not co-presence.
        data-primary-cta="add-to-cart"
      >
        <ShoppingBag className="h-4 w-4 mr-2" />
        {!hasAvailableSizes ? t.soldOut : (product.sizes && !selectedSize) ? t.selectSize : t.addToCart}
      </Button>
    </div>
  );
};
