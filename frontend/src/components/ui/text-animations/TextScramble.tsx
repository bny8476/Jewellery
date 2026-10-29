import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface TextScrambleProps {
  text: string;
  characters?: string;
  speed?: number;
  trigger?: 'inView' | 'mount' | 'hover';
  className?: string;
  onComplete?: () => void;
}

const LUXURY_SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789§✦✧';

export const TextScramble: React.FC<TextScrambleProps> = ({
  text,
  characters = LUXURY_SCRAMBLE_CHARS,
  speed = 30,
  trigger = 'inView',
  className = '',
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const runScramble = () => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      if (onComplete) onComplete();
      return;
    }

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        if (onComplete) onComplete();
      }

      iteration += 1 / 3;
    }, speed);
  };

  useEffect(() => {
    if (trigger === 'mount' && !hasAnimated) {
      setHasAnimated(true);
      runScramble();
    }
  }, [trigger, hasAnimated]);

  useEffect(() => {
    if (trigger !== 'inView' || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          runScramble();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [trigger, hasAnimated]);

  return (
    <span
      ref={containerRef}
      onMouseEnter={() => trigger === 'hover' && runScramble()}
      className={`inline-block font-mono tracking-wider ${className}`.trim()}
      aria-label={text}
    >
      {displayText}
    </span>
  );
};
