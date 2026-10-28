import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppNavigation } from '../../hooks/useAppNavigation';

export interface BackButtonProps {
  /**
   * Accessible display label or tooltip text.
   * Defaults to 'Back' or the context-aware fallback label.
   */
  label?: string;

  /**
   * Safe fallback route if opened directly or without in-app browser history.
   */
  fallbackPath?: string;

  /**
   * Visual styling variant:
   * - 'pill': Premium luxury pill badge with charcoal surface and gold borders (Default)
   * - 'outline': Clean border button with subtle hover elevation
   * - 'ghost': Minimal icon + label without background
   * - 'compact': Small icon button suitable for tight mobile headers
   */
  variant?: 'pill' | 'outline' | 'ghost' | 'compact';

  /**
   * Additional custom CSS classes.
   */
  className?: string;

  /**
   * Optional custom click handler.
   * If provided and returns false, back navigation is cancelled.
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Optional guard function before navigation (e.g. check for dirty unsaved forms).
   * Return false to prevent navigation.
   */
  onBeforeNavigate?: () => boolean | void;

  /**
   * If true, renders only the left-arrow icon while maintaining full screen-reader accessibility.
   */
  iconOnly?: boolean;

  /**
   * Explicit aria-label for accessibility audits.
   */
  ariaLabel?: string;

  /**
   * Disabled state.
   */
  disabled?: boolean;
}

/**
 * YAZHINI Fine Jewels — Premium Reusable Back Button Component
 *
 * Implements intelligent in-app history detection with route-hierarchy safe fallbacks,
 * responsive styling, WCAG accessible focus rings, and explicit button typing to prevent
 * accidental form submissions.
 */
export const BackButton: React.FC<BackButtonProps> = ({
  label,
  fallbackPath,
  variant = 'pill',
  className = '',
  onClick,
  onBeforeNavigate,
  iconOnly = false,
  ariaLabel,
  disabled = false
}) => {
  const { goBack, fallbackLabel } = useAppNavigation();

  const displayLabel = label || fallbackLabel || 'Back';
  const accessibleAriaLabel = ariaLabel || `Go back to ${displayLabel}`;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) return;
    }

    goBack(fallbackPath, onBeforeNavigate);
  };

  // Base styling adhering to YAZHINI luxury guidelines:
  // Charcoal #13161C / #181B22, Champagne Gold #D8B878 / #C9A45C, crisp typography
  const baseClasses =
    'inline-flex items-center justify-center gap-2 select-none font-sans font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B878] focus-visible:ring-offset-2 active:scale-[0.98]';

  let variantClasses = '';
  switch (variant) {
    case 'outline':
      variantClasses =
        'px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A303C] hover:border-[#25282D] dark:hover:border-[#D8B878]/60 bg-white dark:bg-[#14171F] text-[#343A40] dark:text-[#E2E6EE] hover:text-[#181B22] dark:hover:text-[#F7F8FA] text-xs shadow-2xs group';
      break;
    case 'ghost':
      variantClasses =
        'px-2 py-1.5 rounded-lg text-[#68758A] dark:text-[#9DA6B5] hover:text-[#181B22] dark:hover:text-[#F7F8FA] hover:bg-black/5 dark:hover:bg-white/5 text-xs group';
      break;
    case 'compact':
      variantClasses =
        'p-2 rounded-xl bg-white/80 dark:bg-[#181B22]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#282F3D] hover:border-[#D8B878]/60 text-[#343A40] dark:text-[#D2D7E2] hover:text-[#181B22] dark:hover:text-white shadow-xs group';
      break;
    case 'pill':
    default:
      variantClasses =
        'px-4 py-2 rounded-full bg-[#181B22] hover:bg-[#202530] text-[#E8ECF2] border border-[#2B3242] hover:border-[#D8B878]/70 text-xs shadow-xs group';
      break;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
      aria-label={accessibleAriaLabel}
      title={accessibleAriaLabel}
    >
      <ArrowLeft
        className={`w-3.5 h-3.5 text-[#D8B878] transition-transform duration-200 group-hover:-translate-x-0.5 shrink-0 ${
          iconOnly ? 'w-4 h-4' : ''
        }`}
        aria-hidden="true"
      />
      {!iconOnly && (
        <span className="tracking-wide font-medium leading-none">
          {displayLabel}
        </span>
      )}
    </button>
  );
};

export default BackButton;
