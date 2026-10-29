import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export interface BridalStatementCardProps {
  title?: string;
  region: string;
  tagline?: string;
  tradition?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  tag?: string;
  onExplore: () => void;
  className?: string;
  delay?: number;
}

export const BridalStatementCard: React.FC<BridalStatementCardProps> = ({
  title,
  region,
  tradition,
  image,
  imageUrl,
  onExplore,
  className = '',
  delay = 0,
}) => {
  const displayImage = image || imageUrl || '/images/hero_bride_aurelle.jpg';
  const displayTitle = title || tradition || 'Bridal Collection';
  const displayRegion = region.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onExplore}
      className={`group relative aspect-[1/1.55] sm:aspect-[1/1.6] bg-[#140308] overflow-hidden rounded-[18px] border border-[#C5A267]/40 hover:border-[#E5C388] shadow-[0_12px_32px_rgba(0,0,0,0.65)] hover:shadow-[0_20px_45px_rgba(197,162,103,0.22)] cursor-pointer transition-all duration-400 flex flex-col justify-end ${className}`}
    >
      {/* Background Image with Slow Smooth Zoom */}
      <img
        src={displayImage}
        alt={displayTitle}
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
        loading="lazy"
      />

      {/* Subtle Diamond Sheen Sweep across Card */}
      <div className="sheen-sweep" />

      {/* Subtle bottom gradient: only covers the lower 28% so the jewellery is 80%+ completely unobstructed and brightly illuminated */}
      <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-[#0E0205] via-[#0E0205]/75 to-transparent pointer-events-none" />

      {/* Minimal Elegant Content Padded at Bottom */}
      <div className="relative z-10 p-3.5 sm:p-4 flex flex-col justify-end">
        {/* Region Tag */}
        <span className="text-[9.5px] sm:text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#D8B478] block">
          {displayRegion}
        </span>

        {/* Minimal Delicate Star Divider */}
        <div className="flex items-center gap-1.5 my-1.5 text-[#C5A267]/75">
          <div className="h-[1px] w-5 bg-gradient-to-r from-[#C5A267]/70 to-transparent" />
          <svg className="w-2.5 h-2.5 text-[#D8B478]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          </svg>
          <div className="h-[1px] w-8 bg-gradient-to-l from-[#C5A267]/70 to-transparent" />
        </div>

        {/* Title */}
        <h3 className="font-inter text-[14px] sm:text-[15px] font-normal text-[#FAF5F0] leading-snug group-hover:text-[#E5C388] transition-colors truncate">
          {displayTitle}
        </h3>

        {/* Bottom Action Row */}
        <div className="mt-2.5 pt-2 border-t border-[#C5A267]/15 flex items-center justify-between">
          <span className="text-[10.5px] font-sans text-[#E2D2CB]/90 font-medium group-hover:text-[#E5C388] transition-colors">
            Explore Trousseau
          </span>

          <div className="w-6 h-6 rounded-full border border-[#C5A267]/50 group-hover:border-[#E5C388] group-hover:bg-[#E5C388] group-hover:text-[#140308] text-[#E5C388] flex items-center justify-center transition-all duration-300 shadow-sm shrink-0">
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

