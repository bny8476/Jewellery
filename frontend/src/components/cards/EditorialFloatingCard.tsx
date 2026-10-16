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
  const editorialTag = props.editorialTag || 'Solitaire Masterpiece';

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
      className={`group relative bg-[#FFFEFC] dark:bg-[#1B1116] border border-[#EADBDB]/70 dark:border-[#38232B] hover:border-[#B38054]/70 dark:hover:border-[#C69A8B]/70 shadow-sm hover:shadow-[0_24px_50px_-12px_rgba(112,38,56,0.18)] dark:hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-400 cursor-pointer overflow-hidden flex flex-col justify-between ${props.className || ''}`}
    >
      {/* High-Resolution Hero Visual with Sheen & Macro Zoom */}
      <div className="relative aspect-[3/4] bg-[#FAF5F0] dark:bg-[#150D11] overflow-hidden sheen-container">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => {
            const fallback = getJewelryFallbackImage(product.category, product.metal_type);
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
            }
          }}
          className={`w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out ${
            product.secondary_image_url ? 'group-hover:opacity-0 transition-opacity duration-500' : ''
          }`}
          loading="lazy"
        />

        {product.secondary_image_url && (
          <img
            src={product.secondary_image_url}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-106 transition-all duration-700 ease-out"
            loading="lazy"
          />
        )}

        {/* Diamond Spotlight Sheen */}
        <div className="sheen-sweep" />

        {/* Minimal Editorial Pill */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <span className="px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-md text-[9.5px] font-sans font-bold uppercase tracking-[0.2em] text-[#702638] dark:text-[#E8A598] border border-[#702638]/20 shadow-sm transition-transform duration-300 group-hover:scale-105">
            {editorialTag}
          </span>
        </div>

        {/* Floating Quick Action Controls with smooth slide-up */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all duration-300 ${
              inWishlist
                ? 'bg-[#702638] text-white scale-105'
                : 'bg-white/85 dark:bg-black/70 text-[#702638] dark:text-[#FAF5F0] hover:bg-white hover:scale-110'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleQuickView}
            className="w-9 h-9 rounded-full bg-white/85 dark:bg-black/70 hover:bg-[#702638] hover:text-white text-[#24171C] dark:text-[#FAF5F0] flex items-center justify-center backdrop-blur-md shadow-md transition-all duration-300 hover:scale-110"
            aria-label="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Subtle Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

        <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#E8A598] block mb-0.5 number-supporting">
            {product.purity || 'Certified Fine Solitaire'}
          </span>
          <p className="price-featured text-xl sm:text-2xl text-white drop-shadow-sm">
            {formatCurrencyINR(product.price)}
          </p>
        </div>
      </div>

      {/* Editorial Title & Narrative with Champagne Accent */}
      <div className="p-5 flex-1 flex flex-col justify-between relative">
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#702638]/40 dark:via-[#C69A8B]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-center" />

        <div>
          <h4
            onClick={handleCardClick}
            className="font-serif text-lg text-[#24171C] dark:text-[#FAF5F0] font-normal leading-snug group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors cursor-pointer"
          >
            {product.name}
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
            {product.description || 'Handcrafted with master pavé settings, laser IGI certified diamonds, and hallmarked luxury.'}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-[#EADBDB]/50 dark:border-[#38232B] flex items-center justify-between text-xs">
          <span className="text-[11px] text-stone-500 font-sans tracking-wide">
            {product.category}
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

