import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after user scrolls past 350px
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-[#702638] dark:bg-[#2A1018] text-[#FAF5F0] border border-[#D4AF37]/60 hover:border-[#D4AF37] shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center justify-center transition-all duration-300 hover:bg-[#541C2A] dark:hover:bg-[#3D1420] hover:scale-105 active:scale-95 group cursor-pointer focus:outline-none"
          aria-label="Back to top"
          title="Back to Top"
        >
          {/* Subtle Hover Tooltip */}
          <div className="absolute right-full mr-3 px-2.5 py-1 bg-[#250810] text-[#FAF5F0] text-[10.5px] font-sans font-medium tracking-wider uppercase border border-[#D4AF37]/30 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Back to Top
          </div>

          <ChevronUp className="w-5 h-5 text-[#FAF5F0] group-hover:-translate-y-0.5 transition-transform duration-200" strokeWidth={2.2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTopButton;
