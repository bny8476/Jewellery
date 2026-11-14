import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { occasionMosaicData } from '../../data/landingCollections';
import { CollectionCTA } from './CollectionCTA';

export const OccasionMosaic: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const data = occasionMosaicData;

  return (
    <section
      id="jewels-for-every-occasion"
      className="relative py-20 sm:py-28 bg-[#120D10] text-[#FAF5F0] overflow-hidden border-b border-[#2C1C23]"
    >
      {/* Monochrome Editorial Background Base */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-30 mix-blend-luminosity">
        <img
          src={data.backgroundImage}
          alt={data.backgroundAlt}
          loading="lazy"
          className="w-full h-full object-cover object-top filter grayscale contrast-125"
        />
        {/* Editorial Gradients to ensure text and color items pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120D10] via-[#120D10]/80 to-[#120D10]/90" />
        <div className="absolute inset-0 bg-[#120D10]/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-18"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-8 h-[1px] bg-[#C6A15B]" />
            <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.3em] text-[#C6A15B] uppercase">
              {data.eyebrow}
            </span>
            <span className="w-8 h-[1px] bg-[#C6A15B]" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-[#FAF5F0] font-normal tracking-tight max-w-2xl mx-auto">
            {data.title}
          </h2>

          <div className="w-12 h-[1px] bg-[#C6A15B] mx-auto mt-4 mb-3" />

          <p className="font-sans text-xs sm:text-sm text-[#E2D2CB]/80 font-light leading-relaxed max-w-xl mx-auto">
            {data.description}
          </p>
        </motion.div>

        {/* Colour Jewellery Overlaid on Monochrome Canvas */}
        {/* Desktop: 4 Columns with subtle vertical stagger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.items.map((item, index) => (
            <motion.div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`View ${item.category}: ${item.name} for ${item.occasion}`}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 25 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.55,
                delay: shouldReduceMotion ? 0 : index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={() => navigate(item.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(item.href);
                }
              }}
              className={`group cursor-pointer bg-[#1D1418]/90 border border-white/10 overflow-hidden flex flex-col justify-between transition-all duration-500 hover:border-[#C6A15B] hover:shadow-2xl hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A15B] ${
                index % 2 === 1 ? 'lg:translate-y-4' : ''
              }`}
            >
              {/* Product Color Photo with hover scale */}
              <div className="relative aspect-square overflow-hidden bg-[#24171D]">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106 filter drop-shadow-md"
                />
                
                {/* Occasion pill badge */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-[9px] font-sans font-semibold tracking-widest text-[#E5C388] uppercase">
                  {item.occasion}
                </div>

                {/* Quick explore indicator */}
                <div className="absolute top-3 right-3 w-7 h-7 bg-black/60 border border-white/15 flex items-center justify-center text-white/70 transition-all duration-300 group-hover:bg-[#C6A15B] group-hover:text-[#180309] group-hover:border-[#C6A15B]">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#1D1418]/90 to-[#140C10]">
                <div>
                  <span className="text-[10px] font-sans font-semibold tracking-[0.25em] text-[#C6A15B] uppercase block mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg text-white font-normal group-hover:text-[#F3D59B] transition-colors leading-snug">
                    {item.name}
                  </h3>
                </div>

                <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-medium tracking-[0.18em] text-white/70 uppercase group-hover:text-[#C6A15B] transition-colors">
                  <span>DISCOVER</span>
                  <span className="w-5 h-[1px] bg-white/30 group-hover:bg-[#C6A15B] group-hover:w-8 transition-all duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Editorial Callout */}
        <div className="mt-16 text-center">
          <CollectionCTA
            label="EXPLORE ALL JEWELLERY"
            href="/jewellery"
            variant="dark"
            ariaLabel="Explore all fine jewellery across all occasions"
          />
        </div>
      </div>
    </section>
  );
};
