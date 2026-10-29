import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

export interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  delay?: number; // initial delay in ms
  cursor?: boolean;
  cursorClassName?: string;
  className?: string;
  onComplete?: () => void;
  loop?: boolean;
  pauseDuration?: number; // ms to pause before looping
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 40,
  delay = 200,
  cursor = true,
  cursorClassName = 'text-[#C6A15B]',
  className = '',
  onComplete,
  loop = false,
  pauseDuration = 2400,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(text);
      if (onComplete) onComplete();
      return;
    }

    let currentIndex = 0;
    let timer: NodeJS.Timeout;
    let loopTimer: NodeJS.Timeout;

    const startTyping = () => {
      timer = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(timer);
          if (onComplete) onComplete();

          if (loop) {
            loopTimer = setTimeout(() => {
              currentIndex = 0;
              setDisplayedText('');
              startTyping();
            }, pauseDuration);
          }
        }
      }, speed);
    };

    const initialTimeout = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(timer);
      clearTimeout(loopTimer);
    };
  }, [text, speed, delay, loop, pauseDuration, prefersReducedMotion, onComplete]);

  return (
    <span className={`inline-block ${className}`.trim()}>
      <span>{displayedText}</span>
      {cursor && !prefersReducedMotion && (
        <span 
          className={`inline-block w-[1.5px] h-[1em] ml-0.5 align-middle bg-current animate-pulse ${cursorClassName}`} 
          aria-hidden="true"
        />
      )}
    </span>
  );
};
