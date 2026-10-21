import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { JewelryItem } from '../../lib/supabase';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { getJewelryFallbackImage } from '../../utils/imageUtils';
import { diamondSpotlightVariants, velvetHoverProps } from '../../utils/motion';
import { formatCurrencyINR } from '../../utils/formatters';

export interface SignatureLuxuryCardProps {
  product?: JewelryItem;
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  secondaryImageUrl?: string;
  purity?: string;
  weight?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onQuickView?: (product: JewelryItem) => void;
  onAddToCart?: (product: JewelryItem, el?: HTMLElement) => void;
  onBuyNow?: (product: JewelryItem) => void;
  onPriceExplainerClick?: () => void;
  onClick?: () => void;
  className?: string;
  badgeText?: string;
}

export const SignatureLuxuryCard: React.FC<SignatureLuxuryCardProps> = (props) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCartWithAnimation } = useCart();
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Normalize product object whether passed as `product` prop or flat props
  const product: JewelryItem = props.product || {
    id: props.id || 'jewel-card',
    name: props.name || 'Fine Jewellery Creation',
    category: props.category || 'Jewellery',
    price: props.price || 0,
    image_url: props.imageUrl || '/images/cat_gold.jpg',
    secondary_image_url: props.secondaryImageUrl,
    purity: props.purity,
    weight: props.weight || 10,
    is_new: props.isNew,
    is_bestseller: props.isBestseller,
    description: '',
    metal_type: 'gold',
    wastage_percent: 12,
    created_at: '',
    updated_at: '',
  };

  const initialImg = product.image_url || getJewelryFallbackImage(product.category, product.metal_type);
  const [imgSrc, setImgSrc] = useState<string>(initialImg);

  useEffect(() => {
    setImgSrc(product.image_url || getJewelryFallbackImage(product.category, product.metal_type));
  }, [product.image_url, product.category, product.metal_type]);

  const inWishlist = props.isWishlisted !== undefined ? props.isWishlisted : isInWishlist(product.id);

  // Title formatting matching luxury jewellery maison: e.g. "DIAMOND SOLITAIRE RING"
  const getDisplayTitle = () => {
    if (product.metal_type && product.category) {
      const cat = product.category.replace(/s$/i, '').trim();
      return `${product.metal_type} ${cat}`.toUpperCase();
    }
    return (product.category || product.name || 'FINE JEWELLERY').toUpperCase();
  };

  // Navigates directly to the dedicated product details page
  const handleCardClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (props.onClick) {
      props.onClick();
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  // Opens the quick preview modal in place without navigating away
  const handleQuickView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (props.onQuickView) {
      props.onQuickView(product);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  // Adds to cart with the exact jewellery image flying to the shopping bag
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Capture the exact displayed product image element
    const sourceElement = imageRef.current || (e.currentTarget as HTMLElement);
    if (props.onAddToCart) {
      props.onAddToCart(product, sourceElement);
    } else {
      addToCartWithAnimation(
        product.id,
        product.weight,
        sourceElement,
        imgSrc,
        product.name
      );
    }
  };

  // Toggles wishlist without triggering card navigation
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.onToggleWishlist) {
      props.onToggleWishlist();
    } else {
      toggleWishlist(product.id);
    }
  };

  return (
    <motion.div
      variants={diamondSpotlightVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.10 }}
      {...velvetHoverProps}
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-500 rounded-2xl bg-white dark:bg-[#1A1215] border border-[#EAE5E6] dark:border-[#332026] hover:border-[#C6A15B]/70 dark:hover:border-[#D8B878]/70 shadow-xs hover:shadow-[0_16px_36px_-12px_rgba(69,8,23,0.12)] dark:hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.7)] ${props.className || ''}`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP IMAGE SHOWCASE: Edge-to-edge, Seamless Luxury Jewellery Presentation */}
      {/* ========================================================================= */}
      <div className="relative aspect-square w-full bg-[#FAF6F2] dark:bg-[#150D10] overflow-hidden">
        {/* Primary Jewellery Image: Edge-to-edge full bleed with smooth zoom on hover */}
        <img
          ref={imageRef}
          src={imgSrc}
          alt={product.name}
          onError={() => {
            const fallback = getJewelryFallbackImage(product.category, product.metal_type);
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out select-none ${
            product.secondary_image_url ? 'group-hover:opacity-0 transition-opacity duration-500' : ''
          }`}
          style={{
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
          }}
          loading="lazy"
        />

        {/* Secondary Angle Crossfade when available */}
        {product.secondary_image_url && (
          <img
            src={product.secondary_image_url}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
            style={{
              imageRendering: '-webkit-optimize-contrast',
              backfaceVisibility: 'hidden',
            }}
            loading="lazy"
          />
        )}

        {/* Subtle Luxury Sheen Effect */}
        <div className="sheen-sweep" />

        {/* Soft Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top-Right Discreet Wishlist Button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border cursor-pointer ${
              inWishlist
                ? 'bg-[#450817] text-[#C6A15B] border-[#450817] dark:bg-[#D8B878] dark:text-[#120D0F] dark:border-[#D8B878] scale-105'
                : 'bg-white/90 dark:bg-[#1A1215]/90 text-stone-700 dark:text-stone-200 border-white/80 dark:border-white/10 hover:bg-white hover:text-[#450817] dark:hover:text-[#D8B878] hover:scale-105 active:scale-95'
            }`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 transition-transform duration-200 ${inWishlist ? 'fill-current scale-110' : 'stroke-[1.8]'}`} />
          </button>
        </div>

        {/* Discreet Quick Action Controls on Bottom of Image */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
          <button
            type="button"
            onClick={handleQuickView}
            className="flex-1 py-2 px-3 rounded-xl bg-white/95 dark:bg-[#20171A]/95 text-[#241B1D] dark:text-[#F8F3F4] hover:text-[#450817] dark:hover:text-[#D8B878] border border-[#EAE5E6] dark:border-[#46343A] text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#C6A15B] dark:text-[#D8B878]" />
            <span>Quick View</span>
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="py-2 px-3.5 rounded-xl bg-[#450817] hover:bg-[#6A1B2B] dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] text-[11px] font-semibold shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRODUCT DETAILS: Editorial Typography & Precise Alignment               */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 relative bg-white dark:bg-[#1A1215]">
        {/* Subtle Gold Accent Bar on Hover */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#C6A15B]/60 dark:via-[#D8B878]/70 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-center" />

        <div>
          {/* Category / Hallmark Line */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-sans font-semibold tracking-[0.18em] text-[#C6A15B] dark:text-[#D8B878] uppercase truncate">
              {product.purity || (product.metal_type ? `${product.metal_type} • 916 BIS` : product.category)}
            </span>
            {product.weight ? (
              <span className="text-[10px] font-sans font-medium text-[#777174] dark:text-[#C1B4B8] shrink-0">
                {product.weight}{product.metal_type === 'diamond' ? 'ct' : 'g'}
              </span>
            ) : null}
          </div>

          {/* Product Name */}
          <h4
            title={product.name}
            onClick={handleCardClick}
            className="font-serif text-[14.5px] sm:text-[15.5px] font-medium text-[#241B1D] dark:text-[#F8F3F4] line-clamp-1 group-hover:text-[#450817] dark:group-hover:text-[#D8B878] transition-colors leading-snug cursor-pointer"
          >
            {getDisplayTitle()}
          </h4>
        </div>

        {/* Price and Mobile Add-to-Bag Action Row */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#EAE5E6] dark:border-[#332026]">
          <div className="price-product font-bold text-base sm:text-[17px] text-[#450817] dark:text-[#D8B878] leading-none tracking-tight">
            {formatCurrencyINR(product.price)}
          </div>

          {/* Add to Bag Action Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-[#FAF9F8] dark:bg-[#251B1F] hover:bg-[#450817] hover:text-white dark:hover:bg-[#D8B878] dark:hover:text-[#120D0F] text-[#450817] dark:text-[#D8B878] border border-[#EAE5E6] dark:border-[#3D2830] hover:border-transparent flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            aria-label={`Add ${product.name} to bag`}
            title="Add to Bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
