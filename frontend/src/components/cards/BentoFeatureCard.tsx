import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { EASINGS } from '../../utils/motion';

export interface BentoFeatureCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoPosition?: string;
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
  videoUrl,
  videoPosition = 'object-center',
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
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.55, ease: EASINGS.velvet }}
      className={`group relative overflow-hidden rounded-2xl bg-[#1A0B12] text-white flex flex-col justify-end ${
        videoUrl ? 'p-5 sm:p-7' : 'p-6 sm:p-10'
      } border border-[#C69A8B]/30 hover:border-[#C69A8B]/75 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(112,38,56,0.28)] transition-all duration-400 ${className}`}
    >
      {/* Background Video or Image with Cinematic Zoom */}
      {videoUrl ? (
        <video
          src={videoUrl}
          poster={displayImage}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={(e) => {
            const p = e.currentTarget.play();
            if (p !== undefined) p.catch(() => {});
          }}
          className={`absolute inset-0 w-full h-full object-cover ${videoPosition} group-hover:scale-106 transition-transform duration-1000 ease-out filter brightness-100 contrast-[1.03]`}
        />
      ) : (
        <img
          src={displayImage}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-1000 ease-out filter brightness-[0.88] contrast-[1.05]"
          loading="lazy"
        />
      )}

      {/* Subtle Diamond Spotlight Sheen across Card */}
      <div className="sheen-sweep" />

      {/* Luxury Gradient Overlay - Ultra-light when video is present so jewellery is sparkling and in clear focus */}
      {videoUrl ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C050E]/95 via-[#1C050E]/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C050E]/70 via-transparent to-transparent pointer-events-none" />
        </>
      )}

      {/* Layered Depth Content Box */}
      <div className={`relative z-10 max-w-lg space-y-3 transition-transform duration-500 group-hover:-translate-y-1 ${
        videoUrl ? 'bg-black/40 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-white/10 shadow-2xl' : ''
      }`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-white/10 backdrop-blur-md border border-[#C69A8B]/40 text-[#E8A598] text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-transform duration-300 group-hover:scale-105">
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
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCtaClick}
            className="group/btn inline-flex items-center gap-2 px-6 py-3 rounded-none bg-white hover:bg-[#FAF5F0] text-[#5A1C2B] text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

