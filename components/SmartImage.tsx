'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  /** LCP images: paint immediately (eager, no skeleton/fade, preloaded). */
  priority?: boolean;
  /** Responsive sizes hint so the optimizer serves a correctly-sized image. */
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  secondarySrc?: string;
  useSecondary?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src, alt, className = '', loading = 'lazy', priority = false, sizes = '100vw',
  onLoad, onError, secondarySrc, useSecondary = false,
}) => {
  const desiredSrc = useSecondary && secondarySrc ? secondarySrc : src;
  const [imageSrc, setImageSrc] = useState(desiredSrc);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset during render when the desired source changes (matching AvifImage),
  // rather than in an effect, which would trigger cascading renders.
  const [prevDesired, setPrevDesired] = useState(desiredSrc);
  if (prevDesired !== desiredSrc) {
    setPrevDesired(desiredSrc);
    setImageSrc(desiredSrc);
    setHasError(false);
    setIsLoading(true);
  }

  const getFallbackSrc = (originalSrc: string): string | null => {
    if (originalSrc.endsWith('.png')) return null;
    if (originalSrc.endsWith('.avif')) return originalSrc.replace('.avif', '.png');
    if (originalSrc.endsWith('.jpg') || originalSrc.endsWith('.jpeg')) return originalSrc.replace(/\.(jpg|jpeg)$/, '.png');
    return null;
  };

  const handleLoad = () => { setIsLoading(false); onLoad?.(); };

  const handleError = () => {
    if (!hasError) {
      if (useSecondary && secondarySrc && imageSrc === secondarySrc) { setImageSrc(src); setHasError(true); return; }
      const fallbackSrc = getFallbackSrc(imageSrc);
      if (fallbackSrc && fallbackSrc !== imageSrc) { setImageSrc(fallbackSrc); setHasError(true); return; }
    }
    setIsLoading(false);
    onError?.();
  };

  // Priority (LCP) images must paint the moment they arrive: no opacity gate and
  // no skeleton, both of which delay the largest contentful paint. Below-the-fold
  // images keep the lazy skeleton + fade-in.
  const showSkeleton = !priority && isLoading;

  return (
    <div className={`relative ${className}`}>
      {showSkeleton && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        {...(priority ? {} : { loading })}
        onLoad={handleLoad}
        onError={handleError}
        className={`object-cover ${priority ? '' : isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
};
