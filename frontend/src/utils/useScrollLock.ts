import { useEffect } from 'react';

interface UseScrollLockOptions {
  onEscape?: () => void;
}

/**
 * Custom hook to lock body scrolling when a modal or drawer is open.
 * Accounts for scrollbar width to prevent horizontal layout shifts.
 * Handles the 'Escape' key cleanly to close the overlay.
 */
export function useScrollLock(isLocked: boolean, options?: UseScrollLockOptions) {
  const onEscape = options?.onEscape;

  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout jump
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLocked, onEscape]);
}
