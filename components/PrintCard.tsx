import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AvifImage } from './AvifImage';
import { getArtistById } from '@/data/artists';
import { getLowestProductPrices } from '@/lib/pricing';

interface PrintCardProps {
  product: {
    id: string;
    name: string;
    prices: {
      [key: string]: {
        GBP: number;
        NOK: number;
        USD: number;
        DKK: number;
        SEK: number;
      };
    };
    image: string;
    category: string;
    brand: string;
    artistId?: string;
    inStock: boolean;
  };
  currency?: 'GBP' | 'NOK' | 'USD' | 'DKK' | 'SEK';
  onClick?: () => void;
  className?: string;
}

export const PrintCard: React.FC<PrintCardProps> = ({
  product,
  currency = 'GBP',
  onClick,
  className = ''
}) => {
  const formatPrice = (prices: any, selectedCurrency: string) => {
    const price = prices[selectedCurrency];
    const symbols: { [key: string]: string } = {
      GBP: '£',
      NOK: 'kr',
      USD: '$',
      DKK: 'kr',
      SEK: 'kr'
    };
    return `${symbols[selectedCurrency]}${price}`;
  };

  return (
    <div 
      className={`group cursor-pointer ${className}`} 
      onClick={onClick}
    >
      <div className="aspect-[3/4] overflow-hidden bg-neutral-50 mb-6">
        <AvifImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
          fallbackSrc={product.image.replace('.avif', '.png')}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500 tracking-wide">
          <span>{product.artistId ? getArtistById(product.artistId)?.name || product.brand : product.brand}</span>
          <span>•</span>
          <span>{product.category}</span>
        </div>
        <h3 className="text-sm text-neutral-900 leading-relaxed">
          {product.name}
        </h3>
        <p className="text-sm text-neutral-900">
          {(() => {
            const lowestPrices = getLowestProductPrices(product);
            console.log(`🎴 PrintCard (${product.name}): Displaying lowest prices:`, lowestPrices);
            return formatPrice(lowestPrices, currency);
          })()}
        </p>
        {!product.inStock && (
          <p className="text-xs text-neutral-400 mt-1">Out of stock</p>
        )}
      </div>
    </div>
  );
}; 