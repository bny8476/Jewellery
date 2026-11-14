import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Gift } from 'lucide-react';
import { divineCollectionData } from '../../data/landingCollections';

// Traditional Indian Sacred Lotus Motif
const LotusIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 4c-1.5 3-2 6-2 9 0 4 2 7 2 7s2-3 2-7c0-3-.5-6-2-9z" />
    <path d="M12 20c-3-1-6-3-7-6-1-3 1-6 3-7 1 3 3 5 4 13z" />
    <path d="M12 20c3-1 6-3 7-6 1-3-1-6-3-7-1 3-3 5-4 13z" />
  </svg>
);

export const DivineCollectionSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const data = divineCollectionData;

  return (
    <section
      id="sacred-divine-collection"
      className="relative min-h-[85vh] lg:min-h-[92vh] bg-[#16060E] text-[#FAF5F0] overflow-hidden flex items-center border-b border-[#3D1420] scroll-mt-28 sm:scroll-mt-32"
    >
      {/* --------------------------------------------------------------------- */}
      {/* BACKGROUND: 16:9 Cinematic Luxury Hero Photography                     */}
      {/* --------------------------------------------------------------------- */}
      <div className="absolute inset-0 z-0">
        <img
          src={data.image}
          alt={data.imageAlt}
          loading="lazy"
          className="w-full h-full object-cover object-center lg:object-[left_center] transition-transform duration-1000 ease-out"
        />

        {/* Cinematic Atmospheric Vignettes & Depth Blends */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-[#16060E]/85 lg:to-[#16060E]/95 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16060E] via-transparent to-black/35 pointer-events-none" />
        {/* Warm Golden Bokeh Aura */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(217,174,112,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none" />
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* LEFT-SIDE LUXURY BADGE: 100% Pure Gold                                 */}
      {/* --------------------------------------------------------------------- */}
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85, y: 16 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute bottom-6 sm:bottom-12 left-6 sm:left-12 lg:left-16 z-20"
      >
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#380716]/95 backdrop-blur-md border border-[#D9AE70]/80 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center p-2 group hover:scale-105 transition-transform duration-300">
          {/* Subtle Outer Dashed Ring */}
          <div className="absolute inset-1 rounded-full border border-dashed border-[#D9AE70]/40 pointer-events-none" />
          
          {/* Diamond Icon */}
          <svg
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#D9AE70] mb-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
            <path d="M2 10h20" />
            <path d="M12 21L8 10l4-7 4 7-4 11z" />
          </svg>

          {/* Badge Text */}
          <span className="font-serif text-base sm:text-lg font-bold text-[#FAF0E6] leading-none tracking-tight">
            100%
          </span>
          <span className="font-sans text-[8px] sm:text-[9.5px] font-semibold text-[#D9AE70] uppercase tracking-[0.2em] mt-0.5">
            Pure Gold
          </span>
        </div>
      </motion.div>

      {/* --------------------------------------------------------------------- */}
      {/* SECTION CONTENT: Responsive Grid with Right-Aligned Luxury Card       */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center justify-end">
          
          {/* Left Column Spacer for dominant Ganesha hero product visibility */}
          <div className="lg:col-span-6 xl:col-span-7 hidden lg:block" />

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Luxury Product Information Card (~40-45%)           */}
          {/* ----------------------------------------------------------------- */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 30 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 xl:col-span-5"
          >
            <div className="relative rounded-3xl bg-gradient-to-b from-[#3D0A18]/92 via-[#26050F]/95 to-[#1F040C]/98 backdrop-blur-xl border border-[#D9AE70]/60 p-6 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(217,174,112,0.12)] text-[#FAF5F0]">
              
              {/* Card Top: Lotus Icon + Eyebrow */}
              <div className="flex items-center gap-2 mb-2">
                <LotusIcon className="w-4 h-4 text-[#D9AE70]" />
                <span className="text-[10.5px] sm:text-xs font-sans font-semibold tracking-[0.25em] text-[#D9AE70] uppercase">
                  {data.eyebrow}
                </span>
              </div>

              {/* Main Headline */}
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-[#FAF0E6] font-normal tracking-tight leading-tight">
                {data.title}
              </h2>

              {/* Subtitle */}
              {data.subtitle && (
                <p className="font-serif italic text-sm sm:text-base text-[#D9AE70] mt-1 font-normal tracking-wide">
                  {data.subtitle}
                </p>
              )}

              {/* Gold Divider with Central Lotus Motif */}
              <div className="flex items-center gap-3 my-4 sm:my-5 text-[#D9AE70]/70">
                <span className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#D9AE70]/60 to-[#D9AE70]" />
                <LotusIcon className="w-3.5 h-3.5 text-[#D9AE70]" />
                <span className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#D9AE70]/60 to-[#D9AE70]" />
              </div>

              {/* Description */}
              <p className="font-sans text-xs sm:text-[13px] text-[#E8D9C6]/85 font-light leading-relaxed mb-6">
                {data.description}
              </p>

              {/* 3 Evenly Spaced Feature Columns */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#D9AE70]/25 text-center">
                {/* Feature 1: Timeless Craftsmanship */}
                <div className="flex flex-col items-center border-r border-[#D9AE70]/20 pr-1">
                  <LotusIcon className="w-4 h-4 text-[#D9AE70] mb-1.5" />
                  <span className="font-sans text-[11px] sm:text-xs font-semibold text-white leading-tight">
                    Timeless
                  </span>
                  <span className="font-sans text-[10px] text-[#E8D9C6]/75 font-light leading-tight">
                    Craftsmanship
                  </span>
                </div>

                {/* Feature 2: Purity Assured */}
                <div className="flex flex-col items-center border-r border-[#D9AE70]/20 px-1">
                  <ShieldCheck className="w-4 h-4 text-[#D9AE70] mb-1.5 stroke-[1.6]" />
                  <span className="font-sans text-[11px] sm:text-xs font-semibold text-white leading-tight">
                    Purity
                  </span>
                  <span className="font-sans text-[10px] text-[#E8D9C6]/75 font-light leading-tight">
                    Assured
                  </span>
                </div>

                {/* Feature 3: Perfect For Gifting */}
                <div className="flex flex-col items-center pl-1">
                  <Gift className="w-4 h-4 text-[#D9AE70] mb-1.5 stroke-[1.6]" />
                  <span className="font-sans text-[11px] sm:text-xs font-semibold text-white leading-tight">
                    Perfect
                  </span>
                  <span className="font-sans text-[10px] text-[#E8D9C6]/75 font-light leading-tight">
                    For Gifting
                  </span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default DivineCollectionSection;
