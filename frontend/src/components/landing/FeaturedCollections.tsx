import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { featuredCollections } from '../../data/landingCollections';

export const FeaturedCollections: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const layeredLuxe = featuredCollections.find((c) => c.id === 'layered-luxe') || featuredCollections[0];
  const ethnicGlow = featuredCollections.find((c) => c.id === 'ethnic-glow') || featuredCollections[1];
  const diamondWhisper = featuredCollections.find((c) => c.id === 'diamond-whisper') || featuredCollections[2];

  // Clipped-corner polygon formulas
  const leftCardClip = 'polygon(36px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 36px)';
  const rightCardClip = 'polygon(32px 0, 100% 0, 100% 100%, 0 100%, 0 32px)';

  return (
    <section
      id="collections"
      className="relative py-20 sm:py-28 bg-[#F8F4EE] dark:bg-[#140E11] overflow-hidden transition-colors duration-300 scroll-mt-28 sm:scroll-mt-32"
    >
      {/* Background Decorative Sweeping Concentric Arcs */}
      <div className="pointer-events-none absolute -top-48 -left-48 w-[640px] h-[640px] rounded-full border border-[#E8D9C6]/60 dark:border-[#38262E]/30" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full border border-[#E8D9C6]/40 dark:border-[#38262E]/20" />
      <div className="pointer-events-none absolute top-1/4 -right-56 w-[760px] h-[760px] rounded-full border border-[#E8D9C6]/50 dark:border-[#38262E]/25" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full border border-[#E8D9C6]/30 dark:border-[#38262E]/15" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* SECTION HEADER                                                            */}
        {/* ========================================================================= */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20"
        >
          {/* Eyebrow: ── EDITORIAL ✦ CURATION ── */}
          <div className="flex items-center justify-center gap-3.5 mb-3.5">
            <span className="w-12 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#C58B3C]" />
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] sm:text-xs font-sans font-semibold tracking-[0.3em] text-[#C58B3C] uppercase">
                EDITORIAL
              </span>
              <span className="text-[#C58B3C] text-xs">✦</span>
              <span className="text-[10.5px] sm:text-xs font-sans font-semibold tracking-[0.3em] text-[#C58B3C] uppercase">
                CURATION
              </span>
            </div>
            <span className="w-12 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#C58B3C]" />
          </div>

          {/* Main Heading: Featured Jewellery Collections */}
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] text-[#171411] dark:text-[#FAF5F0] font-normal tracking-tight leading-[1.12]">
            Featured Jewellery{' '}
            <span className="italic text-[#C58B3C] font-normal block sm:inline">
              Collections
            </span>
          </h2>

          {/* Supporting Description */}
          <p className="font-sans text-xs sm:text-[13.5px] text-[#5A4941] dark:text-[#C6B6BA] font-light leading-relaxed max-w-xl mx-auto mt-4">
            A selection of jewellery designs crafted with generational precision, certified natural diamonds, and pure hallmarked gold.
          </p>
        </motion.div>

        {/* ========================================================================= */}
        {/* ASYMMETRIC TWO-COLUMN EDITORIAL COMPOSITION                               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">
          
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT: LARGE FEATURED COLLECTION — LAYERED LUXE (~52% / 6.5 cols)        */}
          {/* ----------------------------------------------------------------------- */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 xl:col-span-6 relative flex flex-col"
          >
            {/* Overlapping Offset Gold Outline Frame */}
            <div
              className="absolute -bottom-2 -right-2 inset-0 border border-[#C58B3C]/50 pointer-events-none transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"
              style={{ clipPath: leftCardClip }}
            />

            {/* Main Interactive Clipped Card */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Explore Layered Luxe Collection"
              onClick={() => navigate(layeredLuxe.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(layeredLuxe.href);
                }
              }}
              style={{ clipPath: leftCardClip }}
              className="group relative flex-1 min-h-[460px] sm:min-h-[540px] lg:min-h-[580px] overflow-hidden bg-[#181115] cursor-pointer shadow-xl select-none flex flex-col justify-end p-6 sm:p-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58B3C]"
            >
              {/* Background Photography with Micro-Zoom */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={layeredLuxe.image}
                  alt={layeredLuxe.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-106"
                />

                {/* Dark Vignette Gradients for Impeccable Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#120B0E]/95 via-[#120B0E]/50 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-black/15 pointer-events-none" />
              </div>

              {/* Top-Left Clipped Chamfer Ribbon Label: EDITORIAL CURATION */}
              <div className="absolute top-0 left-0 z-20">
                <div
                  className="bg-gradient-to-r from-[#C58B3C] via-[#D9AC68] to-[#C58B3C] text-[#171411] font-sans font-bold text-[9px] sm:text-[10px] tracking-[0.22em] uppercase pl-10 pr-5 py-1.5 shadow-md"
                  style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}
                >
                  EDITORIAL CURATION
                </div>
              </div>

              {/* Lower Content */}
              <div className="relative z-10 max-w-lg transition-transform duration-500 ease-out group-hover:-translate-y-1">
                {/* Eyebrow: COLLECTION ─── */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10.5px] font-sans font-semibold tracking-[0.25em] text-[#D9AC68] uppercase">
                    COLLECTION
                  </span>
                  <span className="w-8 h-[1px] bg-[#C58B3C]/80" />
                </div>

                {/* Title */}
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-white font-normal tracking-tight leading-tight">
                  {layeredLuxe.title}
                </h3>

                {/* Subtitle / Quote */}
                <p className="font-serif italic text-sm sm:text-base text-[#E8D9C6] font-normal mt-1 tracking-wide">
                  &ldquo;{layeredLuxe.subtitle}&rdquo;
                </p>

                {/* Prose Description */}
                <p className="font-sans text-xs sm:text-[13px] text-stone-300 font-light leading-relaxed mt-2.5 mb-6 max-w-md">
                  {layeredLuxe.description}
                </p>

                {/* CTA with Circular Arrow */}
                <div className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-white uppercase group-hover:text-[#D9AC68] transition-colors">
                  <span>EXPLORE COLLECTION</span>
                  <span className="w-8 h-8 rounded-full border border-[#C58B3C] text-[#C58B3C] flex items-center justify-center transition-all duration-300 group-hover:bg-[#C58B3C] group-hover:text-[#171411] group-hover:scale-105 shadow-sm">
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT: TWO STACKED COLLECTIONS (~48% / 6 cols)                          */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-6 sm:gap-7 justify-between">
            
            {/* --------------------------------------------------------------------- */}
            {/* TOP RIGHT: ETHNIC GLOW                                                */}
            {/* --------------------------------------------------------------------- */}
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex-1"
            >
              {/* Overlapping Offset Gold Frame */}
              <div
                className="absolute -bottom-2 -right-2 inset-0 border border-[#C58B3C]/40 pointer-events-none transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"
                style={{ clipPath: rightCardClip }}
              />

              <div
                role="button"
                tabIndex={0}
                aria-label="Explore Ethnic Glow Collection"
                onClick={() => navigate(ethnicGlow.href)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(ethnicGlow.href);
                  }
                }}
                style={{ clipPath: rightCardClip }}
                className="group relative h-full min-h-[260px] sm:min-h-[275px] overflow-hidden bg-[#241510] cursor-pointer shadow-xl select-none p-6 sm:p-8 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58B3C]"
              >
                {/* Right Side Jewellery Photography */}
                <div className="absolute right-0 inset-y-0 w-[55%] sm:w-[50%] overflow-hidden">
                  <img
                    src={ethnicGlow.image}
                    alt={ethnicGlow.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-106"
                  />
                  {/* Seamless Horizontal Blend */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#241510] via-[#241510]/50 to-transparent pointer-events-none" />
                </div>

                {/* Left Side Editorial Content */}
                <div className="relative z-10 max-w-[62%] sm:max-w-[55%] transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-sans font-semibold tracking-[0.25em] text-[#D9AC68] uppercase">
                      COLLECTION
                    </span>
                    <span className="w-6 h-[1px] bg-[#C58B3C]/80" />
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-tight leading-snug">
                    {ethnicGlow.title}
                  </h3>

                  <p className="font-serif italic text-xs sm:text-sm text-[#E8D9C6] font-normal mt-0.5 tracking-wide">
                    &ldquo;{ethnicGlow.subtitle}&rdquo;
                  </p>

                  <p className="font-sans text-[11px] sm:text-xs text-stone-300 font-light leading-relaxed mt-2 mb-4 line-clamp-2">
                    {ethnicGlow.description}
                  </p>

                  <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.2em] text-white uppercase group-hover:text-[#D9AC68] transition-colors">
                    <span>EXPLORE</span>
                    <span className="w-7 h-7 rounded-full border border-[#C58B3C] text-[#C58B3C] flex items-center justify-center transition-all duration-300 group-hover:bg-[#C58B3C] group-hover:text-[#171411] group-hover:scale-105 shadow-sm">
                      <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* --------------------------------------------------------------------- */}
            {/* BOTTOM RIGHT: DIAMOND WHISPER                                         */}
            {/* --------------------------------------------------------------------- */}
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex-1"
            >
              {/* Overlapping Offset Gold Frame */}
              <div
                className="absolute -bottom-2 -right-2 inset-0 border border-[#C58B3C]/40 pointer-events-none transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"
                style={{ clipPath: rightCardClip }}
              />

              <div
                role="button"
                tabIndex={0}
                aria-label="Explore Diamond Whisper Collection"
                onClick={() => navigate(diamondWhisper.href)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(diamondWhisper.href);
                  }
                }}
                style={{ clipPath: rightCardClip }}
                className="group relative h-full min-h-[260px] sm:min-h-[275px] overflow-hidden bg-[#2D0616] cursor-pointer shadow-xl select-none p-6 sm:p-8 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58B3C]"
              >
                {/* Right Side Radiant Diamond Photography */}
                <div className="absolute right-0 inset-y-0 w-[55%] sm:w-[50%] overflow-hidden">
                  <img
                    src={diamondWhisper.image}
                    alt={diamondWhisper.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-106"
                  />
                  {/* Seamless Horizontal Blend */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2D0616] via-[#2D0616]/50 to-transparent pointer-events-none" />
                </div>

                {/* Left Side Editorial Content */}
                <div className="relative z-10 max-w-[62%] sm:max-w-[55%] transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-sans font-semibold tracking-[0.25em] text-[#D9AC68] uppercase">
                      COLLECTION
                    </span>
                    <span className="w-6 h-[1px] bg-[#C58B3C]/80" />
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal tracking-tight leading-snug">
                    {diamondWhisper.title}
                  </h3>

                  <p className="font-serif italic text-xs sm:text-sm text-[#E8D9C6] font-normal mt-0.5 tracking-wide">
                    &ldquo;{diamondWhisper.subtitle}&rdquo;
                  </p>

                  <p className="font-sans text-[11px] sm:text-xs text-stone-300 font-light leading-relaxed mt-2 mb-4 line-clamp-2">
                    {diamondWhisper.description}
                  </p>

                  <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.2em] text-white uppercase group-hover:text-[#D9AC68] transition-colors">
                    <span>EXPLORE</span>
                    <span className="w-7 h-7 rounded-full border border-[#C58B3C] text-[#C58B3C] flex items-center justify-center transition-all duration-300 group-hover:bg-[#C58B3C] group-hover:text-[#171411] group-hover:scale-105 shadow-sm">
                      <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
};
