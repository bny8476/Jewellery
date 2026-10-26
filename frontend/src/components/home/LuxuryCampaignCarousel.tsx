import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Pause 
} from 'lucide-react';

export interface CampaignItem {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  categorySlug: string;
  categoryLink: string;
  image: string;
  badge: string;
  accentGold: string;
  eyebrow: string;
}

export const CAMPAIGN_STORIES: CampaignItem[] = [
  {
    id: 'mirage',
    name: 'MIRAGE',
    subtitle: 'MY EVERYDAY SOLITAIRES',
    tagline: 'Certified VVS natural solitaires & diamond pendants crafted for timeless brilliance.',
    categorySlug: 'diamonds',
    categoryLink: '/category/diamonds',
    image: '/images/campaigns/campaign_mirage_solitaire.jpg',
    badge: 'Solitaire Brilliance',
    accentGold: '#E5C388',
    eyebrow: 'NATURAL DIAMONDS',
  },
  {
    id: 'parampara',
    name: 'PARAMPARA',
    subtitle: 'ANTIQUE & HERITAGE JEWELLERY',
    tagline: 'Imperial 22K temple gold harams, bridal trousseaus, and heirloom craftsmanship.',
    categorySlug: 'bridal',
    categoryLink: '/category/bridal',
    image: '/images/campaigns/campaign_parampara_bridal.jpg',
    badge: 'Bridal Heritage',
    accentGold: '#DFB876',
    eyebrow: 'ROYAL HEIRLOOMS',
  },
  {
    id: 'aura',
    name: 'AURA',
    subtitle: '18K CONTEMPORARY GOLD',
    tagline: 'Sculptural geometric gold necklaces and modern silhouettes for the bold spirit.',
    categorySlug: 'gold',
    categoryLink: '/category/gold',
    image: '/images/campaigns/campaign_aura_modern.jpg',
    badge: 'Modern Heirlooms',
    accentGold: '#F0D59E',
    eyebrow: 'CONTEMPORARY EDIT',
  },
  {
    id: 'utsav',
    name: 'SHUBHA MANGALYAM',
    subtitle: 'FESTIVE EDITION',
    tagline: 'Joyous meenakari enamel, polki flourishes, and auspicious celebration jewellery.',
    categorySlug: 'traditional',
    categoryLink: '/category/traditional',
    image: '/images/campaigns/campaign_utsav_festive.jpg',
    badge: 'Festive Radiance',
    accentGold: '#DFB876',
    eyebrow: 'CELEBRATION JEWELS',
  },
  {
    id: 'aira',
    name: 'AIRA',
    subtitle: 'LIGHTWEIGHT LUXURY',
    tagline: 'Dainty cascading diamond pendants and delicate everyday gold chains.',
    categorySlug: 'women',
    categoryLink: '/category/women',
    image: '/images/campaigns/campaign_ethereal_everyday.jpg',
    badge: 'Everyday Fine Jewels',
    accentGold: '#E5C388',
    eyebrow: 'MINIMALIST LUXURY',
  },
  {
    id: 'samraat',
    name: 'SAMRAAT',
    subtitle: "MEN'S SIGNATURE FINE JEWELLERY",
    tagline: 'Solid 22K Cuban links, hand-carved kada bracelets, and royal signet rings.',
    categorySlug: 'men',
    categoryLink: '/category/men',
    image: '/images/campaigns/campaign_samraat_mens.jpg',
    badge: "Men's Luxury",
    accentGold: '#CF9F53',
    eyebrow: "MEN'S SIGNATURE",
  },
];

export function LuxuryCampaignCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = CAMPAIGN_STORIES.length;

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay handler (advances every 5 seconds when active and not paused)
  useEffect(() => {
    if (shouldReduceMotion || !isAutoplayActive || isPaused) {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      handleNext();
    }, 5000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [handleNext, isPaused, isAutoplayActive, shouldReduceMotion]);

  // Keyboard navigation when hovered or active in window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev]);

  // Compute circular positional offset diff: -2, -1, 0, 1, 2
  const getCardDiff = (index: number) => {
    let diff = (index - activeIndex) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  return (
    <section 
      id="campaigns"
      ref={containerRef}
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Signature Jewellery Campaigns Carousel"
      className="py-20 sm:py-28 bg-[#EDE4D8] dark:bg-[#160E12] border-y border-[#DACFBF] dark:border-[#38262E] relative overflow-hidden focus:outline-none select-none transition-colors duration-500"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.45) 0%, transparent 70%),
          radial-gradient(circle at 10% 80%, rgba(201, 164, 106, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(133, 44, 62, 0.08) 0%, transparent 50%)
        `
      }}
    >
      {/* Decorative Warm Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(#C6A15B_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header: Subtle, Refined Editorial Typography */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-3 mb-2.5">
              <div className="h-[1px] w-6 sm:w-10 bg-[#852C3E]/40 dark:bg-[#E8A598]/40" />
              <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.28em] text-[#852C3E] dark:text-[#E8A598] uppercase">
                THE ART OF ADORNMENT
              </span>
              <div className="h-[1px] w-6 sm:w-10 bg-[#852C3E]/40 dark:bg-[#E8A598]/40" />
            </div>

            {/* Main Section Heading */}
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[52px] text-[#341822] dark:text-[#FAF5F0] font-normal tracking-[-0.015em] leading-[1.1] mb-3">
              Stories of Timeless Elegance
            </h2>

            {/* Decorative Gold Motif */}
            <div className="flex items-center justify-center gap-2 mb-3.5 text-[#C6A15B]">
              <span className="h-[1px] w-8 bg-[#C6A15B]/40" />
              <span className="text-xs select-none">✦</span>
              <span className="h-[1px] w-8 bg-[#C6A15B]/40" />
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13.5px] text-[#69564E] dark:text-[#C5B5B8] font-light leading-relaxed max-w-xl mx-auto">
              Immerse yourself in our cinematic campaign collections. Every piece reflects an unbroken lineage of master artistry, pure hallmarked precious metals, and luminous natural gemstones.
            </p>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* OVERLAPPING EDITORIAL CAMPAIGN CAROUSEL STAGE                             */}
        {/* ========================================================================= */}
        <div className="relative w-full h-[470px] sm:h-[540px] md:h-[590px] lg:h-[640px] flex items-center justify-center overflow-visible">
          
          {/* Navigation Controls: Circular Left Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous campaign"
            className="absolute left-1 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A15B]"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Navigation Controls: Circular Right Arrow */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next campaign"
            className="absolute right-1 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A15B]"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* 3D Stack / Overlapping Stage */}
          <div className="relative w-full h-full flex items-center justify-center">
            {CAMPAIGN_STORIES.map((campaign, index) => {
              const diff = getCardDiff(index);
              const isCenter = diff === 0;
              const isVisible = Math.abs(diff) <= 2;

              // Positioning and Scale calculation
              let xOffset = 0;
              let yOffset = 0;
              let scale = 1;
              let zIndex = 10;
              let opacity = 1;

              if (isCenter) {
                xOffset = 0;
                yOffset = 0;
                scale = 1;
                zIndex = 30;
                opacity = 1;
              } else if (diff === 1) {
                // Right Middle Card
                xOffset = 52; // percentage relative to card width
                yOffset = 18;
                scale = 0.91;
                zIndex = 20;
                opacity = 0.94;
              } else if (diff === -1) {
                // Left Middle Card
                xOffset = -52;
                yOffset = 18;
                scale = 0.91;
                zIndex = 20;
                opacity = 0.94;
              } else if (diff === 2) {
                // Far Right Card
                xOffset = 98;
                yOffset = 36;
                scale = 0.81;
                zIndex = 10;
                opacity = 0.82;
              } else if (diff === -2) {
                // Far Left Card
                xOffset = -98;
                yOffset = 36;
                scale = 0.81;
                zIndex = 10;
                opacity = 0.82;
              } else {
                // Hidden Cards offstage
                xOffset = diff > 0 ? 140 : -140;
                yOffset = 48;
                scale = 0.65;
                zIndex = 0;
                opacity = 0;
              }

              return (
                <motion.div
                  key={campaign.id}
                  initial={false}
                  animate={{
                    x: `${xOffset}%`,
                    y: yOffset,
                    scale: scale,
                    zIndex: zIndex,
                    opacity: opacity,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0.05 : 0.75,
                    ease: [0.22, 1, 0.36, 1], // Cinematic refined easing curve
                  }}
                  onClick={() => {
                    if (!isCenter) {
                      setActiveIndex(index);
                    }
                  }}
                  className={`absolute top-0 bottom-0 my-auto w-[280px] sm:w-[350px] md:w-[390px] lg:w-[430px] xl:w-[450px] h-[440px] sm:h-[500px] md:h-[550px] lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer select-none transition-shadow duration-500 ${
                    isCenter
                      ? 'shadow-[0_28px_60px_-15px_rgba(45,15,25,0.45),0_12px_24px_-8px_rgba(0,0,0,0.25)] ring-1 ring-white/30 dark:ring-white/10'
                      : 'shadow-[0_16px_36px_-10px_rgba(0,0,0,0.3)] hover:brightness-105'
                  }`}
                  style={{
                    pointerEvents: isVisible ? 'auto' : 'none',
                  }}
                >
                  {/* Campaign Image */}
                  <img
                    src={campaign.image}
                    alt={`${campaign.name} - ${campaign.subtitle}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className={`w-full h-full object-cover object-center transition-transform duration-700 ${
                      isCenter ? 'scale-100 hover:scale-105' : 'scale-100'
                    }`}
                  />

                  {/* Editorial Gradient Vignette (bottom text readability while keeping jewel crisp) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 via-35% to-transparent pointer-events-none" />

                  {/* Top Eyebrow Badge (Subtle Luxury Stamp) */}
                  <div className="absolute top-4 sm:top-5 left-4 sm:left-6 z-10">
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.2em] text-[#F3E5D0] border border-white/15 uppercase shadow-sm"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-[#DFB876]" />
                      <span>{campaign.badge}</span>
                    </span>
                  </div>

                  {/* Overlaid Bottom Campaign Typography */}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 z-10 flex flex-col justify-end text-center">
                    
                    {/* Campaign Main Title */}
                    <h3 
                      className={`font-display text-2xl sm:text-3xl lg:text-[34px] font-normal tracking-[0.22em] sm:tracking-[0.28em] text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${
                        isCenter ? 'scale-100' : 'scale-95'
                      }`}
                    >
                      {campaign.name}
                    </h3>

                    {/* Subtitle / Collection Descriptor */}
                    <p className="text-[9.5px] sm:text-[11px] font-sans font-bold tracking-[0.24em] text-[#E5C388] uppercase mt-1 drop-shadow-sm">
                      {campaign.subtitle}
                    </p>

                    {/* Active Card Call To Action Button */}
                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="mt-4 pt-3 border-t border-white/15 flex items-center justify-center"
                      >
                        <Link
                          to={campaign.categoryLink}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 hover:bg-white text-[#341822] text-xs font-sans font-bold tracking-[0.14em] uppercase shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.4)] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <span>Explore Collection</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Carousel Bottom Control & Pagination Bar */}
        <div className="mt-8 sm:mt-10 flex items-center justify-center gap-4 relative z-20">
          
          {/* Autoplay Play/Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoplayActive(!isAutoplayActive)}
            aria-label={isAutoplayActive ? 'Pause autoplay' : 'Start autoplay'}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-[#341822] dark:text-[#FAF5F0] flex items-center justify-center transition-all cursor-pointer"
            title={isAutoplayActive ? 'Pause autoplay' : 'Start autoplay'}
          >
            {isAutoplayActive ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 translate-x-0.5" />
            )}
          </button>

          {/* Interactive Navigation Pills */}
          <div className="flex items-center gap-2">
            {CAMPAIGN_STORIES.map((c, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Go to ${c.name} campaign`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'w-8 bg-[#852C3E] dark:bg-[#E8A598] shadow-sm'
                      : 'w-2 bg-[#852C3E]/25 dark:bg-[#E8A598]/30 hover:bg-[#852C3E]/50'
                  }`}
                />
              );
            })}
          </div>

          {/* Active Campaign Counter */}
          <span className="text-[11px] font-sans font-semibold tracking-wider text-[#69564E] dark:text-[#C5B5B8]">
            <span className="text-[#852C3E] dark:text-[#E8A598] font-bold">0{activeIndex + 1}</span> / 0{total}
          </span>
        </div>

      </div>
    </section>
  );
}
