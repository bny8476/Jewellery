import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Heart, ZoomIn, Maximize2, Play, 
  Rotate3d, ChevronLeft, ChevronRight, X, Video
} from 'lucide-react';
import { getJewelryFallbackImage } from '../../utils/imageUtils';

export interface GalleryMediaItem {
  id: string;
  type: 'image' | 'video' | '360';
  url: string;
  label: string;
  altText: string;
}

export interface ProductImageGalleryProps {
  product: {
    id: string;
    name: string;
    category: string;
    metal_type: string;
    purity?: string;
    image_url?: string | null;
    secondary_image_url?: string | null;
    gallery_images?: string[];
    video_url?: string | null;
    has_360?: boolean;
    view_360_urls?: string[] | null;
    sku?: string;
  };
  isInWishlist: boolean;
  onToggleWishlist: () => void;
  onOpenHuidModal?: () => void;
  onOpenVideoConsultModal?: () => void;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  isInWishlist,
  onToggleWishlist,
  onOpenHuidModal,
  onOpenVideoConsultModal
}) => {
  const fallback = getJewelryFallbackImage(product.category, product.metal_type);
  const primaryImg = product.image_url || fallback;

  // Build authentic media list strictly bound to this product's assets
  const mediaList = React.useMemo<GalleryMediaItem[]>(() => {
    const list: GalleryMediaItem[] = [];

    // 1. Primary main image
    list.push({
      id: `${product.id}-main`,
      type: 'image',
      url: primaryImg,
      label: 'Main View',
      altText: `${product.name} - Front View (${product.purity || 'BIS 916'})`
    });

    // 2. Extra images from gallery_images (avoid duplicating primary image)
    if (product.gallery_images && Array.isArray(product.gallery_images)) {
      product.gallery_images.forEach((imgUrl, idx) => {
        if (imgUrl && imgUrl !== primaryImg && !list.some(m => m.url === imgUrl)) {
          list.push({
            id: `${product.id}-gallery-${idx}`,
            type: 'image',
            url: imgUrl,
            label: idx === 0 ? 'Angle View' : `Detail View ${idx + 1}`,
            altText: `${product.name} - Angle ${idx + 1}`
          });
        }
      });
    }

    // 3. Secondary image (if distinct from primary and gallery)
    if (
      product.secondary_image_url && 
      product.secondary_image_url !== primaryImg &&
      !list.some(m => m.url === product.secondary_image_url)
    ) {
      list.push({
        id: `${product.id}-secondary`,
        type: 'image',
        url: product.secondary_image_url,
        label: 'Alternate Angle',
        altText: `${product.name} - Alternate View`
      });
    }

    // 4. Product-specific Video (only if product has genuine video_url)
    if (product.video_url && typeof product.video_url === 'string' && product.video_url.trim().length > 0) {
      list.push({
        id: `${product.id}-video`,
        type: 'video',
        url: product.video_url,
        label: 'Video Showcase',
        altText: `${product.name} - HD Commercial Film`
      });
    }

    // 5. Interactive 360° Studio (only if supported for this product)
    if (product.has_360 || (product.view_360_urls && product.view_360_urls.length > 0)) {
      list.push({
        id: `${product.id}-360`,
        type: '360',
        url: primaryImg,
        label: '360° Studio',
        altText: `${product.name} - Interactive 360° Spin`
      });
    }

    return list;
  }, [product, primaryImg]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Safety fallback if index is out of bounds
  const activeMedia = mediaList[activeMediaIndex] || mediaList[0] || {
    id: 'fallback',
    type: 'image',
    url: fallback,
    label: 'Main View',
    altText: product.name
  };

  // Image loading state for smooth skeleton shimmer
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Loupe Zoom States (Desktop)
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Mobile Pinch-to-zoom and touch swipe states
  const [mobileScale, setMobileScale] = useState(1);
  const touchStartDist = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // 360-Degree Drag Simulator States
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isDragging360, setIsDragging360] = useState(false);
  const dragStartX = useRef(0);
  const startAngle = useRef(0);

  // Fullscreen Lightbox Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(false);

  // Reset active media when product changes
  useEffect(() => {
    setActiveMediaIndex(0);
    setIsZoomed(false);
    setMobileScale(1);
    setIsImageLoading(true);
  }, [product.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMedia.type !== 'image') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  // 360 Drag Handlers
  const handleMouseDown360 = (e: React.MouseEvent) => {
    setIsDragging360(true);
    dragStartX.current = e.clientX;
    startAngle.current = rotationAngle;
  };

  const handleMouseMove360 = (e: React.MouseEvent) => {
    if (!isDragging360) return;
    const deltaX = e.clientX - dragStartX.current;
    const newAngle = (startAngle.current + deltaX * 0.9) % 360;
    setRotationAngle(newAngle < 0 ? newAngle + 360 : newAngle);
  };

  const handleMouseUp360 = () => {
    setIsDragging360(false);
  };

  // Mobile Touch Handlers: Pinch-to-zoom and Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      if (activeMedia.type === '360') {
        setIsDragging360(true);
        dragStartX.current = e.touches[0].clientX;
        startAngle.current = rotationAngle;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / touchStartDist.current;
      const newScale = Math.min(3, Math.max(1, scaleFactor));
      setMobileScale(newScale);
    } else if (e.touches.length === 1 && activeMedia.type === '360' && isDragging360) {
      const deltaX = e.touches[0].clientX - dragStartX.current;
      const newAngle = (startAngle.current + deltaX * 0.9) % 360;
      setRotationAngle(newAngle < 0 ? newAngle + 360 : newAngle);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      touchStartDist.current = null;
      if (activeMedia.type === '360') {
        setIsDragging360(false);
      } else if (mobileScale === 1 && touchStartX.current !== null) {
        const deltaX = (e.changedTouches[0]?.clientX || 0) - touchStartX.current;
        if (Math.abs(deltaX) > 50) {
          if (deltaX < 0) {
            // Swipe Left -> Next
            setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
          } else {
            // Swipe Right -> Prev
            setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
          }
        }
      }
      touchStartX.current = null;
    }
  };

  const navigateNext = useCallback(() => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
    setIsZoomed(false);
    setIsImageLoading(true);
  }, [mediaList.length]);

  const navigatePrev = useCallback(() => {
    setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    setIsZoomed(false);
    setIsImageLoading(true);
  }, [mediaList.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') navigateNext();
      if (e.key === 'ArrowLeft') navigatePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, navigateNext, navigatePrev]);

  return (
    <div className="space-y-4 select-none">
      {/* 1. Main Stage / Hero Viewport with Luxury Neutral Ivory Background */}
      <div
        id="product-hero-image"
        onMouseEnter={() => activeMedia.type === 'image' && setIsZoomed(true)}
        onMouseLeave={() => {
          setIsZoomed(false);
          if (isDragging360) handleMouseUp360();
        }}
        onMouseMove={(e) => {
          if (activeMedia.type === '360') {
            handleMouseMove360(e);
          } else {
            handleMouseMove(e);
          }
        }}
        onMouseDown={(e) => activeMedia.type === '360' && handleMouseDown360(e)}
        onMouseUp={() => activeMedia.type === '360' && handleMouseUp360()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative aspect-[4/5] bg-gradient-to-b from-[#FAF7F1] via-[#FAF6F0] to-[#F5EFE6] dark:from-[#1A1215] dark:via-[#160E11] dark:to-[#120B0E] rounded-3xl overflow-hidden border border-[#E7DEC8] dark:border-[#3E2D34] shadow-md group flex items-center justify-center ${
          activeMedia.type === '360' ? 'cursor-ew-resize' : 'cursor-crosshair'
        }`}
      >
        {/* Shimmer loading skeleton */}
        {isImageLoading && activeMedia.type === 'image' && (
          <div className="absolute inset-0 bg-[#FAF7F1] dark:bg-[#1A1215] flex items-center justify-center animate-pulse z-0">
            <div className="w-16 h-16 rounded-full border-2 border-[#C49A50]/30 border-t-[#C49A50] animate-spin" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeMedia.type === 'image' && (
            <motion.img
              key={activeMedia.url}
              src={activeMedia.url}
              alt={activeMedia.altText}
              onLoad={() => setIsImageLoading(false)}
              onClick={() => setIsLightboxOpen(true)}
              initial={{ opacity: 0.8, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isZoomed ? 'scale(2.5)' : `scale(${mobileScale})`,
                transition: isZoomed ? 'none' : 'transform 0.3s ease-out'
              }}
              className="w-full h-full object-cover object-center will-change-transform cursor-zoom-in relative z-1"
            />
          )}

          {activeMedia.type === 'video' && (
            <motion.div
              key="video-player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/95 relative z-1"
            >
              <video
                src={activeMedia.url}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-contain"
              />
            </motion.div>
          )}

          {activeMedia.type === '360' && (
            <motion.div
              key="360-viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center relative z-1"
            >
              <div 
                className="w-full h-full flex items-center justify-center select-none"
                style={{
                  transform: `perspective(600px) rotateY(${rotationAngle}deg)`,
                  filter: `drop-shadow(${Math.sin((rotationAngle * Math.PI) / 180) * 14}px 8px 18px rgba(91,16,34,0.18))`
                }}
              >
                <img
                  src={activeMedia.url}
                  alt={activeMedia.altText}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>

              {/* 360 Control Indicator Bar */}
              <div className="absolute bottom-5 inset-x-8 bg-[#252329]/85 backdrop-blur-md px-4 py-2 rounded-full flex items-center justify-between text-white text-[11px] border border-[#C49A50]/40 shadow-lg pointer-events-none">
                <span className="flex items-center gap-1.5 font-medium text-[#C49A50]">
                  <Rotate3d className="w-4 h-4 animate-spin text-[#C49A50]" />
                  <span>Interactive 360° View</span>
                </span>
                <span className="font-mono text-[10px] text-stone-300">
                  Drag left / right ({Math.round(rotationAngle)}°)
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Prev / Next On-Hover Arrows */}
        {mediaList.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigatePrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-[#252329]/80 hover:bg-white text-[#252329] dark:text-[#FAF7F1] border border-[#E7DEC8] dark:border-[#3E2D34] shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-[#252329]/80 hover:bg-white text-[#252329] dark:text-[#FAF7F1] border border-[#E7DEC8] dark:border-[#3E2D34] shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Floating Top Left: BIS 916 Hallmark Badge */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5B1022]/95 dark:bg-[#28050E]/95 backdrop-blur-md border border-[#C49A50]/60 text-[#FAF7F1] text-[10px] font-sans font-semibold tracking-wider uppercase shadow-md pointer-events-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C49A50]" />
            <span>{product.purity || '22K BIS 916'}</span>
            {onOpenHuidModal && (
              <button
                type="button"
                onClick={onOpenHuidModal}
                className="ml-1 text-[10px] text-[#C49A50] hover:underline font-bold cursor-pointer"
                title="Verify HUID Unique Identification"
              >
                (HUID)
              </button>
            )}
          </div>
        </div>

        {/* Floating Top Right: Fullscreen Lightbox & Wishlist Buttons */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-[#252329]/90 hover:bg-white text-[#252329] dark:text-[#FAF7F1] border border-[#E7DEC8] dark:border-[#3E2D34] shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Open Fullscreen Gallery"
            aria-label="Fullscreen Gallery"
          >
            <Maximize2 className="w-4 h-4 text-[#5B1022] dark:text-[#C49A50]" />
          </button>

          <button
            type="button"
            onClick={onToggleWishlist}
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md border transition-all cursor-pointer ${
              isInWishlist
                ? 'bg-[#5B1022] text-[#C49A50] border-[#C49A50]/60 scale-105'
                : 'bg-white/90 dark:bg-[#252329]/90 text-[#252329] dark:text-[#FAF7F1] border-[#E7DEC8] dark:border-[#3E2D34] hover:bg-white hover:text-[#5B1022] hover:scale-105'
            }`}
            aria-label="Toggle Wishlist"
            title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current text-[#C49A50]' : ''}`} />
          </button>
        </div>

        {/* Floating Bottom Left: Loupe Status Indicator */}
        {activeMedia.type === 'image' && (
          <div className="absolute bottom-4 left-4 z-20 pointer-events-none transition-opacity">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#252329]/80 backdrop-blur-md text-white text-[10px] font-sans tracking-wider border border-white/10 shadow-xs">
              <ZoomIn className="w-3.5 h-3.5 text-[#C49A50]" />
              <span>{isZoomed ? '2.5× Loupe Active' : 'Hover to Inspect • Click for Fullscreen'}</span>
            </div>
          </div>
        )}

        {/* Floating Bottom Right: Image Counter */}
        {mediaList.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90 border border-white/10">
              {activeMediaIndex + 1} / {mediaList.length}
            </span>
          </div>
        )}
      </div>

      {/* 2. Horizontal Thumbnail Navigation Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {mediaList.map((item, idx) => {
          const isSelected = activeMediaIndex === idx;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveMediaIndex(idx);
                setIsZoomed(false);
                setIsImageLoading(true);
              }}
              className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-[#FAF7F1] to-white dark:from-[#1A1215] dark:to-[#120B0E] transition-all shrink-0 cursor-pointer flex flex-col items-center justify-center group ${
                isSelected
                  ? 'border-[#5B1022] dark:border-[#C49A50] ring-2 ring-[#C49A50]/40 scale-105 shadow-md'
                  : 'border-[#E7DEC8] dark:border-[#3E2D34] opacity-75 hover:opacity-100 hover:border-[#C49A50]/60'
              }`}
              title={item.altText}
            >
              {item.type === 'image' && (
                <img
                  src={item.url}
                  alt={item.altText}
                  className="w-full h-full object-cover object-center"
                />
              )}

              {item.type === 'video' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#5B1022]/10 dark:bg-[#C49A50]/15 rounded-xl text-[#5B1022] dark:text-[#C49A50]">
                  <Play className="w-5 h-5 fill-current" />
                  <span className="text-[9px] font-bold mt-0.5">Video</span>
                </div>
              )}

              {item.type === '360' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#C49A50]/10 rounded-xl text-[#C49A50]">
                  <Rotate3d className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">360°</span>
                </div>
              )}

              {/* Miniature label overlay on hover */}
              <span className="absolute bottom-0 inset-x-0 bg-[#252329]/80 text-[8.5px] text-white py-0.5 text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Live Video Consultation Action Card (Shown if customer wants to see it on live video) */}
        {onOpenVideoConsultModal && (
          <button
            type="button"
            onClick={onOpenVideoConsultModal}
            className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#C49A50]/50 hover:border-[#5B1022] dark:hover:border-[#C49A50] bg-[#FAF7F1]/80 dark:bg-[#1A1215]/80 p-1.5 transition-all shrink-0 cursor-pointer flex flex-col items-center justify-center group text-center"
            title="Book a live 1-on-1 video call to view this piece"
          >
            <Video className="w-5 h-5 text-[#5B1022] dark:text-[#C49A50] group-hover:scale-110 transition-transform mb-1" />
            <span className="text-[9px] font-semibold text-[#5B1022] dark:text-[#C49A50] leading-tight">
              Live Video
            </span>
          </button>
        )}
      </div>

      {/* 3. Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1400] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-lg text-[#C49A50]">{product.name}</h3>
                <p className="text-xs text-stone-400">
                  View {activeMediaIndex + 1} of {mediaList.length} • {activeMedia.label}
                  {product.sku && ` • SKU: ${product.sku}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeMedia.type === 'image' && (
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(!lightboxZoom)}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{lightboxZoom ? 'Reset Zoom' : 'Zoom 2x'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setLightboxZoom(false);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close Fullscreen View"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Media Stage */}
            <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
              {mediaList.length > 1 && (
                <button
                  type="button"
                  onClick={navigatePrev}
                  className="absolute left-4 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="max-w-4xl max-h-[75vh] w-full h-full flex items-center justify-center overflow-auto">
                {activeMedia.type === 'video' ? (
                  <video
                    src={activeMedia.url}
                    controls
                    autoPlay
                    loop
                    className="max-h-full max-w-full rounded-2xl"
                  />
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.altText}
                    style={{
                      transform: lightboxZoom ? 'scale(2)' : 'scale(1)',
                      transition: 'transform 0.3s ease-out'
                    }}
                    className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-2xl cursor-pointer"
                    onClick={() => setLightboxZoom(!lightboxZoom)}
                  />
                )}
              </div>

              {mediaList.length > 1 && (
                <button
                  type="button"
                  onClick={navigateNext}
                  className="absolute right-4 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Footer Thumbnails */}
            <div className="flex items-center justify-center gap-3 overflow-x-auto pt-4 border-t border-white/10">
              {mediaList.map((item, idx) => (
                <button
                  key={`lightbox-${item.id}`}
                  type="button"
                  onClick={() => {
                    setActiveMediaIndex(idx);
                    setLightboxZoom(false);
                  }}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-white/5 transition-all cursor-pointer ${
                    activeMediaIndex === idx ? 'border-[#C49A50] scale-110' : 'border-white/20 opacity-60'
                  }`}
                  title={item.altText}
                >
                  <img src={item.url} alt={item.altText} className="w-full h-full object-cover object-center" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductImageGallery;
