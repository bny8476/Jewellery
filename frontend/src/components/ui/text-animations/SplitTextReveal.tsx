import React, { useMemo } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { EASINGS, TIMING } from '../../../utils/motion';

export interface SplitTextRevealProps {
  children?: React.ReactNode;
  text?: string;
  type?: 'words' | 'chars' | 'lines';
  delay?: number;
  stagger?: number;
  className?: string;
  itemClassName?: string;
  once?: boolean;
}

export const SplitTextReveal: React.FC<SplitTextRevealProps> = ({
  children,
  text,
  type = 'words',
  delay = 0,
  stagger = 0.035,
  className = '',
  itemClassName = '',
  once = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const content = text || (typeof children === 'string' ? children : '');

  const tokens = useMemo(() => {
    if (!content) return [];
    if (type === 'chars') {
      return Array.from(content);
    }
    if (type === 'lines') {
      return content.split('\n');
    }
    return content.split(/\s+/).filter(Boolean);
  }, [content, type]);

  if (prefersReducedMotion || tokens.length === 0) {
    return <span className={className}>{children || content}</span>;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 14,
      filter: 'blur(3px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: TIMING.velvet,
        ease: EASINGS.luxury,
      },
    },
  };

  return (
    <motion.span
      aria-label={content}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-30px' }}
      className={`inline-block ${className}`.trim()}
    >
      <span className="sr-only">{content}</span>
      <span aria-hidden="true" className="inline flex-wrap">
        {tokens.map((token, idx) => (
          <span key={idx} className="inline-block overflow-hidden py-0.5">
            <motion.span
              variants={itemVariants}
              className={`inline-block ${itemClassName}`}
            >
              {token === ' ' ? '\u00A0' : token}
            </motion.span>
            {type === 'words' && idx < tokens.length - 1 && (
              <span className="inline-block w-[0.25em]">&nbsp;</span>
            )}
          </span>
        ))}
      </span>
    </motion.span>
  );
};
