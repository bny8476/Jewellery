import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  let pathname = '';
  try {
    pathname = useLocation().pathname;
  } catch {
    pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  }
  const isAdmin = pathname.startsWith('/admin');

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
          className={`fixed bottom-6 right-6 z-40 w-11 h-11 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer focus:outline-none rounded-sm ${
            isAdmin
              ? 'bg-[#D4AF37] hover:bg-[#C59F27] text-[#120D0F] border border-[#B38F1E] dark:border-[#F3E5AB]/70 shadow-[0_4px_20px_rgba(212,175,55,0.4)]'
              : 'bg-[#702638] dark:bg-[#2A1018] text-[#FAF5F0] border border-[#D4AF37]/60 hover:border-[#D4AF37] shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-[#541C2A] dark:hover:bg-[#3D1420]'
          }`}
          aria-label="Back to top"
          title="Back to Top"
        >
          {/* Subtle Hover Tooltip */}
          <div className={`absolute right-full mr-3 px-2.5 py-1 text-[10.5px] font-sans font-medium tracking-wider uppercase shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none rounded-xs ${
            isAdmin
              ? 'bg-[#1A1215] text-[#D4AF37] border border-[#D4AF37]/40'
              : 'bg-[#250810] text-[#FAF5F0] border border-[#D4AF37]/30'
          }`}>
            Back to Top
          </div>

          <ChevronUp
            className={`w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200 ${
              isAdmin ? 'text-[#120D0F]' : 'text-[#FAF5F0]'
            }`}
            strokeWidth={2.5}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTopButton;
