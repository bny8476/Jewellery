import React, { useState, useEffect, useRef } from 'react';
import { getJewelryFallbackImage } from '../../utils/imageUtils';

export interface ProductImageProps {
  src?: string | null;
  secondarySrc?: string | null;
  alt: string;
  category?: string;
  metalType?: string;
  aspectRatio?: '4/5' | '1/1' | 'auto';
  fit?: 'cover' | 'contain';
  containerClassName?: string;
  imageClassName?: string;
  loading?: 'lazy' | 'eager';
  hoverZoom?: boolean;
  padding?: string;
  crossfadeSecondary?: boolean;
  imageRef?: React.Ref<HTMLImageElement>;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  showSkeleton?: boolean;
}

/**
 * Reusable Global Product Image Container Component for YAZHINI Fine Jewels.
 * Enforces standardized 4:5 aspect ratio, clean warm-ivory / white luxury background,
 * strict object-fit: contain (no cropping, no stretching, no distortion),
 * consistent padding, and rock-solid instant image rendering without stuck spinners.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  secondarySrc,
  alt,
  category = 'Jewellery',
  metalType = 'gold',
  aspectRatio = '4/5',
  fit = 'cover',
  containerClassName = '',
  imageClassName = '',
  loading = 'eager',
  hoverZoom = true,
  padding = '',
  crossfadeSecondary = true,
  imageRef,
  onClick,
  showSkeleton = true
}) => {
  const fallback = getJewelryFallbackImage(category, metalType);
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallback);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const internalImgRef = useRef<HTMLImageElement | null>(null);

  // Sync state whenever primary src or fallback changes
  useEffect(() => {
    const targetSrc = src || fallback;
    setCurrentSrc(targetSrc);
    setHasError(false);

    // If image is already cached by browser, mark as loaded immediately
    if (internalImgRef.current && internalImgRef.current.complete && internalImgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, fallback]);

  const handleRef = (node: HTMLImageElement | null) => {
    internalImgRef.current = node;

    if (typeof imageRef === 'function') {
      imageRef(node);
    } else if (imageRef && 'current' in imageRef) {
      (imageRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
    }

    // Check if the browser already has the image loaded from cache
    if (node && node.complete && node.naturalWidth > 0) {
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!hasError && currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setHasError(true);
    }
    // Always mark loaded to avoid lingering skeletons on error
    setIsLoaded(true);
  };

  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';
  const aspectClass = aspectRatio === '4/5' ? 'aspect-[4/5]' : aspectRatio === '1/1' ? 'aspect-square' : '';

  return (
    <div
      onClick={onClick}
      className={`product-image-container relative w-full ${aspectClass} bg-gradient-to-b from-[#FAF7F1] via-[#FAF6F0] to-[#F5EFE6] dark:from-[#170E12] dark:via-[#140C10] dark:to-[#0F080C] ${padding} flex items-center justify-center overflow-hidden rounded-xl select-none ${containerClassName}`}
      style={{
        contain: 'layout paint',
      }}
    >
      {/* Subtle luxury warm shimmer skeleton while awaiting initial decode */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F1]/80 via-[#F3EDE2]/60 to-[#FAF7F1]/80 dark:from-[#170E12]/80 dark:to-[#0F080C]/80 animate-pulse pointer-events-none z-0" />
      )}

      {/* Primary Image: Strict object-fit: contain, centered, progressive render */}
      <img
        ref={handleRef}
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full ${fitClass} object-center drop-shadow-sm will-change-transform z-1 transition-opacity duration-300 ${
          hoverZoom ? 'group-hover:scale-105 transition-transform duration-500 ease-out' : ''
        } ${
          crossfadeSecondary && secondarySrc ? 'group-hover:opacity-0 transition-opacity duration-300' : ''
        } ${imageClassName}`}
        style={{
          imageRendering: '-webkit-optimize-contrast',
          maxHeight: '100%',
          maxWidth: '100%'
        }}
      />

      {/* Secondary Image Crossfade on Hover (if available) */}
      {crossfadeSecondary && secondarySrc && (
        <img
          src={secondarySrc}
          alt={`${alt} alternate angle`}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full ${fitClass} object-center ${padding} opacity-0 group-hover:opacity-100 drop-shadow-sm will-change-transform z-2 ${
            hoverZoom ? 'group-hover:scale-105 transition-all duration-500 ease-out' : 'transition-opacity duration-300'
          }`}
          style={{
            imageRendering: '-webkit-optimize-contrast',
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        />
      )}

      {/* Subtle luxury sheen sweep on card hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 z-3" />
    </div>
  );
};

export default ProductImage;
