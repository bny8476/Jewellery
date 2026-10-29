import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface GoldShimmerTextProps {
  children: React.ReactNode;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
  className?: string;
  variant?: 'champagne' | 'rose-gold' | 'metallic-glow';
  hoverOnly?: boolean;
  intensity?: 'subtle' | 'vibrant';
}

export const GoldShimmerText: React.FC<GoldShimmerTextProps> = ({
  children,
  as = 'span',
  className = '',
  variant = 'champagne',
  hoverOnly = false,
  intensity = 'subtle',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as] as any;

  // Variant gradient classes
  const gradientStyles: Record<string, string> = {
    'champagne': 'from-[#C6A15B] via-[#F3E7C4] via-50% to-[#C6A15B]',
    'rose-gold': 'from-[#D4988B] via-[#F8DDD7] via-50% to-[#D4988B]',
    'metallic-glow': 'from-[#B38728] via-[#FBF5B7] via-45% to-[#DAA520]',
  };

  const selectedGradient = gradientStyles[variant] || gradientStyles['champagne'];

  if (prefersReducedMotion) {
    return (
      <Component className={`text-[#D8B878] font-medium ${className}`.trim()}>
        {children}
      </Component>
    );
  }

  const animationClass = hoverOnly 
    ? 'hover:animate-gold-shimmer' 
    : intensity === 'subtle' 
      ? 'animate-gold-shimmer-slow' 
      : 'animate-gold-shimmer';

  return (
    <Component
      className={`inline-block bg-gradient-to-r ${selectedGradient} bg-[length:200%_auto] bg-clip-text text-transparent ${animationClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
};
