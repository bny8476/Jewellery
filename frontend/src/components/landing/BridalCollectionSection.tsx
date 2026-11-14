import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gem, Crown, Sparkles } from 'lucide-react';
import { bridalCollectionData } from '../../data/landingCollections';

export const BridalCollectionSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const data = bridalCollectionData;

  // Asymmetrical clipped-corner geometry matching the luxury bridal editorial specification
  const bridalImageClip = 'polygon(48px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 48px)';

  return (
    <section
      id="bridal"
      className="relative min-h-[80vh] lg:min-h-[85vh] bg-[#F8EBDD] dark:bg-[#1B0610] text-[#38131C] dark:text-[#FAF0E6] overflow-hidden flex items-center border-b border-[#BD8238]/25 scroll-mt-28 sm:scroll-mt-32 transition-colors duration-500"
    >
      {/* ------------------------------------------------------------------------- */}
      {/* BACKGROUND DECORATIONS: Traditional South Indian Heritage & Fluid Curves */}
      {/* ------------------------------------------------------------------------- */}

      {/* Top-Right Deep Burgundy Fluid Swooping Wave */}
      <div className="absolute top-0 right-0 w-[240px] sm:w-[380px] lg:w-[460px] h-[180px] sm:h-[260px] lg:h-[320px] pointer-events-none z-0">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 120 0 C 180 80, 260 140, 400 180 L 400 0 Z"
            fill="#500B20"
            className="opacity-95 dark:opacity-40"
          />
          <path
            d="M 60 0 C 140 100, 240 180, 400 240 L 400 0 Z"
            fill="#710E2B"
            className="opacity-40 dark:opacity-20"
          />
          {/* Delicate Accent Gold Arc */}
          <path
            d="M 60 0 C 140 100, 240 180, 400 240"
            stroke="#BD8238"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="none"
          />
        </svg>
      </div>

      {/* Bottom-Left Deep Burgundy Fluid Wave */}
      <div className="absolute bottom-0 left-0 w-[220px] sm:w-[340px] lg:w-[420px] h-[160px] sm:h-[240px] lg:h-[280px] pointer-events-none z-0">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 120 C 140 150, 220 220, 280 300 L 0 300 Z"
            fill="#500B20"
            className="opacity-95 dark:opacity-40"
          />
          <path
            d="M 0 60 C 180 120, 280 200, 360 300 L 0 300 Z"
            fill="#710E2B"
            className="opacity-35 dark:opacity-20"
          />
          {/* Delicate Accent Gold Arc */}
          <path
            d="M 0 60 C 180 120, 280 200, 360 300"
            stroke="#BD8238"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            fill="none"
          />
        </svg>
      </div>

      {/* South Indian Temple Gopuram Silhouette Illustration (Behind text) */}
      <div className="absolute left-[30%] sm:left-[35%] lg:left-[38%] top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.14] dark:opacity-[0.08] z-0">
        <svg
          width="340"
          height="420"
          viewBox="0 0 200 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#BD8238]"
        >
          {/* Kalasham Finials */}
          <circle cx="100" cy="18" r="4" fill="currentColor" />
          <path d="M 96 22 L 104 22 L 102 32 L 98 32 Z" fill="currentColor" />
          {/* Tier 1 */}
          <polygon points="90,32 110,32 114,48 86,48" stroke="currentColor" strokeWidth="1.5" />
          <line x1="88" y1="42" x2="112" y2="42" stroke="currentColor" strokeWidth="1" />
          {/* Tier 2 */}
          <polygon points="82,48 118,48 124,72 76,72" stroke="currentColor" strokeWidth="1.5" />
          <line x1="80" y1="62" x2="120" y2="62" stroke="currentColor" strokeWidth="1" />
          {/* Tier 3 */}
          <polygon points="72,72 128,72 136,104 64,104" stroke="currentColor" strokeWidth="1.5" />
          <line x1="70" y1="90" x2="130" y2="90" stroke="currentColor" strokeWidth="1" />
          {/* Tier 4 */}
          <polygon points="60,104 140,104 150,144 50,144" stroke="currentColor" strokeWidth="1.5" />
          <line x1="56" y1="126" x2="144" y2="126" stroke="currentColor" strokeWidth="1" />
          {/* Tier 5 */}
          <polygon points="46,144 154,144 166,192 34,192" stroke="currentColor" strokeWidth="1.5" />
          <line x1="42" y1="170" x2="158" y2="170" stroke="currentColor" strokeWidth="1" />
          {/* Tier 6 (Base Gateway) */}
          <polygon points="30,192 170,192 182,248 18,248" stroke="currentColor" strokeWidth="1.5" />
          {/* Sacred Archway / Gopura Dwaram */}
          <path d="M 80 248 C 80 215, 120 215, 120 248 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Lotus & Botanical Gold Line-Art Illustrations */}
      {/* Top Left Lotus Motif */}
      <div className="absolute top-6 left-6 sm:left-12 pointer-events-none select-none opacity-[0.22] dark:opacity-[0.14] z-0">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 15 C 40 35, 40 55, 50 75 C 60 55, 60 35, 50 15 Z" stroke="#BD8238" strokeWidth="1" />
          <path d="M 50 75 C 30 65, 15 45, 25 30 C 35 45, 45 60, 50 75 Z" stroke="#BD8238" strokeWidth="1" />
          <path d="M 50 75 C 70 65, 85 45, 75 30 C 65 45, 55 60, 50 75 Z" stroke="#BD8238" strokeWidth="1" />
          <path d="M 50 75 C 20 70, 5 55, 10 40 C 25 50, 40 65, 50 75 Z" stroke="#BD8238" strokeWidth="0.8" />
          <path d="M 50 75 C 80 70, 95 55, 90 40 C 75 50, 60 65, 50 75 Z" stroke="#BD8238" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Bottom Center Lotus Motif */}
      <div className="absolute -bottom-6 left-[28%] sm:left-[35%] pointer-events-none select-none opacity-[0.22] dark:opacity-[0.14] z-0">
        <svg width="140" height="140" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 20 C 42 40, 42 60, 50 80 C 58 60, 58 40, 50 20 Z" stroke="#BD8238" strokeWidth="1.2" />
          <path d="M 50 80 C 30 70, 15 50, 25 35 C 35 50, 45 65, 50 80 Z" stroke="#BD8238" strokeWidth="1" />
          <path d="M 50 80 C 70 70, 85 50, 75 35 C 65 50, 55 65, 50 80 Z" stroke="#BD8238" strokeWidth="1" />
        </svg>
      </div>

      {/* Diya Warm Golden Ambient Glow */}
      <div className="absolute top-[35%] left-[48%] -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D9AE70]/20 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------------------- */}
      {/* SECTION CONTENT: Asymmetrical Two-Column Hero Composition                 */}
      {/* ------------------------------------------------------------------------- */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: Editorial Bridal Story (~43% / 5 cols)                     */}
          {/* ----------------------------------------------------------------------- */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 28 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex flex-col justify-center"
          >
            {/* Eyebrow Label with Dual Gold Decorative Lines */}
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <span className="w-8 sm:w-12 h-[1px] bg-[#BD8238]" />
              <span className="text-[10.5px] sm:text-xs font-sans font-bold tracking-[0.26em] text-[#BD8238] uppercase">
                {data.eyebrow}
              </span>
              <span className="w-8 sm:w-12 h-[1px] bg-[#BD8238]" />
            </div>

            {/* Main Editorial Headline */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] leading-[1.12] tracking-tight font-normal text-[#500B20] dark:text-[#FAF0E6]">
              {data.title}{' '}
              {data.italicTitle && (
                <span className="italic text-[#BD8238] dark:text-[#D9AE70] font-normal block sm:inline">
                  {data.italicTitle}
                </span>
              )}
            </h2>

            {/* Description */}
            <p className="font-sans text-xs sm:text-[13.5px] text-[#38131C]/90 dark:text-[#E9D3B9]/90 font-light leading-relaxed max-w-lg mt-4 mb-7 sm:mb-8">
              {data.description}
            </p>

            {/* 3 Horizontally Aligned Feature Highlights with Thin Vertical Dividers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-2 py-4 border-y border-[#BD8238]/30 mb-8 sm:mb-9">
              {/* Feature 1 */}
              <div className="flex items-center gap-3 pr-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-none border border-[#BD8238]/70 flex items-center justify-center shrink-0 text-[#BD8238]">
                  <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.6]" />
                </div>
                <span className="font-sans text-[11px] sm:text-[11.5px] font-medium text-[#38131C] dark:text-[#FAF0E6] leading-snug">
                  22K 916 BIS<br />Hallmarked Purity
                </span>
              </div>

              {/* Feature 2 (with subtle divider in sm+) */}
              <div className="flex items-center gap-3 sm:border-l sm:border-[#BD8238]/30 sm:pl-3 pr-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-none border border-[#BD8238]/70 flex items-center justify-center shrink-0 text-[#BD8238]">
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.6]" />
                </div>
                <span className="font-sans text-[11px] sm:text-[11.5px] font-medium text-[#38131C] dark:text-[#FAF0E6] leading-snug">
                  Custom Bridal<br />Trousseau Styling
                </span>
              </div>

              {/* Feature 3 (with subtle divider in sm+) */}
              <div className="flex items-center gap-3 sm:border-l sm:border-[#BD8238]/30 sm:pl-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-none border border-[#BD8238]/70 flex items-center justify-center shrink-0 text-[#BD8238]">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.6]" />
                </div>
                <span className="font-sans text-[11px] sm:text-[11.5px] font-medium text-[#38131C] dark:text-[#FAF0E6] leading-snug">
                  Certified Natural<br />Gemstones
                </span>
              </div>
            </div>

            {/* Primary CTA: Premium Rectangular Gold Button */}
            <div>
              <button
                type="button"
                onClick={() => navigate(data.ctaHref)}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-[#BD8238] via-[#C88E44] to-[#A76E2A] hover:from-[#A76E2A] hover:to-[#8E5A1E] text-white font-sans text-xs sm:text-[13px] font-semibold tracking-[0.2em] uppercase px-7 py-3.5 shadow-md border border-[#D9AE70]/40 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BD8238]"
              >
                <span>{data.ctaText}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: Dominant Bridal Jewellery Photography (~57% / 7 cols)     */}
          {/* ----------------------------------------------------------------------- */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 relative flex flex-col items-center"
          >
            {/* Overlapping Offset Antique-Gold Outline Frame */}
            <div
              className="absolute -bottom-2 -right-2 inset-0 border border-[#BD8238]/60 pointer-events-none transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1"
              style={{ clipPath: bridalImageClip }}
            />

            {/* Creative Geometric Image Container */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Explore Bridal Collection Muhurtham Heirloom"
              onClick={() => navigate(data.ctaHref)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(data.ctaHref);
                }
              }}
              style={{ clipPath: bridalImageClip }}
              className="group relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/10] overflow-hidden bg-[#380614] shadow-2xl cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BD8238]"
            >
              {/* Semantic Responsive Image with Micro-Zoom */}
              <img
                src={data.image}
                alt={data.imageAlt}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
              />

              {/* Edge Gradient & Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#20040A]/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />

              {/* Small Bottom-Right Image Label: MUHURTHAM HEIRLOOM */}
              <div className="absolute bottom-4 right-4 z-20 transition-transform duration-300 group-hover:-translate-y-0.5">
                <div className="bg-[#500B20]/95 backdrop-blur-sm px-3.5 py-1.5 border border-[#BD8238]/70 shadow-lg">
                  <span className="font-sans text-[10px] sm:text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#D9AE70]">
                    MUHURTHAM HEIRLOOM
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
