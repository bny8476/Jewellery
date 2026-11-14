import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { FeaturedCollectionItem } from '../../data/landingCollections';

interface CollectionImageCardProps {
  item: FeaturedCollectionItem;
  className?: string;
  isLarge?: boolean;
}

export const CollectionImageCard: React.FC<CollectionImageCardProps> = ({
  item,
  className = '',
  isLarge = false,
}) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleNavigate = () => {
    navigate(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Explore ${item.title} collection: ${item.subtitle}`}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden bg-[#160D10] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A15B] select-none ${className}`}
    >
      {/* Background Image with subtle zoom */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Editorial Vignette & Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0608]/90 via-[#0E0608]/40 to-transparent transition-opacity duration-500 group-hover:opacity-95" />
        <div className="absolute inset-0 bg-black/15 transition-colors duration-500 group-hover:bg-black/25" />
      </div>

      {/* Top Tag / Badge */}
      {item.tag && (
        <div className="absolute top-5 left-5 z-10">
          <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur-md border border-white/15 text-[10px] font-sans font-medium tracking-[0.25em] text-[#E8D0A7] uppercase">
            {item.tag}
          </span>
        </div>
      )}

      {/* Corner Quick Action Icon */}
      <div className="absolute top-5 right-5 z-10 w-9 h-9 border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 transition-all duration-300 group-hover:border-[#C6A15B] group-hover:bg-[#C6A15B] group-hover:text-[#180309]">
        <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      {/* Card Content Footer */}
      <div className={`relative z-10 p-6 sm:p-8 flex flex-col justify-end h-full ${isLarge ? 'min-h-[440px] sm:min-h-[540px] lg:min-h-full' : 'min-h-[260px] sm:min-h-[290px]'}`}>
        <div className="transform transition-transform duration-500 ease-out group-hover:-translate-y-1">
          <span className="text-[10px] font-sans font-semibold tracking-[0.3em] text-[#C6A15B] uppercase block mb-1">
            COLLECTION
          </span>

          <h3 className={`font-serif tracking-tight text-white ${isLarge ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl'}`}>
            {item.title}
          </h3>

          <p className="font-sans text-xs sm:text-sm text-[#F5EBE1]/90 font-light italic mt-1 tracking-wide">
            {item.subtitle}
          </p>

          <p className={`font-sans text-xs text-white/70 font-light mt-2 line-clamp-2 max-w-md ${isLarge ? 'block' : 'hidden sm:block'}`}>
            {item.description}
          </p>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-[#C6A15B] uppercase">
            <span>EXPLORE</span>
            <span className="inline-block w-4 h-[1px] bg-[#C6A15B] transition-all duration-300 group-hover:w-8" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
