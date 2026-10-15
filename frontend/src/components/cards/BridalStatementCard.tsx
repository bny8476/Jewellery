import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export interface BridalStatementCardProps {
  title?: string;
  region: string;
  tagline?: string;
  tradition?: string;
  description: string;
  image?: string;
  imageUrl?: string;
  tag?: string;
  piecesCount?: string;
  onExplore: () => void;
  className?: string;
  delay?: number;
}

export const BridalStatementCard: React.FC<BridalStatementCardProps> = ({
  title,
  region,
  tagline,
  tradition,
  description,
  image,
  imageUrl,
  tag,
  piecesCount = 'Exclusive Trousseau',
  onExplore,
  className = '',
  delay = 0,
}) => {
  const displayImage = image || imageUrl || '/images/hero_bride_aurelle.jpg';
  const displayTitle = title || tradition || region;
  const displayTag = tag || tagline || 'Royal Bridal Suite';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onExplore}
      className={`group relative aspect-[3/4] sm:aspect-[4/5] bg-[#1F0A12] overflow-hidden rounded-none border border-[#C69A8B]/30 shadow-md hover:shadow-[0_20px_45px_-10px_rgba(112,38,56,0.22)] cursor-pointer transition-all duration-400 ${className}`}
    >
      {/* Cinematic Bridal Image */}
      <img
        src={displayImage}
        alt={displayTitle}
        className="w-full h-full object-cover object-top group-hover:scale-[1.05] transition-transform duration-1000 ease-out filter brightness-[0.92] contrast-[1.03]"
        loading="lazy"
      />

      {/* Atmospheric Vignette & Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A040C]/95 via-[#1A040C]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent pointer-events-none" />

      {/* Top Region Label */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <span className="px-3 py-1 bg-[#702638]/90 backdrop-blur-md text-[9.5px] font-sans font-bold uppercase tracking-[0.22em] text-[#FAF5F0] border border-[#C69A8B]/30 shadow-sm">
          {region}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <span className="text-[10px] text-[#C69A8B] font-mono tracking-wider">
          {piecesCount}
        </span>
      </div>

      {/* Bottom Editorial Narrative */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-10 flex flex-col justify-end">
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#C69A8B] block mb-1">
          {displayTag}
        </span>

        <h3 className="font-serif text-lg sm:text-xl font-normal text-[#FAF5F0] leading-snug group-hover:text-[#E8A598] transition-colors">
          {displayTitle}
        </h3>

        <p className="text-xs text-[#FAF5F0]/80 font-light mt-1.5 line-clamp-2 leading-relaxed">
          {description}
        </p>

        <div className="pt-3 mt-3 border-t border-[#C69A8B]/25 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium tracking-wide text-[#FAF5F0]/70 group-hover:text-white transition-colors">
            Explore Trousseau
          </span>
          <span className="w-7 h-7 rounded-full bg-[#C69A8B]/20 flex items-center justify-center text-[#FAF5F0] group-hover:bg-[#C69A8B] group-hover:text-[#34252A] transition-all duration-300 group-hover:translate-x-1">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
