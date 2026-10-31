import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Heart, ZoomIn, Maximize2, Play, 
  Rotate3d, ChevronLeft, ChevronRight, X, Video, Share2, Check, AlertCircle
} from 'lucide-react';
import { getJewelryFallbackImage } from '../../utils/imageUtils';
import { ProductVariant, ProductImage } from '../../types/productGallery';
import { toast } from '../../utils/toast';

export interface GalleryMediaItem {
  id: string;
  type: 'image' | 'video' | '360';
  url: string;
  label: string;
  altText: string;
  viewType?: string;
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
  selectedVariant?: ProductVariant | null;
  isInWishlist: boolean;
  onToggleWishlist: () => void;
  onOpenHuidModal?: () => void;
  onOpenVideoConsultModal?: () => void;
  onShare?: () => void;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  selectedVariant,
  isInWishlist,
  onToggleWishlist,
  onOpenHuidModal,
  onOpenVideoConsultModal,
  onShare
}) => {
  const fallback = getJewelryFallbackImage(product.category, product.metal_type);
  const primaryImg = product.image_url || fallback;

  // Determine if a selected variant was provided and check if it has images
  const variantSpecified = Boolean(selectedVariant);
  const variantHasImages = Boolean(selectedVariant && selectedVariant.images && selectedVariant.images.length > 0);
  const variantLacksImages = variantSpecified && !variantHasImages;

  // Build authentic media list strictly bound to the selected variant or product
  const mediaList = useMemo<GalleryMediaItem[]>(() => {
    // If a variant is selected and has its own images, strictly show the variant's images
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      const list: GalleryMediaItem[] = selectedVariant.images.map((img: ProductImage, idx: number) => ({
        id: img.id || `${selectedVariant.id}-img-${idx}`,
        type: img.type === 'video' ? 'video' : (img.type === '360' ? '360' : 'image'),
        url: img.url,
        label: img.label || (img.type === 'model' ? 'Worn by Model' : img.type === 'detail' ? 'Close-up Detail' : img.type === 'side' ? 'Angle View' : `View ${idx + 1}`),
        altText: img.alt || `${product.name} - ${selectedVariant.color} (${img.label || 'View'})`,
        viewType: img.type
      }));

      // Append video if product has authentic video and not already in variant images
      if (product.video_url && !list.some(m => m.type === 'video')) {
        list.push({
          id: `${selectedVariant.id}-video`,
          type: 'video',
          url: product.video_url,
          label: 'Video Showcase',
          altText: `${product.name} - Commercial Film`,
          viewType: 'video'
        });
      }

      // Append 360 viewer if supported
      if (product.has_360 && !list.some(m => m.type === '360')) {
        list.push({
          id: `${selectedVariant.id}-360`,
          type: '360',
          url: selectedVariant.thumbnailUrl || list[0]?.url || primaryImg,
          label: '360° Studio',
          altText: `${product.name} - 360 Spin`,
          viewType: '360'
        });
      }

      return list;
    }

    // Fallback: If variant specified but has 0 images, return empty list (triggers explicit empty state)
    if (variantLacksImages) {
      return [];
    }

    // Default: derive from product attributes
    const list: GalleryMediaItem[] = [];

    // 1. Primary main image
    list.push({
      id: `${product.id}-main`,
      type: 'image',
      url: primaryImg,
      label: 'Main View',
      altText: `${product.name} - Front View (${product.purity || 'BIS 916'})`,
      viewType: 'front'
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
            altText: `${product.name} - Angle ${idx + 1}`,
            viewType: idx === 0 ? 'side' : 'detail'
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
        altText: `${product.name} - Alternate View`,
        viewType: 'side'
      });
    }

    // 4. Product-specific Video
    if (product.video_url && typeof product.video_url === 'string' && product.video_url.trim().length > 0) {
      list.push({
        id: `${product.id}-video`,
        type: 'video',
        url: product.video_url,
        label: 'Video Showcase',
        altText: `${product.name} - HD Commercial Film`,
        viewType: 'video'
      });
    }

    // 5. Interactive 360° Studio
    if (product.has_360 || (product.view_360_urls && product.view_360_urls.length > 0)) {
      list.push({
        id: `${product.id}-360`,
        type: '360',
        url: primaryImg,
        label: '360° Studio',
        altText: `${product.name} - Interactive 360° Spin`,
        viewType: '360'
      });
    }

    return list;
  }, [product, primaryImg, selectedVariant, variantLacksImages]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Active media item with fallback
  const activeMedia = mediaList[activeMediaIndex] || mediaList[0] || {
    id: 'fallback',
    type: 'image',
    url: primaryImg,
    label: 'Main View',
    altText: product.name,
    viewType: 'front'
  };

  // Image loading state for smooth skeleton shimmer
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

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

  // Reset active media when product or variant changes
  useEffect(() => {
    setActiveMediaIndex(0);
    setIsZoomed(false);
    setMobileScale(1);
    setIsImageLoading(true);
  }, [product.id, selectedVariant?.id, selectedVariant?.color]);

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
      } else if (mobileScale === 1 && touchStartX.current !== null && mediaList.length > 1) {
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
    if (mediaList.length <= 1) return;
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
    setIsZoomed(false);
    setIsImageLoading(true);
  }, [mediaList.length]);

  const navigatePrev = useCallback(() => {
    if (mediaList.length <= 1) return;
    setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    setIsZoomed(false);
    setIsImageLoading(true);
  }, [mediaList.length]);

  // Handle Share Product Action
  const handleShareClick = () => {
    if (onShare) {
      onShare();
      return;
    }

    const currentUrl = window.location.href;
    const shareTitle = `${product.name} ${selectedVariant ? `(${selectedVariant.color})` : ''} — YAZHINI FINE JEWELS`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: `Explore this handcrafted luxury piece: ${product.name}`,
        url: currentUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopiedShare(true);
      toast.success('Product image and details link copied to clipboard!');
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

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

  // If a variant is selected but has no images, render the authentic unavailable state
  if (variantLacksImages) {
    return (
      <div className="p-8 sm:p-12 text-center bg-[#FAF7F1] dark:bg-[#1C1216] border border-[#E7DEC8] dark:border-[#3E2D34] rounded-3xl shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-[#C49A50] mx-auto" />
        <h3 className="font-serif text-lg sm:text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
          Images Currently Unavailable for {selectedVariant?.color}
        </h3>
        <p className="text-xs text-[#716A6C] dark:text-[#B5ABB0] max-w-md mx-auto leading-relaxed">
          High-definition photography and 360° assets for the <strong>{selectedVariant?.color}</strong> finish are currently being photographed in our atelier. Please switch to another available finish or book a live virtual video consultation to view this finish in person.
        </p>
        {onOpenVideoConsultModal && (
          <button
            type="button"
            onClick={onOpenVideoConsultModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B1022] hover:bg-[#7A1930] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Video className="w-4 h-4 text-[#C49A50]" />
            <span>Request Live Atelier Video</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 items-start select-none">
      {/* 1. Desktop Vertical Left Thumbnail Strip / Mobile Horizontal Carousel */}
      <div 
        className="w-full lg:w-20 xl:w-24 shrink-0 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto max-h-[620px] pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700"
        aria-label="Product thumbnail gallery"
      >
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
              onMouseEnter={() => {
                // Pre-switch on hover on desktop for instant Amazon-style feel
                setActiveMediaIndex(idx);
                setIsZoomed(false);
              }}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 lg:w-full lg:h-24 rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-[#FAF7F1] to-white dark:from-[#1A1215] dark:to-[#120B0E] transition-all shrink-0 cursor-pointer flex flex-col items-center justify-center group ${
                isSelected
                  ? 'border-[#5B1022] dark:border-[#C49A50] ring-2 ring-[#C49A50]/40 scale-102 shadow-md'
                  : 'border-[#E7DEC8] dark:border-[#3E2D34] opacity-80 hover:opacity-100 hover:border-[#C49A50]/60'
              }`}
              title={item.altText}
              aria-label={`View ${item.label}`}
              aria-current={isSelected ? 'true' : 'false'}
            >
              {item.type === 'image' && (
                <img
                  src={item.url}
                  alt={item.altText}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to avoid broken image icon
                    (e.target as HTMLImageElement).src = fallback;
                  }}
                />
              )}

              {/* Video Thumbnail with Circular Play Badge (matching reference) */}
              {item.type === 'video' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#5B1022]/15 dark:bg-[#C49A50]/20 rounded-xl text-[#5B1022] dark:text-[#C49A50] relative">
                  <div className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center shadow-md">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <span className="text-[8.5px] font-bold mt-1 text-[#5B1022] dark:text-[#C49A50]">Video</span>
                </div>
              )}

              {/* 360 Thumbnail with Rotate Badge */}
              {item.type === '360' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#C49A50]/15 rounded-xl text-[#C49A50] relative">
                  <div className="w-7 h-7 rounded-full bg-[#5B1022] text-[#C49A50] flex items-center justify-center shadow-md">
                    <Rotate3d className="w-4 h-4" />
                  </div>
                  <span className="text-[8.5px] font-bold mt-1 text-[#5B1022] dark:text-[#C49A50]">360° Spin</span>
                </div>
              )}

              {/* Thumbnail Label Indicator on hover */}
              <span className="absolute bottom-0 inset-x-0 bg-[#252329]/85 text-[8px] text-white py-0.5 text-center font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Live Video Consultation Action Card */}
        {onOpenVideoConsultModal && (
          <button
            type="button"
            onClick={onOpenVideoConsultModal}
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-full lg:h-20 rounded-2xl border-2 border-dashed border-[#C49A50]/50 hover:border-[#5B1022] dark:hover:border-[#C49A50] bg-[#FAF7F1]/80 dark:bg-[#1A1215]/80 p-1.5 transition-all shrink-0 cursor-pointer flex flex-col items-center justify-center group text-center"
            title="Book a live 1-on-1 video call to view this piece in real-time"
          >
            <Video className="w-4 h-4 text-[#5B1022] dark:text-[#C49A50] group-hover:scale-110 transition-transform mb-1" />
            <span className="text-[8.5px] font-semibold text-[#5B1022] dark:text-[#C49A50] leading-tight">
              Live Video
            </span>
          </button>
        )}
      </div>

      {/* 2. Main Stage / Large Hero Viewport */}
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
        className={`flex-1 relative aspect-[4/5] bg-gradient-to-b from-[#FAF7F1] via-[#FAF6F0] to-[#F5EFE6] dark:from-[#1A1215] dark:via-[#160E11] dark:to-[#120B0E] rounded-3xl overflow-hidden border border-[#E7DEC8] dark:border-[#3E2D34] shadow-md group flex items-center justify-center w-full ${
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
              onError={(e) => {
                setIsImageLoading(false);
                (e.target as HTMLImageElement).src = fallback;
              }}
              onClick={() => setIsLightboxOpen(true)}
              initial={{ opacity: 0.85, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
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
                  <span>Interactive 360° Studio</span>
                </span>
                <span className="font-mono text-[10px] text-stone-300">
                  Drag left / right ({Math.round(rotationAngle)}°)
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous / Next On-Hover Navigation Arrows */}
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

        {/* Floating Top Left: BIS 916 Hallmark / Purity Badge */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5B1022]/95 dark:bg-[#28050E]/95 backdrop-blur-md border border-[#C49A50]/60 text-[#FAF7F1] text-[10px] font-sans font-semibold tracking-wider uppercase shadow-md pointer-events-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C49A50]" />
            <span>{selectedVariant?.metalPurity || product.purity || '22K BIS 916'}</span>
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

        {/* Floating Top Right: Share, Fullscreen & Wishlist Buttons (Matching Reference) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Share Button (Top Right as in Reference Screenshot) */}
          <button
            type="button"
            onClick={handleShareClick}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-[#252329]/90 hover:bg-white text-[#252329] dark:text-[#FAF7F1] border border-[#E7DEC8] dark:border-[#3E2D34] shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Share Product & Image"
            aria-label="Share product"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4 text-[#5B1022] dark:text-[#C49A50]" />
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-[#252329]/90 hover:bg-white text-[#252329] dark:text-[#FAF7F1] border border-[#E7DEC8] dark:border-[#3E2D34] shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="Open Fullscreen Gallery"
            aria-label="Fullscreen Gallery"
          >
            <Maximize2 className="w-4 h-4 text-[#5B1022] dark:text-[#C49A50]" />
          </button>

          {/* Wishlist Button */}
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

        {/* Floating Bottom Right: Image Counter (e.g. 1/6) */}
        {mediaList.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/90 border border-white/10">
              {activeMediaIndex + 1} / {mediaList.length}
            </span>
          </div>
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
                <h3 className="font-serif text-lg text-[#C49A50]">
                  {product.name} {selectedVariant ? `• ${selectedVariant.color}` : ''}
                </h3>
                <p className="text-xs text-stone-400">
                  View {activeMediaIndex + 1} of {mediaList.length} • {activeMedia.label}
                  {(selectedVariant?.sku || product.sku) && ` • SKU: ${selectedVariant?.sku || product.sku}`}
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
