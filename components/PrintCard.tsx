'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartImage } from './SmartImage';
import { getArtistById } from '@/data/artists';
import { formatDisplayPrice, getLowestProductPrices } from '@/lib/pricing';

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
  /** Localised category label; defaults to the catalogue value. */
  categoryLabel?: string;
  /** Localised out-of-stock label; defaults to the English string. */
  outOfStockLabel?: string;
}

/** Column widths of the 2/3/4 grid used by the category, collection, wall-art
 *  and artist templates. Same hint ProductsGrid gives for the same layout. */
const DEFAULT_SIZES = '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';

export const PrintCard: React.FC<PrintCardProps> = ({
  product,
  currency,
  onClick,
  className = '',
  priority = false,
  sizes = DEFAULT_SIZES,
  categoryLabel,
  outOfStockLabel = 'Out of stock'
}) => {
  // The picker's country prices every card unless a caller overrides it.
  // Before this, the prop defaulted to GBP and no template passed one, so
  // seven page types (the /no tree included) quoted pounds whatever the
  // buyer had selected; only /products, pricing inside ProductsGrid via
  // this same context, followed the picker.
  const { selectedCountry } = useLanguage();
  const activeCurrency = currency ?? selectedCountry.currency;


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
          // Descriptive for image search: the work, its maker, what it is.
          alt={`${product.name} Scandinavian art print by ${
            product.artistId ? getArtistById(product.artistId)?.name || product.brand : product.brand
          }`}
          priority={priority}
          sizes={sizes}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500 tracking-wide">
          <span>{product.artistId ? getArtistById(product.artistId)?.name || product.brand : product.brand}</span>
          <span>•</span>
          <span>{categoryLabel ?? product.category}</span>
        </div>
        <h3 className="text-sm text-neutral-900 leading-relaxed">
          {product.name}
        </h3>
        <p className="text-sm text-neutral-900">
          {formatDisplayPrice(getLowestProductPrices(product)[activeCurrency], activeCurrency)}
        </p>
        {!product.inStock && (
          <p className="text-xs text-neutral-400 mt-1">{outOfStockLabel}</p>
        )}
      </div>
    </div>
  );
}; 