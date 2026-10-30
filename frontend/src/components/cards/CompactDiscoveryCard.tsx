import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrencyINR } from '../../utils/formatters';

export interface CompactDiscoveryCardProps {
  name: string;
  image?: string;
  imageUrl?: string;
  count?: string;
  category?: string;
  price?: number;
  badge?: string;
  onClick: () => void;
  className?: string;
  isSelected?: boolean;
}

export const CompactDiscoveryCard: React.FC<CompactDiscoveryCardProps> = ({
  name,
  image,
  imageUrl,
  count,
  category,
  price,
  badge,
  onClick,
  className = '',
  isSelected = false,
}) => {
  const displayImage = image || imageUrl || '/images/cat_gold.jpg';
  const displayCount = count || category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`group relative bg-[#FFFEFC] dark:bg-[#1E1217] border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-[0_16px_36px_-8px_rgba(112,38,56,0.16)] dark:hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.6)] rounded-none ${
        isSelected
          ? 'border-[#702638] dark:border-[#C69A8B] ring-1 ring-[#702638]/40'
          : 'border-[#EADBDB]/80 dark:border-[#38232B] hover:border-[#702638]/60 dark:hover:border-[#E8A598]/50'
      } ${className}`}
    >
      {/* Image Showcase with Sheen */}
      <div className="relative aspect-[4/5] bg-gradient-to-b from-[#FAF7F1] via-[#FAF6F0] to-[#F5EFE6] dark:from-[#170E12] dark:via-[#140C10] dark:to-[#0F080C] p-3 flex items-center justify-center overflow-hidden sheen-container border-b border-[#FAF0E6]/80 dark:border-[#2E1A22]/80">
        <img
          src={displayImage}
          alt={name}
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-600 ease-out select-none drop-shadow-sm"
          loading="lazy"
        />

        {/* Diamond Spotlight Sheen */}
        <div className="sheen-sweep pointer-events-none" />

        {badge && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="px-2 py-0.5 bg-[#702638] text-white text-[9px] font-sans font-bold uppercase tracking-wider shadow-sm transition-transform duration-300 group-hover:scale-105">
              {badge}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-3 text-center flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-inter text-sm font-semibold text-[#24171C] dark:text-[#FAF5F0] truncate group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
            {name}
          </h4>
          {displayCount && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate font-light">
              {displayCount}
            </p>
          )}
        </div>

        {price !== undefined && (
          <div className="mt-2 pt-2 border-t border-[#EADBDB]/40 dark:border-[#38232B] price-product font-bold text-xs text-[#702638] dark:text-[#E8A598] tracking-tight">
            {formatCurrencyINR(price)}
          </div>
        )}
      </div>
    </motion.div>
  );
};
