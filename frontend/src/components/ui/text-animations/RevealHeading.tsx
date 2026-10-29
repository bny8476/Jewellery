import React, { useMemo } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { EASINGS, TIMING } from '../../../utils/motion';

export type RevealStyle = 
  | 'word' 
  | 'char' 
  | 'line' 
  | 'mask' 
  | 'clip' 
  | 'blur' 
  | 'slide-up' 
  | 'slide-left' 
  | 'scale';

export interface RevealHeadingProps {
  children?: React.ReactNode;
  text?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: RevealStyle;
  delay?: number;
  staggerDelay?: number;
  className?: string;
  serif?: boolean;
  once?: boolean;
  accentLine?: boolean;
  accentLineClassName?: string;
  highlightWords?: string[];
  highlightClassName?: string;
  viewportMargin?: string;
}

export const RevealHeading: React.FC<RevealHeadingProps> = ({
  children,
  text,
  as = 'h2',
  variant = 'slide-up',
  delay = 0,
  staggerDelay = 0.04,
  className = '',
  serif = false,
  once = true,
  accentLine = false,
  accentLineClassName = '',
  highlightWords = [],
  highlightClassName = 'text-[#D8B878] italic font-serif',
  viewportMargin = '-40px'
}) => {
  const prefersReducedMotion = useReducedMotion();
  const rawText = text || (typeof children === 'string' ? children : '');

  // Word-by-word splitting
  const words = useMemo(() => {
    if (!rawText) return [];
    return rawText.split(/\s+/).filter(Boolean);
  }, [rawText]);

  // Character splitting (for short titles)
  const characters = useMemo(() => {
    if (!rawText) return [];
    return Array.from(rawText);
  }, [rawText]);

  const fontClass = serif ? 'font-serif' : '';
  const MotionTag = motion[as] as any;

  // If user requests reduced motion, deliver clean, instant, accessible text
  if (prefersReducedMotion) {
    return (
      <MotionTag
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once }}
        transition={{ duration: 0.25, delay }}
        className={`${fontClass} ${className}`.trim()}
      >
        {children || rawText}
        {accentLine && (
          <span 
            className={`block h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-2.5 w-24 mx-auto ${accentLineClassName}`} 
          />
        )}
      </MotionTag>
    );
  }

  // Word-by-word reveal with masked overflow
  if (variant === 'word' && words.length > 0) {
    const containerVariants: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: delay,
        }
      }
    };

    const wordVariants: Variants = {
      hidden: { 
        opacity: 0, 
        y: '100%',
        filter: 'blur(3px)'
      },
      visible: { 
        opacity: 1, 
        y: '0%',
        filter: 'blur(0px)',
        transition: {
          duration: TIMING.velvet,
          ease: EASINGS.luxury
        }
      }
    };

    return (
      <MotionTag
        aria-label={rawText}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: viewportMargin }}
        className={`inline-block ${fontClass} ${className}`.trim()}
      >
        <span className="sr-only">{rawText}</span>
        <span aria-hidden="true" className="inline flex-wrap gap-x-[0.28em]">
          {words.map((word, index) => {
            const isHighlighted = highlightWords.some(hw => 
              word.toLowerCase().includes(hw.toLowerCase())
            );
            return (
              <span key={`${word}-${index}`} className="inline-block overflow-hidden py-0.5 align-top">
                <motion.span
                  variants={wordVariants}
                  className={`inline-block ${isHighlighted ? highlightClassName : ''}`}
                >
                  {word}
                </motion.span>
                {index < words.length - 1 && <span className="inline-block w-[0.25em]">&nbsp;</span>}
              </span>
            );
          })}
        </span>
        {accentLine && (
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once }}
            transition={{ duration: 0.7, delay: delay + (words.length * staggerDelay) + 0.1, ease: EASINGS.luxury }}
            className={`block h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-3 origin-center ${accentLineClassName || 'w-24 mx-auto'}`}
          />
        )}
      </MotionTag>
    );
  }

  // Character-by-character reveal (for short luxury titles)
  if (variant === 'char' && characters.length > 0) {
    const charContainer: Variants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay * 0.5,
          delayChildren: delay,
        }
      }
    };

    const charVariants: Variants = {
      hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
      visible: { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        transition: { duration: 0.45, ease: EASINGS.luxury }
      }
    };

    return (
      <MotionTag
        aria-label={rawText}
        variants={charContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: viewportMargin }}
        className={`inline-block ${fontClass} ${className}`.trim()}
      >
        <span className="sr-only">{rawText}</span>
        <span aria-hidden="true" className="inline">
          {characters.map((ch, idx) => (
            <motion.span key={idx} variants={charVariants} className="inline-block">
              {ch === ' ' ? '\u00A0' : ch}
            </motion.span>
          ))}
        </span>
        {accentLine && (
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once }}
            transition={{ duration: 0.65, delay: delay + (characters.length * 0.02) + 0.1, ease: EASINGS.luxury }}
            className={`block h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-3 origin-center ${accentLineClassName || 'w-24 mx-auto'}`}
          />
        )}
      </MotionTag>
    );
  }

  // Line / Mask reveal: Smoothly slides up from clipped container
  if (variant === 'mask' || variant === 'line') {
    return (
      <div className="overflow-hidden py-1">
        <MotionTag
          initial={{ y: '110%', opacity: 0 }}
          whileInView={{ y: '0%', opacity: 1 }}
          viewport={{ once, margin: viewportMargin }}
          transition={{ duration: TIMING.deliberate, delay, ease: EASINGS.luxury }}
          className={`${fontClass} ${className}`.trim()}
        >
          {children || rawText}
        </MotionTag>
        {accentLine && (
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once }}
            transition={{ duration: 0.7, delay: delay + 0.35, ease: EASINGS.luxury }}
            className={`block h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-3 origin-center ${accentLineClassName || 'w-24 mx-auto'}`}
          />
        )}
      </div>
    );
  }

  // Smooth blur-to-sharp transition
  if (variant === 'blur') {
    return (
      <MotionTag
        initial={{ opacity: 0, filter: 'blur(10px)', y: 8 }}
        whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        viewport={{ once, margin: viewportMargin }}
        transition={{ duration: TIMING.slow, delay, ease: EASINGS.luxury }}
        className={`${fontClass} ${className}`.trim()}
      >
        {children || rawText}
        {accentLine && (
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once }}
            transition={{ duration: 0.7, delay: delay + 0.3, ease: EASINGS.luxury }}
            className={`block h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-3 origin-center ${accentLineClassName || 'w-24 mx-auto'}`}
          />
        )}
      </MotionTag>
    );
  }

  // Clip-path luxury reveal
  if (variant === 'clip') {
    return (
      <MotionTag
        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
        viewport={{ once, margin: viewportMargin }}
        transition={{ duration: 0.85, delay, ease: EASINGS.luxury }}
        className={`${fontClass} ${className}`.trim()}
      >
        {children || rawText}
        {accentLine && (
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once }}
            transition={{ duration: 0.7, delay: delay + 0.35, ease: EASINGS.luxury }}
            className={`block h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-3 origin-center ${accentLineClassName || 'w-24 mx-auto'}`}
          />
        )}
      </MotionTag>
    );
  }

  // Scale and fade entrance
  if (variant === 'scale') {
    return (
      <MotionTag
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once, margin: viewportMargin }}
        transition={{ duration: TIMING.velvet, delay, ease: EASINGS.luxury }}
        className={`${fontClass} ${className}`.trim()}
      >
        {children || rawText}
      </MotionTag>
    );
  }

  // Slide-left
  if (variant === 'slide-left') {
    return (
      <MotionTag
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once, margin: viewportMargin }}
        transition={{ duration: TIMING.velvet, delay, ease: EASINGS.luxury }}
        className={`${fontClass} ${className}`.trim()}
      >
        {children || rawText}
      </MotionTag>
    );
  }

  // Default: Slide up with subtle elevation
  return (
    <MotionTag
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: viewportMargin }}
      transition={{ duration: TIMING.velvet, delay, ease: EASINGS.velvet }}
      className={`${fontClass} ${className}`.trim()}
    >
      {children || rawText}
      {accentLine && (
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once }}
          transition={{ duration: 0.7, delay: delay + 0.35, ease: EASINGS.luxury }}
          className={`block h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-3 origin-center ${accentLineClassName || 'w-24 mx-auto'}`}
        />
      )}
    </MotionTag>
  );
};
