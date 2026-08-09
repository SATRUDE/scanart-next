'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import type { ProductImage } from '@/lib/product-image-alt';

interface ProductImageGalleryWrapperProps {
  /**
   * Each image carries its own alt text, built from catalogue data by
   * lib/product-image-alt. Pairing the two here rather than passing parallel
   * arrays keeps them in step when a blank src is filtered out below.
   */
  images: ProductImage[];
  productName: string;
}

export const ProductImageGalleryWrapper: React.FC<ProductImageGalleryWrapperProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const validImages = images.filter(img => img.src && img.src.trim() !== '');
  const hasMultiple = validImages.length > 1;

  const goTo = (index: number) => {
    const next = (index + validImages.length) % validImages.length;
    setSelectedIndex(next);
    // Image 0 is the print itself; anything after is a scene shot, and whether
    // people look at scenes is the signal this event exists for.
    track('gallery-image-view', { productName, imageIndex: next, isScene: next > 0 });
  };

  return (
    <div>
      <div className="aspect-[3/4] overflow-hidden bg-neutral-50 rounded cursor-pointer relative" onClick={() => setShowLightbox(true)}>
        <Image
          src={validImages[selectedIndex].src}
          alt={validImages[selectedIndex].alt}
          fill
          preload
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover hover:scale-[1.02] transition-transform duration-300"
        />
        {hasMultiple && (
          <>
            <Button aria-label="Previous image" size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex - 1); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button aria-label="Next image" size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex + 1); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {validImages.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === selectedIndex ? 'w-6 bg-primary' : 'w-2 bg-black/20'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setShowLightbox(false)}>
          <Button aria-label="Close image viewer" size="icon" variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/10" onClick={() => setShowLightbox(false)}>
            <X className="h-6 w-6" />
          </Button>
          {/* Lightbox opens on click (not the LCP) and is object-contain in a
              variable-size overlay, which next/image fill doesn't suit; keep raw. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={validImages[selectedIndex].src} alt={validImages[selectedIndex].alt} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          {hasMultiple && (
            <>
              <Button aria-label="Previous image" size="icon" variant="ghost" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex - 1); }}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button aria-label="Next image" size="icon" variant="ghost" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex + 1); }}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
