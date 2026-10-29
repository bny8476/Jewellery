import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in seconds
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
  className?: string;
  once?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 0.8,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatter,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // If reduced motion is requested, instantly set display value with no interpolation
    if (prefersReducedMotion) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    prevValueRef.current = value;

    // If initial mount and once is true, only animate if in view or animate once
    let startTimestamp: number | null = null;
    const durationMs = duration * 1000;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        hasAnimatedRef.current = true;
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration, prefersReducedMotion]);

  const formattedNumber = formatter 
    ? formatter(displayValue) 
    : decimals > 0 
      ? displayValue.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : Math.round(displayValue).toLocaleString('en-IN');

  return (
    <span
      ref={containerRef}
      className={`inline-block tabular-nums font-mono tracking-tight ${className}`.trim()}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-label={`${prefix}${formatter ? formatter(value) : value}${suffix}`}
    >
      {prefix}{formattedNumber}{suffix}
    </span>
  );
};
