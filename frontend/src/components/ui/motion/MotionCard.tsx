import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cardEntranceVariants, velvetHoverProps, cardLiftProps } from '../../../utils/motion';

interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'velvet' | 'lift' | 'scale' | 'none';
  sheen?: boolean;
  onClick?: () => void;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  hoverEffect = 'velvet',
  sheen = false,
  onClick,
  ...rest
}) => {
  const hoverBehaviors = 
    hoverEffect === 'velvet' || hoverEffect === 'scale'
      ? velvetHoverProps 
      : hoverEffect === 'lift' 
      ? cardLiftProps 
      : {};

  return (
    <motion.div
      variants={cardEntranceVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.15 }}
      {...hoverBehaviors}
      onClick={onClick}
      className={`group relative overflow-hidden transition-all duration-300 ${sheen ? 'sheen-container' : ''} ${className}`}
      {...rest}
    >
      {children}
      {sheen && <div className="sheen-sweep" />}
    </motion.div>
  );
};

