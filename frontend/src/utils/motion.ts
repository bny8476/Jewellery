import { Variants, Transition } from 'framer-motion';

/**
 * YAZHINI FINE JEWELS & PAWN SHOP — Signature Luxury Motion Design System
 * Obsidian, Ivory, & Champagne Gold Architectural Animations
 * Precision tuned for 60fps GPU performance, responsive touch, and reduced-motion accessibility.
 */

// Timing standards (in seconds)
export const TIMING = {
  instant: 0.1,
  fast: 0.18,
  standard: 0.32,
  velvet: 0.45,
  slow: 0.6,
  deliberate: 0.75
};

// Refined Easing Curves
export const EASINGS = {
  // Editorial luxury curve with gentle deceleration
  luxury: [0.16, 1, 0.3, 1] as const,
  // Velvet elevation curve for natural weight and inertia
  velvet: [0.22, 1, 0.36, 1] as const,
  // Champagne border & light sheen transition
  champagne: [0.25, 0.1, 0.25, 1] as const,
  // Snappy response for buttons and micro-interactions
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  // Spring configurations
  gentleSpring: { type: 'spring', damping: 26, stiffness: 220 } as const,
  snappySpring: { type: 'spring', damping: 20, stiffness: 300 } as const,
};

// Common Transitions
export const luxuryTransition: Transition = {
  duration: TIMING.standard,
  ease: EASINGS.luxury
};

export const velvetTransition: Transition = {
  duration: TIMING.velvet,
  ease: EASINGS.velvet
};

export const fastTransition: Transition = {
  duration: TIMING.fast,
  ease: EASINGS.easeOut
};

/**
 * 1. LUXURY JEWELLERY CARD ANIMATION VARIANTS
 */

/**
 * A. Diamond Spotlight Reveal: Smooth opacity and subtle upward glide when entering viewport
 */
export const diamondSpotlightVariants: Variants = {
  initial: {
    opacity: 0,
    y: 18,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.velvet,
      ease: EASINGS.velvet
    }
  }
};

/**
 * B. Velvet Elevation Effect: Restrained lift and soft scale for desktop hover
 */
export const velvetHoverProps = {
  whileHover: {
    y: -5,
    scale: 1.012,
    transition: { duration: 0.28, ease: EASINGS.velvet }
  },
  whileTap: {
    scale: 0.988,
    transition: { duration: 0.12 }
  }
};

export const cardLiftProps = {
  whileHover: {
    y: -4,
    transition: { duration: 0.24, ease: EASINGS.velvet }
  },
  whileTap: {
    scale: 0.99,
    transition: { duration: 0.1 }
  }
};

export const cardHoverProps = velvetHoverProps;

export const cardEntranceVariants: Variants = diamondSpotlightVariants;

/**
 * C. Macro Jewellery Zoom: Smooth internal zoom within clipped container
 */
export const macroZoomVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.06,
    transition: { duration: TIMING.slow, ease: EASINGS.luxury }
  }
};

export const imageZoomVariants = macroZoomVariants;

/**
 * D. Champagne Border Reveal & Underline Transitions
 */
export const champagneBorderVariants: Variants = {
  initial: {
    borderColor: 'rgba(198, 154, 139, 0.25)',
    boxShadow: '0 0 0 0 rgba(198, 154, 139, 0)'
  },
  hover: {
    borderColor: 'rgba(198, 154, 139, 0.75)',
    boxShadow: '0 8px 24px -6px rgba(112, 38, 56, 0.15)',
    transition: { duration: TIMING.fast, ease: EASINGS.champagne }
  }
};

/**
 * G. Signature Collection & Grid Reveal (Staggered Sequences)
 */
export const staggerContainer = (staggerChildren = 0.05, delayChildren = 0.02): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren
    }
  }
});

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.velvet,
      ease: EASINGS.velvet
    }
  }
};

/**
 * H. Premium Quick Actions (Wishlist, Quick View, Add to Bag)
 * Slide up and fade in smoothly on desktop hover, immediately accessible on touch
 */
export const quickActionsVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8
  },
  hover: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.fast,
      ease: EASINGS.easeOut
    }
  }
};

/**
 * 2. MODULE-SPECIFIC MOTION VARIANTS
 */

/**
 * Digital Gold (AuraGold): Calm, trustworthy rate & wallet animations
 */
export const goldRatePulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.92, 1],
    transition: { duration: 0.6, ease: EASINGS.easeOut }
  }
};

export const goldCardEntrance: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.standard, ease: EASINGS.luxury }
  }
};

/**
 * Pawn Shop: Structured, professional loan stages & calculator cards
 */
export const pawnStepVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: TIMING.standard, ease: EASINGS.velvet }
  }
};

export const pawnAccordionVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { duration: TIMING.standard, ease: EASINGS.velvet }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: TIMING.fast, ease: EASINGS.easeInOut }
  }
};

/**
 * Admin Dashboard: Clean, efficient, operational speed
 */
export const adminMetricVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: TIMING.fast, ease: EASINGS.easeOut }
  }
};

export const adminTableVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: TIMING.fast }
  }
};

/**
 * 3. PAGE & OVERLAY TRANSITIONS
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
 * Overlays: Modals & Dialogs (scale from 0.96 -> 1 with backdrop blur)
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
    y: 10
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
    y: 10,
    transition: { duration: TIMING.fast, ease: EASINGS.easeInOut }
  }
};

/**
 * Drawers (Slide-overs from right or left with spring damping)
 */
export const drawerRightVariants: Variants = {
  initial: { x: '100%', opacity: 0.6 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 28, stiffness: 240 }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: TIMING.fast, ease: EASINGS.easeInOut }
  }
};

export const drawerLeftVariants: Variants = {
  initial: { x: '-100%', opacity: 0.6 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 28, stiffness: 240 }
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: TIMING.fast, ease: EASINGS.easeInOut }
  }
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
 * 4. BUTTON & MICRO-INTERACTIONS
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

export const chipMotionProps = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.15 }
};

/**
 * 5. ACCESSIBILITY / REDUCED MOTION HELPERS
 */

/**
 * 6. HERO SECTION & ANNOUNCEMENT MOTION VARIANTS
 */

export const heroBackgroundZoomVariants: Variants = {
  initial: { scale: 1.02, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      scale: { duration: 6, ease: EASINGS.luxury },
      opacity: { duration: 0.7, ease: EASINGS.easeOut }
    }
  },
  exit: {
    scale: 1.02,
    opacity: 0,
    transition: { duration: 0.5, ease: EASINGS.easeIn }
  }
};

export const heroHeadlineLineVariants: Variants = {
  initial: { y: '110%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: EASINGS.luxury }
  }
};

export const heroAccentLineVariants: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.8, delay: 0.35, ease: EASINGS.luxury }
  }
};

export const heroFadeRiseVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: 0.45, ease: EASINGS.velvet }
  }
};

export const heroCtaStaggerVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.6, ease: EASINGS.velvet }
  }
};

export const announcementBarVariants: Variants = {
  initial: { y: -24, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: EASINGS.velvet }
  }
};

/**
 * 7. ACCESSIBILITY / REDUCED MOTION HELPERS
 */

export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Safely strips transform animations if user prefers reduced motion
 */
export function getAccessibleVariants(variants: Variants): Variants {
  if (!getPrefersReducedMotion()) return variants;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.1 } }
  };
}



