import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ServicesExperienceSectionProps {
  onOpenStoreLocator: () => void;
}

export const ServicesExperienceSection: React.FC<ServicesExperienceSectionProps> = ({
  onOpenStoreLocator,
}) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const services = [
    {
      id: 'collection',
      title: 'Premium Collection',
      description: 'Timeless designs for every occasion.',
      onClick: () => navigate('/jewellery'),
      icon: (
        <svg className="w-6 h-6 stroke-[1.6]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
          <path d="M2 10h20" />
          <path d="M12 21L8 10l4-7 4 7-4 11z" />
        </svg>
      ),
    },
    {
      id: 'quality',
      title: 'Trusted Quality',
      description: 'Pure gold & certified diamonds.',
      onClick: onOpenStoreLocator,
      icon: (
        <svg className="w-6 h-6 stroke-[1.6]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'personalized',
      title: 'Personalized Service',
      description: 'Tailored just for you.',
      onClick: () => {
        window.open(
          'https://wa.me/914424347888?text=Hello%20YAZHINI%20Fine%20Jewels,%20I%20would%20like%20to%20inquire%20about%20your%20jewellery%20collection',
          '_blank',
          'noopener,noreferrer'
        );
      },
      icon: (
        <svg className="w-6 h-6 stroke-[1.6]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      ),
    },
    {
      id: 'store',
      title: 'Visit Our Store',
      description: 'Experience the elegance in person.',
      onClick: onOpenStoreLocator,
      icon: (
        <svg className="w-6 h-6 stroke-[1.6]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="14" r="7" />
          <polygon points="12,2 15,6 9,6" />
          <path d="M12 2v4" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="your-services"
      className="relative py-20 sm:py-24 bg-[#FAF5EF] dark:bg-[#150E12] border-t border-[#EAE0D4] dark:border-[#38262E] overflow-hidden transition-colors duration-300"
    >
      {/* Soft Ambient Silk Background Sheen */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF5EF] via-[#F8F1E7] to-[#F4E8D9] dark:from-[#180F14] dark:via-[#140A0F] dark:to-[#10070B] pointer-events-none" />

      {/* Decorative Ambient Waves */}
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(240,224,204,0.45)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(88,20,38,0.18)_0%,transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(216,180,120,0.25)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(198,161,91,0.1)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      {/* Fully Centered Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
        
        {/* Top Emblem: Line ── Diamond ── Line */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3.5 mb-2.5"
        >
          <span className="w-10 sm:w-14 h-[1px] bg-gradient-to-r from-transparent to-[#B8864E]" />
          <svg className="w-4 h-4 text-[#B8864E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
            <path d="M2 10h20" />
            <path d="M12 21L8 10l4-7 4 7-4 11z" />
          </svg>
          <span className="w-10 sm:w-14 h-[1px] bg-gradient-to-l from-transparent to-[#B8864E]" />
        </motion.div>

        {/* Eyebrow */}
        <motion.span
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-[11px] sm:text-xs font-sans font-semibold tracking-[0.28em] text-[#581426] dark:text-[#E8A598] uppercase block mb-2"
        >
          OUR SERVICES
        </motion.span>

        {/* Headline: More Than Jewellery / A Complete Luxury Experience */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mb-3"
        >
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-[#461220] dark:text-[#FAF5F0] font-normal tracking-tight leading-[1.18]">
            More Than Jewellery
          </h2>
          <span className="font-serif italic text-3xl sm:text-4xl lg:text-[44px] text-[#B8864E] dark:text-[#E5C388] font-normal tracking-tight leading-[1.18] block sm:inline">
            A Complete Luxury Experience
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="font-sans text-xs sm:text-[13.5px] text-[#6C565F] dark:text-[#D1C3C7] font-light leading-relaxed max-w-xl mx-auto mb-8 sm:mb-10"
        >
          From timeless designs to personalized service, we're here to make your every moment special.
        </motion.p>

        {/* 4 Service Columns with Thin Vertical Dividers */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 lg:gap-2 mb-10 pt-2 border-t border-b border-[#E8DEC4]/70 dark:border-[#38262E] py-6 sm:py-8 max-w-4xl mx-auto"
        >
          {services.map((service, index) => (
            <div
              key={service.id}
              onClick={service.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  service.onClick();
                }
              }}
              className={`group flex flex-col items-center text-center px-2 sm:px-4 cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8864E] ${
                index < 3 ? 'md:border-r md:border-[#E2D4C8] dark:md:border-[#3C2833]' : ''
              }`}
            >
              {/* Circular Icon Badge */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#F5ECE3] dark:bg-[#2C1621] border border-[#E7D6C9] dark:border-[#4B2838] flex items-center justify-center text-[#581426] dark:text-[#E8A598] mb-3 shadow-sm transition-all duration-300 group-hover:scale-108 group-hover:bg-[#EEDCD0] group-hover:border-[#B8864E]/50">
                {service.icon}
              </div>

              {/* Title */}
              <h3 className="font-serif text-sm sm:text-[15px] font-semibold text-[#3D1420] dark:text-[#FAF5F0] tracking-tight leading-snug group-hover:text-[#581426] dark:group-hover:text-[#F3D59B] transition-colors">
                {service.title}
              </h3>

              {/* Subtext */}
              <p className="font-sans text-[11px] sm:text-xs text-[#78646C] dark:text-[#C5B4B9] font-light leading-snug mt-1 max-w-[150px]">
                {service.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Action Section: Centered Primary CTA Button */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex items-center justify-center"
        >
          <button
            type="button"
            onClick={() => navigate('/jewellery')}
            className="w-full sm:w-auto px-9 py-3.5 rounded-full bg-[#4E1020] hover:bg-[#68172C] active:bg-[#3D0C18] text-white text-xs sm:text-[13px] font-semibold tracking-wider transition-all duration-300 shadow-[0_4px_16px_rgba(78,16,32,0.22)] hover:shadow-[0_6px_22px_rgba(78,16,32,0.32)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <span>Explore Our Collections</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>

        {/* Bottom Centered Diamond Ornament */}
        <div className="flex items-center justify-center mt-8 text-[#B8864E]/70">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
            <path d="M2 10h20" />
            <path d="M12 21L8 10l4-7 4 7-4 11z" />
          </svg>
        </div>

      </div>
    </section>
  );
};
