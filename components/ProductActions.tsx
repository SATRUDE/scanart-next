'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, Product } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProductPrices } from '@/lib/pricing';
import { frameOptions, getFramePrice } from '@/config/frame';

interface ProductActionsProps {
  product: Product;
}

export const ProductActions: React.FC<ProductActionsProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { formatPrice, selectedCountry } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>('no-frame');

  const sizeOrder: Record<string, number> = {
    'A5': 1, 'A4': 2, 'A3': 3, '50x50cm': 4, 'A2': 5, '50x70cm': 6, 'A1': 7, 'A0': 8,
  };

  const availableSizes = product.sizes
    ? Object.entries(product.sizes)
        .filter(([, available]) => available)
        .map(([size]) => size)
        .sort((a, b) => (sizeOrder[a] ?? 99) - (sizeOrder[b] ?? 99))
    : [];

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) return;
    addToCart(product, quantity, selectedSize || undefined, selectedFrame);
    (window as any).umami?.track('add-to-cart', {
      productId: product.id,
      productName: product.name,
      quantity,
      size: selectedSize || undefined,
      frame: selectedFrame || undefined,
    });
  };

  const currentPrices = getProductPrices(product, selectedSize || undefined);
  const framePriceGBP = getFramePrice(selectedFrame, 'GBP');
  const framePriceNOK = getFramePrice(selectedFrame, 'NOK');
  const framePriceUSD = getFramePrice(selectedFrame, 'USD');
  const framePriceDKK = getFramePrice(selectedFrame, 'DKK');
  const framePriceSEK = getFramePrice(selectedFrame, 'SEK');

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
          <p className="text-sm text-muted-foreground mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
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
        <p className="text-sm text-muted-foreground mb-2">Frame</p>
        <div className="flex flex-wrap gap-2">
          {frameOptions.map(frame => (
            <button
              key={frame.id}
              onClick={() => setSelectedFrame(frame.id)}
              className={`px-4 py-2 border rounded text-sm transition-colors ${
                selectedFrame === frame.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'
              }`}
            >
              {frame.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button size="icon" variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center">{quantity}</span>
        <Button size="icon" variant="outline" onClick={() => setQuantity(quantity + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={!hasAvailableSizes || (product.sizes && !selectedSize)}
        className="w-full"
        size="lg"
      >
        <ShoppingBag className="h-4 w-4 mr-2" />
        {!hasAvailableSizes ? 'Sold Out' : (product.sizes && !selectedSize) ? 'Select Size' : 'Add to Cart'}
      </Button>
    </div>
  );
};
