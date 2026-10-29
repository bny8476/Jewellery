import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EASINGS } from '../../../utils/motion';

export interface RotatingWordsProps {
  words: string[];
  interval?: number;
  className?: string;
  wordClassName?: string;
  transitionType?: 'vertical-slide' | 'fade-zoom' | 'clip-wipe';
  pauseOnHover?: boolean;
}

export const RotatingWords: React.FC<RotatingWordsProps> = ({
  words,
  interval = 3200,
  className = '',
  wordClassName = 'text-[#D8B878] italic font-serif',
  transitionType = 'vertical-slide',
  pauseOnHover = true,
}) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (words.length <= 1 || isPaused || prefersReducedMotion) return;

    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [words.length, interval, isPaused, prefersReducedMotion]);

  if (words.length === 0) return null;

  if (prefersReducedMotion) {
    return (
      <span className={`inline-block ${className}`.trim()}>
        <span className={wordClassName}>{words[0]}</span>
      </span>
    );
  }

  // Animation variants
  const variantsMap = {
    'vertical-slide': {
      initial: { y: '80%', opacity: 0, filter: 'blur(4px)' },
      animate: { 
        y: '0%', 
        opacity: 1, 
        filter: 'blur(0px)',
        transition: { duration: 0.55, ease: EASINGS.luxury }
      },
      exit: { 
        y: '-80%', 
        opacity: 0, 
        filter: 'blur(3px)',
        transition: { duration: 0.45, ease: EASINGS.easeInOut }
      }
    },
    'fade-zoom': {
      initial: { opacity: 0, scale: 0.95 },
      animate: { 
        opacity: 1, 
        scale: 1, 
        transition: { duration: 0.5, ease: EASINGS.velvet } 
      },
      exit: { 
        opacity: 0, 
        scale: 1.05, 
        transition: { duration: 0.35, ease: EASINGS.easeIn } 
      }
    },
    'clip-wipe': {
      initial: { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
      animate: { 
        clipPath: 'inset(0% 0 0 0)', 
        opacity: 1, 
        transition: { duration: 0.6, ease: EASINGS.luxury } 
      },
      exit: { 
        clipPath: 'inset(0 0 100% 0)', 
        opacity: 0, 
        transition: { duration: 0.4, ease: EASINGS.easeInOut } 
      }
    }
  };

  const selectedVariant = variantsMap[transitionType];

  return (
    <span
      className={`inline-block overflow-hidden align-baseline relative ${className}`.trim()}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      onFocus={() => pauseOnHover && setIsPaused(true)}
      onBlur={() => pauseOnHover && setIsPaused(false)}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={selectedVariant.exit}
          className={`inline-block ${wordClassName}`}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
