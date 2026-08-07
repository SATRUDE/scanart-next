import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SmartImage } from './SmartImage';
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
  /** Set on the cards above the fold so the LCP image is preloaded, not lazy. */
  priority?: boolean;
  /**
   * Responsive width hint for the optimiser. The default matches the
   * 2/3/4-column grid the landing templates use; the article and product
   * "related prints" grids have their own column counts and pass their own.
   */
  sizes?: string;
}

/** Column widths of the 2/3/4 grid used by the category, collection, wall-art
 *  and artist templates. Same hint ProductsGrid gives for the same layout. */
const DEFAULT_SIZES = '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';

export const PrintCard: React.FC<PrintCardProps> = ({
  product,
  currency = 'GBP',
  onClick,
  className = '',
  priority = false,
  sizes = DEFAULT_SIZES
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
        {/* SmartImage, not the raw-<img> AvifImage: this card is the whole
            print grid on the category, collection, wall-art and artist
            templates, and outside next/image those pages served the full-size
            source PNG (7.5 MB across /scandinavian-wall-art's twenty prints).
            SmartImage keeps the same .avif-to-.png fallback and skeleton. */}
        <SmartImage
          src={product.image}
          alt={product.name}
          priority={priority}
          sizes={sizes}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
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
          {formatPrice(getLowestProductPrices(product), currency)}
        </p>
        {!product.inStock && (
          <p className="text-xs text-neutral-400 mt-1">Out of stock</p>
        )}
      </div>
    </div>
  );
}; 