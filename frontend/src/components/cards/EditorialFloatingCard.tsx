import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JewelryItem } from '../../lib/supabase';
import { formatCurrencyINR } from '../../utils/formatters';
import { useWishlist } from '../../context/WishlistContext';
import { getJewelryFallbackImage } from '../../utils/imageUtils';

export interface EditorialFloatingCardProps {
  product?: JewelryItem;
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  secondaryImageUrl?: string;
  description?: string;
  editorialTag?: string;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onQuickView?: (product: JewelryItem) => void;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

export const EditorialFloatingCard: React.FC<EditorialFloatingCardProps> = (props) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Normalize product object whether passed as `product` prop or flat props
  const product: JewelryItem = props.product || {
    id: props.id || 'editorial-card',
    name: props.name || 'Solitaire Fine Diamond Piece',
    category: props.category || 'Diamond Jewellery',
    price: props.price || 0,
    image_url: props.imageUrl || '/images/cat_diamond.jpg',
    secondary_image_url: props.secondaryImageUrl,
    description: props.description || 'Natural diamond precision crafted in 18K hallmarked white and rose gold.',
    metal_type: 'diamond',
    weight: 10,
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

  const handleCardClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (props.onClick) {
      props.onClick();
    } else if (product.id) {
      navigate(`/product/${product.id}`);
    }
  };

  const handleQuickView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (props.onQuickView) {
      props.onQuickView(product);
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -6, scale: 1.012 }}
      transition={{ duration: 0.5, delay: props.delay || 0, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleCardClick}
      className={`group relative bg-white dark:bg-[#1A1215] border border-[#EAE5E6] dark:border-[#332026] hover:border-[#C6A15B]/70 dark:hover:border-[#D8B878]/70 shadow-xs hover:shadow-[0_20px_44px_-12px_rgba(69,8,23,0.15)] dark:hover:shadow-[0_20px_44px_-12px_rgba(0,0,0,0.7)] transition-all duration-400 cursor-pointer overflow-hidden rounded-2xl flex flex-col justify-between ${props.className || ''}`}
    >
      {/* High-Resolution Hero Visual: Standardized 4:5 Container with Strict Contain Fit */}
      <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-[#FAF7F1] via-[#FAF6F0] to-[#F5EFE6] dark:from-[#170E12] dark:via-[#140C10] dark:to-[#0F080C] p-4 flex items-center justify-center overflow-hidden sheen-container border-b border-[#FAF0E6]/80 dark:border-[#2E1A22]/80">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => {
            const fallback = getJewelryFallbackImage(product.category, product.metal_type);
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
          className={`w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-700 ease-out select-none drop-shadow-sm ${
            product.secondary_image_url ? 'group-hover:opacity-0 transition-opacity duration-500' : ''
          }`}
          style={{
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
          }}
          loading="lazy"
        />

        {product.secondary_image_url && (
          <img
            src={product.secondary_image_url}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 w-full h-full object-contain object-center p-4 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out select-none drop-shadow-sm"
            style={{
              imageRendering: '-webkit-optimize-contrast',
              backfaceVisibility: 'hidden',
            }}
            loading="lazy"
          />
        )}

        {/* Diamond Spotlight Sheen */}
        <div className="sheen-sweep pointer-events-none" />

        {/* Soft Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Floating Quick Action Controls with smooth slide-up */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-xs border cursor-pointer transition-all duration-200 ${
              inWishlist
                ? 'bg-[#450817] text-[#C6A15B] border-[#450817] dark:bg-[#D8B878] dark:text-[#120D0F] dark:border-[#D8B878] scale-105'
                : 'bg-white/90 dark:bg-[#1A1215]/90 text-stone-700 dark:text-stone-200 border-white/80 dark:border-white/10 hover:bg-white hover:text-[#450817] dark:hover:text-[#D8B878] hover:scale-105 active:scale-95'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleQuickView}
            className="w-8 h-8 rounded-full bg-white/90 dark:bg-[#1A1215]/90 text-stone-700 dark:text-stone-200 border border-white/80 dark:border-white/10 hover:bg-[#450817] hover:text-[#C6A15B] dark:hover:bg-[#D8B878] dark:hover:text-[#120D0F] flex items-center justify-center backdrop-blur-md shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editorial Title & Narrative with Champagne Accent */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between relative bg-white dark:bg-[#1A1215]">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#702638]/40 dark:via-[#C69A8B]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-center" />

        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-sans tracking-wider uppercase text-stone-400 dark:text-stone-500 font-medium">
              {product.category}
            </span>
            <span className="price-product text-base sm:text-lg font-bold text-[#450817] dark:text-[#E8A598] tracking-tight">
              {formatCurrencyINR(product.price)}
            </span>
          </div>

          <h4
            onClick={handleCardClick}
            className="font-inter text-base text-[#24171C] dark:text-[#FAF5F0] font-normal leading-snug group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
            {product.description || 'Handcrafted with master pavé settings, laser IGI certified diamonds, and hallmarked luxury.'}
          </p>
        </div>

        <div className="pt-3.5 mt-3 border-t border-[#EADBDB]/50 dark:border-[#38232B] flex items-center justify-between text-xs">
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans tracking-wide">
            IGI Certified Diamond
          </span>
          <button
            type="button"
            onClick={handleCardClick}
            className="text-[11px] font-semibold text-[#852C3E] dark:text-[#E8A598] flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
          >
            <span>Explore Piece</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

