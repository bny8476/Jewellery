import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASINGS } from '../../../utils/motion';

export interface AnimatedUnderlineProps {
  mode?: 'inView' | 'hover' | 'always';
  direction?: 'left-to-right' | 'center-out';
  color?: string;
  height?: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export const AnimatedUnderline: React.FC<AnimatedUnderlineProps> = ({
  mode = 'inView',
  direction = 'center-out',
  color = 'bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent',
  height = 'h-[1.5px]',
  className = 'w-24 mx-auto mt-2.5',
  delay = 0.3,
  duration = 0.7,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={`block ${height} ${color} ${className}`} />;
  }

  const originClass = direction === 'left-to-right' ? 'origin-left' : 'origin-center';

  if (mode === 'always') {
    return (
      <motion.span
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration, delay, ease: EASINGS.luxury }}
        className={`block ${height} ${color} ${originClass} ${className}`.trim()}
      />
    );
  }

  return (
    <motion.span
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: EASINGS.luxury }}
      className={`block ${height} ${color} ${originClass} ${className}`.trim()}
    />
  );
};
