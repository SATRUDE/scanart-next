import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

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