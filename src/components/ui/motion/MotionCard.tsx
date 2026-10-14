import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cardEntranceVariants, cardHoverProps, cardLiftProps } from '../../../utils/motion';

interface MotionCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'scale' | 'none';
  onClick?: () => void;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  hoverEffect = 'scale',
  onClick,
  ...rest
}) => {
  const hoverBehaviors = 
    hoverEffect === 'scale' 
      ? cardHoverProps 
      : hoverEffect === 'lift' 
      ? cardLiftProps 
      : {};

  return (
    <motion.div
      variants={cardEntranceVariants}
      {...hoverBehaviors}
      onClick={onClick}
      className={`transition-shadow ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
