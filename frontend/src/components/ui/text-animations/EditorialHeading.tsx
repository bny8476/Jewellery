import React from 'react';
import { motion } from 'framer-motion';
import { RevealHeading, RevealStyle } from './RevealHeading';
import { GoldShimmerText } from './GoldShimmerText';
import { EASINGS, TIMING } from '../../../utils/motion';

export interface EditorialHeadingProps {
  eyebrow?: string;
  title: string;
  highlightText?: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  variant?: RevealStyle;
  delay?: number;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showAccentLine?: boolean;
  shimmerHighlight?: boolean;
}

export const EditorialHeading: React.FC<EditorialHeadingProps> = ({
  eyebrow,
  title,
  highlightText,
  subtitle,
  align = 'center',
  variant = 'slide-up',
  delay = 0,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  showAccentLine = true,
  shimmerHighlight = false,
}) => {
  const alignClass = align === 'center' ? 'text-center mx-auto' : align === 'right' ? 'text-right ml-auto' : 'text-left';

  return (
    <div className={`max-w-3xl ${alignClass} ${className}`.trim()}>
      {/* Eyebrow / Kicker */}
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay, ease: EASINGS.velvet }}
          className="inline-flex items-center gap-2 mb-2.5"
        >
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-[#C6A15B]" />
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#C6A15B]">
            {eyebrow}
          </span>
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-[#C6A15B]" />
        </motion.div>
      )}

      {/* Main Heading */}
      <div className="relative">
        <RevealHeading
          as="h2"
          variant={variant}
          delay={delay + 0.1}
          className={`font-serif text-2xl sm:text-3xl lg:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide ${titleClassName}`.trim()}
          highlightWords={highlightText ? [highlightText] : []}
        >
          {shimmerHighlight && highlightText ? (
            <>
              {title.split(highlightText)[0]}
              <GoldShimmerText variant="champagne" className="font-serif italic font-normal">
                {highlightText}
              </GoldShimmerText>
              {title.split(highlightText)[1] || ''}
            </>
          ) : (
            title
          )}
        </RevealHeading>

        {/* Animated Gold Accent Line */}
        {showAccentLine && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: delay + 0.35, ease: EASINGS.luxury }}
            className={`h-[1.5px] bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent mt-3.5 origin-center ${
              align === 'center' ? 'w-24 mx-auto' : align === 'right' ? 'w-24 ml-auto' : 'w-24'
            }`}
          />
        )}
      </div>

      {/* Supporting Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: TIMING.velvet, delay: delay + 0.25, ease: EASINGS.velvet }}
          className={`text-sm sm:text-base text-[#746B75] dark:text-[#B5ABB6] font-light mt-3 leading-relaxed max-w-xl ${
            align === 'center' ? 'mx-auto' : ''
          } ${subtitleClassName}`.trim()}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};
