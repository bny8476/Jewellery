import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface BentoFeatureCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  ctaText?: string;
  onCtaClick: () => void;
  badge?: string;
  eyebrow?: string;
  className?: string;
}

export const BentoFeatureCard: React.FC<BentoFeatureCardProps> = ({
  title,
  subtitle,
  description,
  image,
  imageUrl,
  ctaText = 'Shop Collection',
  onCtaClick,
  badge,
  eyebrow,
  className = '',
}) => {
  const displayImage = image || imageUrl || '/images/luxury_necklace_hero.jpg';
  const displayBadge = badge || eyebrow || 'Featured Campaign';
  const displaySubtitle = subtitle || '';
  const displayDesc = description || subtitle || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden bg-[#2A0E18] text-white flex flex-col justify-end p-6 sm:p-10 border border-[#C69A8B]/30 shadow-lg ${className}`}
    >
      {/* Background Image with Cinematic Zoom */}
      <img
        src={displayImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out filter brightness-[0.88] contrast-[1.05]"
        loading="lazy"
      />

      {/* Luxury Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C050E]/95 via-[#1C050E]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1C050E]/70 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-lg space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-white/10 backdrop-blur-md border border-[#C69A8B]/40 text-[#E8A598] text-[10px] font-sans font-bold uppercase tracking-[0.2em]">
          <Sparkles className="w-3 h-3 text-[#E8A598]" />
          <span>{displayBadge}</span>
        </div>

        <div>
          {displaySubtitle && (
            <span className="text-xs uppercase tracking-[0.25em] text-[#C69A8B] block font-sans font-semibold mb-1">
              {displaySubtitle}
            </span>
          )}
          <h3 className="font-serif text-2xl sm:text-4xl text-[#FAF5F0] font-normal leading-tight">
            {title}
          </h3>
        </div>

        {displayDesc && (
          <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-md">
            {displayDesc}
          </p>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onCtaClick}
            className="group/btn inline-flex items-center gap-2 px-6 py-3 rounded-none bg-white hover:bg-[#FAF5F0] text-[#5A1C2B] text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl hover:translate-x-1"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
