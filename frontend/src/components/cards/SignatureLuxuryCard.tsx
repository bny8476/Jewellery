import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight, Eye, ShoppingBag } from 'lucide-react';
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
  onAddToCart?: (product: JewelryItem) => void;
  onBuyNow?: (product: JewelryItem) => void;
  onPriceExplainerClick?: () => void;
  onClick?: () => void;
  className?: string;
  badgeText?: string;
}

export const SignatureLuxuryCard: React.FC<SignatureLuxuryCardProps> = (props) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

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

  // Title formatting matching luxury catalogue: e.g. "DIAMOND NECKLACE", "GOLD EARRINGS"
  const getDisplayTitle = () => {
    if (product.metal_type && product.category) {
      const cat = product.category.replace(/s$/i, '').trim();
      return `${product.metal_type} ${cat}`.toUpperCase();
    }
    return (product.category || product.name || 'FINE JEWELLERY').toUpperCase();
  };

  // Navigates directly to the dedicated product details page for this specific product ID
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

  // Adds to cart without triggering card navigation
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.onAddToCart) {
      props.onAddToCart(product);
    } else {
      addToCart(product.id, product.weight);
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
      viewport={{ once: true, amount: 0.12 }}
      {...velvetHoverProps}
      onClick={handleCardClick}
      className={`group relative bg-white dark:bg-[#1E1B1D] rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-[#B38054]/70 dark:hover:border-[#E8A598]/70 shadow-sm hover:shadow-[0_22px_45px_-12px_rgba(112,38,56,0.14)] dark:hover:shadow-[0_22px_45px_-12px_rgba(0,0,0,0.7)] flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 ${props.className || ''}`}
    >
      {/* Top Image Showcase: Compact square aspect ratio & prominent jewellery framing */}
      <div className="relative aspect-square bg-[#F7F4F0] dark:bg-[#150F13] overflow-hidden sheen-container">
        {/* Primary Jewellery Image with focused macro zoom for maximum jewellery visibility */}
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => {
            const fallback = getJewelryFallbackImage(product.category, product.metal_type);
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
          className={`w-full h-full object-cover object-center scale-[1.06] group-hover:scale-112 transition-transform duration-700 ease-out ${
            product.secondary_image_url ? 'group-hover:opacity-0 transition-opacity duration-500' : ''
          }`}
          loading="lazy"
        />

        {/* E. Editorial Image Crossfade: Secondary Angle when available */}
        {product.secondary_image_url && (
          <img
            src={product.secondary_image_url}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 scale-[1.06] group-hover:scale-112 transition-all duration-700 ease-out"
            loading="lazy"
          />
        )}

        {/* Diamond Spotlight Sheen: Restrained light reflection sweeping across image */}
        <div className="sheen-sweep" />

        {/* Soft Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top-Right Wishlist Button */}
        <div className="absolute top-3.5 right-3.5 z-10">
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs backdrop-blur-md border ${
              inWishlist
                ? 'bg-[#702638] text-white border-[#702638] scale-105'
                : 'bg-white/90 dark:bg-black/70 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-700/80 hover:bg-white hover:text-[#702638] hover:scale-105'
            }`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-4 h-4 transition-transform duration-200 ${inWishlist ? 'fill-current text-white scale-110' : 'stroke-[1.6]'}`} />
          </button>
        </div>

        {/* H. Floating Quick Action Controls on Bottom of Image */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
          <button
            type="button"
            onClick={handleQuickView}
            className="flex-1 py-2 px-3 rounded-xl bg-white/95 dark:bg-[#1B1116]/95 backdrop-blur-md text-[#24171C] dark:text-[#FAF5F0] hover:text-[#702638] dark:hover:text-[#E8A598] border border-stone-200/80 dark:border-stone-700/80 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="p-2 rounded-xl bg-[#702638] hover:bg-[#852C3E] text-white shadow-md transition-all hover:scale-105"
            aria-label="Add to bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Content Area with Champagne Accent Line */}
      <div className="p-4 sm:p-5 flex items-center justify-between bg-white dark:bg-[#1E1B1D] border-t border-stone-100 dark:border-stone-800/80 relative">
        {/* Subtle Champagne underline indicator */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#B38054]/50 dark:via-[#C69A8B]/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-center" />

        <div className="min-w-0 pr-3">
          <span className="text-[10px] sm:text-[10.5px] font-sans font-semibold tracking-[0.2em] text-[#8C5D3B] dark:text-[#C69A8B] uppercase block mb-0.5 truncate">
            {product.category || 'Fine Jewellery'}
          </span>
          <h4
            title={product.name}
            onClick={handleCardClick}
            className="font-serif text-base sm:text-[17px] font-medium text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors leading-snug cursor-pointer"
          >
            {getDisplayTitle()}
          </h4>
          <div className="price-product text-lg sm:text-[19px] text-[#29231C] dark:text-[#FAF5F0] mt-0.5">
            {formatCurrencyINR(product.price)}
          </div>
        </div>

        {/* Circular Arrow Button: Navigates to Product Details */}
        <button
          type="button"
          onClick={handleCardClick}
          className="w-10 h-10 rounded-full border border-[#B38054]/60 dark:border-[#C69A8B]/60 flex items-center justify-center text-[#8C5D3B] dark:text-[#E8A598] group-hover:border-[#8C5D3B] group-hover:bg-[#8C5D3B] group-hover:text-white dark:group-hover:bg-[#C69A8B] dark:group-hover:text-[#1A0B12] transition-all duration-300 shrink-0 shadow-xs"
          aria-label={`View details for ${product.name}`}
        >
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.div>
  );
};

