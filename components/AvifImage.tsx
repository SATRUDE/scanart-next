'use client';

import React, { useState } from 'react';

interface AvifImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const AvifImage: React.FC<AvifImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  loading = 'lazy',
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // reset during render when src changes (not in an effect, which would also
  // clobber the already-complete check below on mount)
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }

  // An image that finishes loading before hydration never fires onLoad, which
  // left it at opacity-0 behind the pulse forever (cached images especially).
  // The ref callback runs on attach, so an already-complete image is marked
  // loaded without waiting for an event that already fired.
  const markLoadedIfComplete = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Convert AVIF to PNG fallback if no fallback is provided
  const getFallbackSrc = (originalSrc: string) => {
    if (fallbackSrc) return fallbackSrc;
    if (originalSrc.endsWith('.avif')) {
      return originalSrc.replace('.avif', '.png');
    }
    return originalSrc;
  };

  // Handle error more gracefully
  const handleError = () => {
    if (!hasError) {
      const fallback = getFallbackSrc(src);
      if (fallback !== src) {
        setImageSrc(fallback);
        setHasError(true);
      } else {
        setIsLoading(false);
        onError?.();
      }
    } else {
      setIsLoading(false);
      onError?.();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        ref={markLoadedIfComplete}
        src={imageSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
}; 