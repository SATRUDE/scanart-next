'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartImage } from './SmartImage';
import { getArtistById } from '@/data/artists';
import { formatDisplayPrice, getLowestProductPrices } from '@/lib/pricing';
import { printImageAlt, type AltLocale } from '@/lib/product-image-alt';
import { warmImage } from '@/lib/warm-image';

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
   * Responsive width hint for the optimiser. The default matches a three
   * column grid on desktop, two on tablet and one on mobile.
   */
  sizes?: string;
  /** Localised category label; kept for callers, not shown in the V2 caption. */
  categoryLabel?: string;
  /** Localised out-of-stock label; defaults to the English string. */
  outOfStockLabel?: string;
  /**
   * Language of the page this card sits on, which is what the image's alt text
   * is written in. Defaults to English; the /no templates pass 'no'.
   */
  locale?: AltLocale;
  /** The card title's heading level: h3 under a section h2 (the default), h2 directly under the page H1. */
  headingLevel?: 'h2' | 'h3';
}

const DEFAULT_SIZES = '(max-width: 833px) 100vw, (max-width: 1199px) 50vw, 33vw';

/** '50x70cm' → '50 × 70 cm'; 'A3' stays 'A3'. */
export function sizeLabel(size: string): string {
  const m = size.match(/^(\d+)x(\d+)cm$/i);
  return m ? `${m[1]} × ${m[2]} cm` : size;
}

/**
 * The image's proportions follow the print (Figma: Print tile 17:89): Square
 * for 50 × 50, Tall 5:7 for 50 × 70 and the A sizes, so every print sits at its
 * own shape on the warm image background instead of being cropped to one.
 */
export function tileAspect(size: string | undefined): string {
  if (!size) return 'aspect-[5/7]';
  const m = size.match(/^(\d+)x(\d+)cm$/i);
  if (m && m[1] === m[2]) return 'aspect-square';
  if (m && Number(m[1]) > Number(m[2])) return 'aspect-[5/4]';
  return 'aspect-[5/7]';
}

/**
 * V2 print tile. Standard image on image-bg, then the caption 8 below:
 * title and price on the first line, artist — size underneath with the brand
 * hairline. Callers wrap it in the link to the product.
 */
export const PrintCard: React.FC<PrintCardProps> = ({
  product,
  currency,
  onClick,
  className = '',
  priority = false,
  sizes = DEFAULT_SIZES,
  outOfStockLabel = 'Out of stock',
  locale = 'en',
  headingLevel = 'h3',
}) => {
  // The picker's country prices every card unless a caller overrides it, so
  // every template quotes the buyer's own currency.
  const { selectedCountry } = useLanguage();
  const activeCurrency = currency ?? selectedCountry.currency;
  const artistName = product.artistId ? getArtistById(product.artistId)?.name || product.brand : product.brand;
  const size = Object.keys(product.prices)[0];
  const Title = headingLevel;

  return (
    <div className={`group flex flex-col gap-tight ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      <div className={`${tileAspect(size)} w-full overflow-hidden bg-image-bg`}>
        {/* SmartImage, not a raw <img>: this tile is the whole print grid on
            the landing templates, and outside next/image those pages served
            the full-size source PNGs (7.5 MB on /scandinavian-wall-art). */}
        <SmartImage
          // The warm-backdrop copy of the standard shot (lib/warm-image.ts).
          src={warmImage(product.image)}
          // Descriptive for image search: the work, its maker, what it is, in
          // the page's language. One helper for the whole site.
          alt={printImageAlt(
            {
              name: product.name,
              artist: product.artistId ? getArtistById(product.artistId)?.name : undefined,
              brand: product.brand,
              category: product.category,
            },
            locale
          )}
          priority={priority}
          sizes={sizes}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
        />
      </div>
      <div>
        <div className="flex items-start justify-between gap-4 type-body">
          <Title className="type-body">{product.name}</Title>
          <p className="shrink-0">{formatDisplayPrice(getLowestProductPrices(product)[activeCurrency], activeCurrency)}</p>
        </div>
        <p className="flex items-center gap-[6px] type-caption">
          <span>{artistName}</span>
          {size && (
            <>
              <span aria-hidden className="hairline" />
              <span>{sizeLabel(size)}</span>
            </>
          )}
        </p>
        {!product.inStock && <p className="mt-1 type-caption">{outOfStockLabel}</p>}
      </div>
    </div>
  );
};
