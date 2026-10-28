import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Route-aware fallback destination mapping according to the YAZHINI route hierarchy.
 */
export function getRouteFallbackPath(pathname: string): { path: string; label: string } {
  // Normalize path without trailing slashes
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // 1. Product Detail Pages
  if (cleanPath.startsWith('/product/') || cleanPath.startsWith('/jewelry/')) {
    return { path: '/jewellery', label: 'Back to Collections' };
  }

  // 2. Specific Category / Collection Pages
  if (
    cleanPath.startsWith('/jewellery/') ||
    cleanPath.startsWith('/category/') ||
    cleanPath.startsWith('/categories/') ||
    cleanPath.startsWith('/collections/')
  ) {
    return { path: '/jewellery', label: 'All Jewellery Collections' };
  }

  // 3. Top-Level Jewellery Catalogue
  if (cleanPath === '/jewellery' || cleanPath === '/shop' || cleanPath === '/categories') {
    return { path: '/', label: 'Back to Storefront' };
  }

  // 4. Gift Certificate / Voucher Viewer
  if (
    cleanPath.startsWith('/gift-card/') ||
    cleanPath.startsWith('/gift-cards/view/') ||
    cleanPath.startsWith('/gift-certificate/')
  ) {
    return { path: '/gift-cards', label: 'Back to Gift Cards' };
  }

  // 5. Gift Cards Boutique
  if (cleanPath === '/gift-cards') {
    return { path: '/jewellery', label: 'Back to Store' };
  }

  // 6. Bullion & Digital Gold Vault
  if (cleanPath === '/auragold' || cleanPath === '/aura-gold' || cleanPath === '/digital-gold') {
    return { path: '/dashboard?tab=vault', label: 'Back to Patron Vault' };
  }

  // 7. Pawn & Collateral Services
  if (cleanPath === '/pawn') {
    return { path: '/', label: 'Back to Home' };
  }

  // 8. Rate Comparison Hub
  if (
    cleanPath === '/jewellery-rate-comparison' ||
    cleanPath === '/rate-comparison' ||
    cleanPath === '/compare'
  ) {
    return { path: '/live-rates', label: 'Back to Live Rates' };
  }

  // 9. Daily Live Rates
  if (cleanPath === '/live-rates') {
    return { path: '/jewellery', label: 'Back to Boutique' };
  }

  // 10. Checkout & Gifting
  if (cleanPath === '/checkout') {
    return { path: '/jewellery', label: 'Back to Bag' };
  }

  // 11. Patron Notifications
  if (cleanPath === '/notifications') {
    return { path: '/dashboard?tab=overview', label: 'Back to Dashboard' };
  }

  // 12. Patron Dashboard
  if (cleanPath === '/dashboard' || cleanPath === '/profile') {
    return { path: '/', label: 'Back to Storefront' };
  }

  // 13. Admin Management Portal
  if (cleanPath.startsWith('/admin')) {
    return { path: '/admin', label: 'Back to Admin Hub' };
  }

  // Default fallback
  return { path: '/', label: 'Back to Home' };
}

/**
 * Determine if current browser session has safe in-app history.
 */
export function hasInAppHistory(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // React Router DOM v6 records history state index
    const historyState = window.history.state;
    if (historyState && typeof historyState.idx === 'number' && historyState.idx > 0) {
      return true;
    }

    // Secondary check: referrer matches current origin and history has length
    if (
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin)
    ) {
      return true;
    }
  } catch {
    // In restricted iframe or secure environment, fall back safely
    return false;
  }

  return false;
}

export interface UseAppNavigationReturn {
  canGoBack: boolean;
  fallbackPath: string;
  fallbackLabel: string;
  goBack: (customFallback?: string, onBeforeNavigate?: () => boolean | void) => void;
  navigateToParent: (customFallback?: string) => void;
}

/**
 * Comprehensive in-app navigation hook for YAZHINI Fine Jewels.
 * Implements intelligent in-app history detection with route-hierarchy safe fallbacks.
 */
export function useAppNavigation(): UseAppNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();

  const { path: fallbackPath, label: fallbackLabel } = useMemo(
    () => getRouteFallbackPath(location.pathname),
    [location.pathname]
  );

  const canGoBack = useMemo(() => hasInAppHistory(), []);

  const goBack = useCallback(
    (customFallback?: string, onBeforeNavigate?: () => boolean | void) => {
      // Check unsaved changes or guard hook
      if (onBeforeNavigate) {
        const canProceed = onBeforeNavigate();
        if (canProceed === false) {
          return;
        }
      }

      // Check for route state overrides (e.g., location.state?.from)
      const stateFrom = (location.state as { from?: string } | null)?.from;
      const targetFallback = customFallback || stateFrom || fallbackPath;

      // Safe navigation: check if in-app history is available
      if (hasInAppHistory()) {
        navigate(-1);
      } else {
        navigate(targetFallback);
      }
    },
    [navigate, location.state, fallbackPath]
  );

  const navigateToParent = useCallback(
    (customFallback?: string) => {
      navigate(customFallback || fallbackPath);
    },
    [navigate, fallbackPath]
  );

  return {
    canGoBack,
    fallbackPath,
    fallbackLabel,
    goBack,
    navigateToParent
  };
}
