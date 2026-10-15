import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, ArrowUpRight } from 'lucide-react';
import { JewelryItem } from '../../lib/supabase';
import { formatCurrencyINR } from '../../utils/formatters';
import { useWishlist } from '../../context/WishlistContext';

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

  const inWishlist = props.isWishlisted !== undefined ? props.isWishlisted : isInWishlist(product.id);
  const editorialTag = props.editorialTag || 'Solitaire Masterpiece';

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
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, delay: props.delay || 0, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleQuickView}
      className={`group relative bg-[#FFFEFC] dark:bg-[#1B1116] border border-[#EADBDB]/70 dark:border-[#38232B] shadow-sm hover:shadow-[0_22px_45px_-12px_rgba(112,38,56,0.16)] transition-all duration-400 cursor-pointer overflow-hidden flex flex-col justify-between ${props.className || ''}`}
    >
      {/* High-Resolution Hero Visual */}
      <div className="relative aspect-[3/4] bg-[#FAF5F0] dark:bg-[#150D11] overflow-hidden">
        <img
          src={product.image_url || '/images/luxury_necklace_hero.jpg'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-[1.06] transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Minimal Editorial Pill */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <span className="px-3 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-md text-[9.5px] font-sans font-bold uppercase tracking-[0.2em] text-[#702638] dark:text-[#E8A598] border border-[#702638]/20 shadow-sm">
            {editorialTag}
          </span>
        </div>

        {/* Floating Quick Action Controls */}
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
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#E8A598] block mb-0.5">
            {product.purity || 'Certified Fine Solitaire'}
          </span>
          <p className="font-serif text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
            {formatCurrencyINR(product.price)}
          </p>
        </div>
      </div>

      {/* Editorial Title & Narrative */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-serif text-lg text-[#24171C] dark:text-[#FAF5F0] font-normal leading-snug group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
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
          <span className="text-[11px] font-semibold text-[#852C3E] dark:text-[#E8A598] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Explore Piece</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
