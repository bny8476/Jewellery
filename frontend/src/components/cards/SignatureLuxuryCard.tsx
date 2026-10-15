import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingBag, Check } from 'lucide-react';
import { JewelryItem } from '../../lib/supabase';
import { formatCurrencyINR } from '../../utils/formatters';
import { useWishlist } from '../../context/WishlistContext';

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
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

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

  const inWishlist = props.isWishlisted !== undefined ? props.isWishlisted : isInWishlist(product.id);
  const displayBadge = props.badgeText || (product.is_new ? 'New Arrival' : product.is_bestseller ? 'Bestseller' : null);

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

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.onAddToCart) {
      props.onAddToCart(product);
      setAddedAnim(true);
      setTimeout(() => setAddedAnim(false), 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleQuickView}
      className={`group relative bg-[#FFFEFC] dark:bg-[#1C1217] border border-[#EADBDB]/80 dark:border-[#38232B] hover:border-[#702638]/50 dark:hover:border-[#E8A598]/40 shadow-sm hover:shadow-[0_16px_36px_-12px_rgba(112,38,56,0.14)] transition-all duration-400 flex flex-col justify-between cursor-pointer rounded-none overflow-hidden ${props.className || ''}`}
    >
      {/* Top Image Showcase */}
      <div className="relative aspect-[4/3] bg-[#FAF6F2] dark:bg-[#160E12] overflow-hidden">
        <img
          src={product.image_url || '/images/cat_gold.jpg'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {displayBadge && (
            <span className="px-2.5 py-0.5 text-[9.5px] font-sans font-bold uppercase tracking-widest bg-[#702638] text-white shadow-sm">
              {displayBadge}
            </span>
          )}
          {product.purity && (
            <span className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-wider bg-white/90 dark:bg-black/80 text-[#702638] dark:text-[#E8A598] border border-[#702638]/20 backdrop-blur-sm">
              {product.purity}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 shadow-sm backdrop-blur-md ${
            inWishlist
              ? 'bg-[#702638] text-white scale-105'
              : 'bg-white/85 dark:bg-black/60 text-[#702638] dark:text-[#FAF5F0] hover:bg-white hover:scale-110'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 transition-transform ${inWishlist ? 'fill-current scale-110' : ''}`} />
        </button>

        {/* Quick View Hover Strip */}
        <div
          className={`absolute inset-x-3 bottom-3 flex items-center gap-2 transition-all duration-300 transform z-10 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handleQuickView}
            className="flex-1 py-2 bg-white/95 dark:bg-black/90 hover:bg-[#702638] hover:text-white text-[#24171C] dark:text-[#FAF5F0] text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md border border-[#EADBDB] dark:border-[#38232B]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          {props.onAddToCart && (
            <button
              type="button"
              onClick={handleAdd}
              className={`p-2 transition-all duration-200 shadow-md border ${
                addedAnim
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-[#5A1C2B] hover:bg-[#702638] text-white border-[#5A1C2B]'
              }`}
              title="Add to shopping bag"
              aria-label="Add to bag"
            >
              {addedAnim ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10.5px] uppercase tracking-widest text-[#852C3E] dark:text-[#E8A598] font-bold mb-1">
            <span>{product.category || 'Fine Jewellery'}</span>
            {product.weight && <span className="font-mono text-[10px] text-stone-500">{product.weight}g net</span>}
          </div>

          <h3 className="font-serif text-base sm:text-lg font-normal text-[#24171C] dark:text-[#FAF5F0] line-clamp-1 group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed font-light">
              {product.description}
            </p>
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-[#EADBDB]/50 dark:border-[#38232B] flex items-baseline justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-sans">Verified Price</span>
            <span className="font-serif text-lg sm:text-xl font-bold text-[#702638] dark:text-[#E8A598]">
              {formatCurrencyINR(product.price)}
            </span>
          </div>

          <span className="text-[11px] font-semibold text-[#852C3E] dark:text-[#E8A598] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
            Details →
          </span>
        </div>
      </div>
    </motion.div>
  );
};
