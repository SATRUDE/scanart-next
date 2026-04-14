'use client';

import React, { useState, useEffect } from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  secondarySrc?: string;
  useSecondary?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src, alt, className = '', loading = 'lazy', onLoad, onError, secondarySrc, useSecondary = false,
}) => {
  const [imageSrc, setImageSrc] = useState(useSecondary && secondarySrc ? secondarySrc : src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newSrc = useSecondary && secondarySrc ? secondarySrc : src;
    setImageSrc(newSrc);
    setHasError(false);
    setIsLoading(true);
  }, [src, secondarySrc, useSecondary]);

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

  return (
    <div className={`relative ${className}`}>
      {isLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />}
      <img src={imageSrc} alt={alt} loading={loading} onLoad={handleLoad} onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`} />
    </div>
  );
};
