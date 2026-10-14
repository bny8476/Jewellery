import { Variants, Transition } from 'framer-motion';

/**
 * RCB JEWELRY'S & PAWN SHOP — Luxury Motion Design System
 * Obsidian & Champagne Gold Architectural Animations
 */

// Timing standards (in seconds)
export const TIMING = {
  instant: 0.1,
  fast: 0.18,
  standard: 0.28,
  slow: 0.42,
  deliberate: 0.65
};

// Easing curves
export const EASINGS = {
  luxury: [0.16, 1, 0.3, 1] as const, // Custom refined spring-like easeOut
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  gentleSpring: { type: 'spring', damping: 25, stiffness: 200 }
};

// Common Transitions
export const luxuryTransition: Transition = {
  duration: TIMING.standard,
  ease: EASINGS.luxury
};

export const fastTransition: Transition = {
  duration: TIMING.fast,
  ease: EASINGS.easeOut
};

/**
 * Page Transitions
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    transition: { duration: TIMING.fast, ease: EASINGS.easeOut }
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.standard, ease: EASINGS.luxury }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: TIMING.fast, ease: EASINGS.easeInOut }
  }
};

/**
 * Staggered Container for Grids, Lists and Metric Cards
 */
export const staggerContainer = (staggerChildren = 0.04, delayChildren = 0.02): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

/**
 * Card Entrance & Hover Animations
 */
export const cardEntranceVariants: Variants = {
  initial: {
    opacity: 0,
    y: 14
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: luxuryTransition
  }
};

export const cardHoverProps = {
  whileHover: {
    y: -3,
    scale: 1.012,
    transition: { duration: 0.2, ease: EASINGS.easeOut }
  },
  whileTap: {
    scale: 0.985,
    transition: { duration: 0.1 }
  }
};

export const cardLiftProps = {
  whileHover: {
    y: -4,
    transition: { duration: 0.2, ease: EASINGS.easeOut }
  }
};

/**
 * Overlays: Modals & Dialogs (scale from 0.96 -> 1)
 */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: TIMING.fast } },
  exit: { opacity: 0, transition: { duration: TIMING.fast } }
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 8
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: TIMING.standard, ease: EASINGS.luxury }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: TIMING.fast, ease: EASINGS.easeInOut }
  }
};

/**
 * Drawers (Slide-overs from right or left)
 */
export const drawerRightVariants: Variants = {
  initial: { x: '100%', opacity: 0.5 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 240 } },
  exit: { x: '100%', opacity: 0, transition: { duration: TIMING.fast, ease: EASINGS.easeInOut } }
};

export const drawerLeftVariants: Variants = {
  initial: { x: '-100%', opacity: 0.5 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 240 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: TIMING.fast, ease: EASINGS.easeInOut } }
};

/**
 * Dropdowns & Context Menus
 */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.97,
    y: -6
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: TIMING.fast, ease: EASINGS.easeOut }
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -6,
    transition: { duration: 0.12, ease: EASINGS.easeInOut }
  }
};

/**
 * Button Micro-Interactions
 */
export const buttonMotionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.15 }
};

export const iconButtonMotionProps = {
  whileHover: { scale: 1.08 },
  whileTap: { scale: 0.92 },
  transition: { duration: 0.12 }
};

/**
 * Image Zoom Hover Utility (For jewellery catalogues & product grids)
 */
export const imageZoomVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.06,
    transition: { duration: 0.45, ease: EASINGS.easeOut }
  }
};

/**
 * Helper to check reduced motion preference
 */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
