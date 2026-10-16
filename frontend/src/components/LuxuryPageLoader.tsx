import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LuxuryPageLoaderProps {
  isLoading: boolean;
  onFinish?: () => void;
  brandName?: string;
  tagline?: string;
}

export const LuxuryPageLoader: React.FC<LuxuryPageLoaderProps> = ({
  isLoading,
  onFinish,
  brandName = "RCB JEWELLERY",
  tagline = "ROYAL HEIRLOOM JEWELLERY & BULLION · EST. 1994",
}) => {
  const [progress, setProgress] = useState(0);
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    // Smooth progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const diff = Math.random() * 18 + 8;
        return Math.min(100, prev + diff);
      });
    }, 90);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && progress >= 100) {
      const timeout = setTimeout(() => {
        setShouldShow(false);
        if (onFinish) onFinish();
      }, 550);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, progress, onFinish]);

  // Fallback safety timeout so loader never hangs
  useEffect(() => {
    const safety = setTimeout(() => {
      setShouldShow(false);
      if (onFinish) onFinish();
    }, 2800);
    return () => clearTimeout(safety);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="luxury-page-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'blur(8px)',
            transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] }
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#130307] text-[#FAF5F0] overflow-hidden select-none"
        >
          {/* Subtle Ambient Radial Gold Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,161,91,0.18)_0%,rgba(19,3,7,0.85)_50%,#130307_100%)] pointer-events-none" />

          {/* Golden Embellishment Frame */}
          <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
            
            {/* Animated Royal Lotus Emblem */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ 
                scale: [0.92, 1.02, 0.98],
                opacity: 1,
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="relative mb-6"
            >
              {/* Outer Glowing Halo */}
              <div className="absolute inset-0 rounded-full bg-[#C6A15B]/25 blur-xl scale-125" />
              
              <div className="relative w-16 h-16 rounded-full border border-[#C6A15B]/50 bg-gradient-to-b from-[#2B0813] to-[#160208] flex items-center justify-center shadow-[0_0_30px_rgba(198,161,91,0.35)]">
                <svg className="w-9 h-9 text-[#E5C388]" viewBox="0 0 24 24" fill="currentColor">
                  {/* Stylized royal crown & lotus jewel */}
                  <path d="M12 2C11.5 5 9 8 6 9C9 10 11 13 12 17C13 13 15 10 18 9C15 8 12.5 5 12 2Z" />
                  <circle cx="12" cy="19.5" r="1.5" />
                  <circle cx="12" cy="4.5" r="1" />
                </svg>
              </div>
            </motion.div>

            {/* Brand Title with Golden Shimmer */}
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="font-serif text-2xl sm:text-3xl font-normal tracking-[0.18em] text-[#FAF5F0] uppercase"
            >
              {brandName}
            </motion.h2>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-[10px] sm:text-[11px] font-sans font-medium tracking-[0.28em] text-[#C6A15B] uppercase mt-2 mb-8"
            >
              {tagline}
            </motion.p>

            {/* Micro Gold Progress Track */}
            <div className="w-56 h-[1.5px] bg-[#C6A15B]/20 relative overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-gradient-to-r from-[#8C5D3B] via-[#E5C388] to-[#FAF5F0] origin-left"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>

            {/* Subtle Loading Text */}
            <span className="text-[9.5px] font-mono tracking-widest text-stone-500 uppercase mt-3">
              Curating Royal Catalogue · {Math.round(progress)}%
            </span>
          </div>

          {/* Quick Skip for accessibility */}
          <button
            type="button"
            onClick={() => setShouldShow(false)}
            className="absolute bottom-6 text-[10px] uppercase font-sans tracking-[0.2em] text-stone-500 hover:text-[#C6A15B] transition-colors"
          >
            Skip Intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
