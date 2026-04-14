'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImageGalleryWrapperProps {
  images: string[];
  productName: string;
}

export const ProductImageGalleryWrapper: React.FC<ProductImageGalleryWrapperProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const validImages = images.filter(img => img && img.trim() !== '');
  const hasMultiple = validImages.length > 1;

  const goTo = (index: number) => {
    setSelectedIndex((index + validImages.length) % validImages.length);
  };

  return (
    <div>
      <div className="aspect-[3/4] overflow-hidden bg-neutral-50 rounded cursor-pointer relative" onClick={() => setShowLightbox(true)}>
        <img
          src={validImages[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
        />
        {hasMultiple && (
          <>
            <Button size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex - 1); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex + 1); }}>
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
          <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/10" onClick={() => setShowLightbox(false)}>
            <X className="h-6 w-6" />
          </Button>
          <img src={validImages[selectedIndex]} alt={productName} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          {hasMultiple && (
            <>
              <Button size="icon" variant="ghost" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex - 1); }}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button size="icon" variant="ghost" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); goTo(selectedIndex + 1); }}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
