import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Heart, ArrowRight } from 'lucide-react';
import { JewelryItem } from '../../lib/supabase';
import { useWishlist } from '../../context/WishlistContext';
import { getJewelryFallbackImage } from '../../utils/imageUtils';

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
  const { isInWishlist, toggleWishlist } = useWishlist();

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

  // Dynamic Crown Badge text (PREMIUM / LUXURY / EXCLUSIVE)
  const badge = props.badgeText?.toUpperCase() || (
    product.is_new ? 'EXCLUSIVE' :
    product.is_bestseller ? 'LUXURY' :
    (product.price && product.price >= 200000) ? 'EXCLUSIVE' :
    (product.price && product.price >= 100000) ? 'LUXURY' :
    'PREMIUM'
  );

  // Title formatting matching luxury catalogue: e.g. "DIAMOND NECKLACE", "GOLD EARRINGS"
  const getDisplayTitle = () => {
    if (product.metal_type && product.category) {
      const cat = product.category.replace(/s$/i, '').trim();
      return `${product.metal_type} ${cat}`.toUpperCase();
    }
    return (product.category || product.name || 'FINE JEWELLERY').toUpperCase();
  };

  const handleQuickView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (props.onQuickView) {
      props.onQuickView(product);
    } else if (props.onClick) {
      props.onClick();
    }
  };

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
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleQuickView}
      className={`group relative bg-white dark:bg-[#1E1B1D] rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${props.className || ''}`}
    >
      {/* Top Image Showcase */}
      <div className="relative aspect-[4/5] bg-[#F7F4F0] dark:bg-[#150F13] overflow-hidden">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => {
            const fallback = getJewelryFallbackImage(product.category, product.metal_type);
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Soft Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top-Left Crown Badge */}
        <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#B38054]/50 dark:border-[#C69A8B]/60 bg-white/95 dark:bg-[#1A1A1A]/90 backdrop-blur-md shadow-xs">
            <Crown className="w-3 h-3 text-[#B38054] dark:text-[#E8A598]" />
            <span className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[#8C5D3B] dark:text-[#E8A598] uppercase">
              {badge}
            </span>
          </div>
        </div>

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
            <Heart className={`w-4 h-4 transition-transform ${inWishlist ? 'fill-current text-white' : 'stroke-[1.6]'}`} />
          </button>
        </div>
      </div>

      {/* Bottom Content Area */}
      <div className="p-4 sm:p-5 flex items-center justify-between bg-white dark:bg-[#1E1B1D] border-t border-stone-100 dark:border-stone-800/80">
        <div className="min-w-0 pr-3">
          <span
            title={product.name}
            className="text-[11px] sm:text-[11.5px] font-sans font-medium tracking-[0.18em] text-stone-500 dark:text-stone-400 uppercase line-clamp-1 block mb-1"
          >
            {getDisplayTitle()}
          </span>
          <div className="font-serif text-xl sm:text-2xl text-stone-900 dark:text-stone-100 font-normal tracking-tight">
            ₹ {Number(product.price || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Circular Arrow Button */}
        <button
          type="button"
          onClick={handleQuickView}
          className="w-10 h-10 rounded-full border border-[#B38054]/60 dark:border-[#C69A8B]/60 flex items-center justify-center text-[#8C5D3B] dark:text-[#E8A598] group-hover:border-[#8C5D3B] group-hover:bg-[#8C5D3B] group-hover:text-white dark:group-hover:bg-[#C69A8B] dark:group-hover:text-[#1A0B12] transition-all duration-300 shrink-0 shadow-xs"
          aria-label="View jewellery details"
        >
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.div>
  );
};
