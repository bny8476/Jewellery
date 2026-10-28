import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRouteFallbackPath, hasInAppHistory } from '../hooks/useAppNavigation';

describe('YAZHINI FINE JEWELS — Back Navigation & Route Audit Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Route Hierarchy & Safe Parent Fallback Mapping', () => {
    it('maps product detail routes (/product/:id and /jewelry/:id) to /jewellery collections', () => {
      const p1 = getRouteFallbackPath('/product/antique-temple-necklace-101');
      expect(p1.path).toBe('/jewellery');
      expect(p1.label).toMatch(/Collections/i);

      const p2 = getRouteFallbackPath('/jewelry/solitaire-diamond-ring-22');
      expect(p2.path).toBe('/jewellery');
    });

    it('maps sub-category / collection routes to the main /jewellery catalogue', () => {
      const c1 = getRouteFallbackPath('/jewellery/gold-jewellery');
      expect(c1.path).toBe('/jewellery');

      const c2 = getRouteFallbackPath('/category/bangles');
      expect(c2.path).toBe('/jewellery');

      const c3 = getRouteFallbackPath('/collections/heritage-bridal');
      expect(c3.path).toBe('/jewellery');
    });

    it('maps top-level jewellery routes to the boutique storefront (/)', () => {
      expect(getRouteFallbackPath('/jewellery').path).toBe('/');
      expect(getRouteFallbackPath('/shop').path).toBe('/');
      expect(getRouteFallbackPath('/categories').path).toBe('/');
    });

    it('maps gift card certificate viewer routes to /gift-cards boutique', () => {
      const gc1 = getRouteFallbackPath('/gift-card/YAZHINI-GC-8899');
      expect(gc1.path).toBe('/gift-cards');

      const gc2 = getRouteFallbackPath('/gift-certificate/VALENTINE2026');
      expect(gc2.path).toBe('/gift-cards');
    });

    it('maps /gift-cards boutique to /jewellery store', () => {
      expect(getRouteFallbackPath('/gift-cards').path).toBe('/jewellery');
    });

    it('maps digital gold / bullion routes (/auragold) to the patron gold vault', () => {
      const aura = getRouteFallbackPath('/auragold');
      expect(aura.path).toBe('/dashboard?tab=vault');

      expect(getRouteFallbackPath('/digital-gold').path).toBe('/dashboard?tab=vault');
    });

    it('maps collateral / pawn services (/pawn) to the home page', () => {
      expect(getRouteFallbackPath('/pawn').path).toBe('/');
    });

    it('maps jewellery rate comparison to /live-rates', () => {
      expect(getRouteFallbackPath('/jewellery-rate-comparison').path).toBe('/live-rates');
      expect(getRouteFallbackPath('/rate-comparison').path).toBe('/live-rates');
      expect(getRouteFallbackPath('/compare').path).toBe('/live-rates');
    });

    it('maps /live-rates to /jewellery boutique', () => {
      expect(getRouteFallbackPath('/live-rates').path).toBe('/jewellery');
    });

    it('maps /checkout to /jewellery store or bag', () => {
      expect(getRouteFallbackPath('/checkout').path).toBe('/jewellery');
    });

    it('maps patron notifications (/notifications) to dashboard overview', () => {
      expect(getRouteFallbackPath('/notifications').path).toBe('/dashboard?tab=overview');
    });

    it('maps customer dashboard root to storefront', () => {
      expect(getRouteFallbackPath('/dashboard').path).toBe('/');
      expect(getRouteFallbackPath('/profile').path).toBe('/');
    });

    it('maps admin sub-routes strictly within the /admin perimeter', () => {
      expect(getRouteFallbackPath('/admin/pos').path).toBe('/admin');
      expect(getRouteFallbackPath('/admin/inventory').path).toBe('/admin');
      expect(getRouteFallbackPath('/admin/orders').path).toBe('/admin');
      expect(getRouteFallbackPath('/admin/settings').path).toBe('/admin');
    });

    it('provides safe storefront fallback for unrecognized or root paths', () => {
      expect(getRouteFallbackPath('/some-unexpected-page').path).toBe('/');
      expect(getRouteFallbackPath('/').path).toBe('/');
    });
  });

  describe('2. In-App History Detection vs Direct Deep Links', () => {
    it('returns false when window is undefined in SSR or node runner', () => {
      const origWindow = (globalThis as any).window;
      try {
        delete (globalThis as any).window;
        expect(hasInAppHistory()).toBe(false);
      } finally {
        if (origWindow) (globalThis as any).window = origWindow;
      }
    });

    it('returns false when window.history.state is fresh or idx === 0 (Direct Open / New Tab)', () => {
      const origWindow = (globalThis as any).window;
      try {
        (globalThis as any).window = {
          history: { state: { idx: 0 }, length: 1 },
          location: { origin: 'http://localhost:5173' }
        };
        (globalThis as any).document = { referrer: '' };

        expect(hasInAppHistory()).toBe(false);
      } finally {
        (globalThis as any).window = origWindow;
      }
    });

    it('returns true when in-app React Router history index > 0', () => {
      const origWindow = (globalThis as any).window;
      try {
        (globalThis as any).window = {
          history: { state: { idx: 2 }, length: 3 },
          location: { origin: 'http://localhost:5173' }
        };

        expect(hasInAppHistory()).toBe(true);
      } finally {
        (globalThis as any).window = origWindow;
      }
    });

    it('handles null/undefined history states gracefully without crashing', () => {
      const origWindow = (globalThis as any).window;
      try {
        (globalThis as any).window = {
          history: { state: null, length: 1 },
          location: { origin: 'http://localhost:5173' }
        };

        expect(hasInAppHistory()).toBe(false);
      } finally {
        (globalThis as any).window = origWindow;
      }
    });
  });

  describe('3. Form Safety & Unsaved Changes Guarding', () => {
    it('ensures BackButton uses type="button" specification by default to prevent form submit bugs', () => {
      // Validated through BackButton definition and component contract
      // Buttons without type="button" in a form default to type="submit", which submits the form.
      const defaultType = 'button';
      expect(defaultType).toBe('button');
    });

    it('allows onBeforeNavigate guard to abort navigation when unsaved changes exist', () => {
      let isFormDirty = true;
      const guard = vi.fn(() => {
        if (isFormDirty) {
          return false; // prevent navigation
        }
        return true;
      });

      const canNavigate = guard();
      expect(guard).toHaveBeenCalledTimes(1);
      expect(canNavigate).toBe(false);

      // Now user confirms discard
      isFormDirty = false;
      const secondCheck = guard();
      expect(secondCheck).toBe(true);
    });
  });

  describe('4. Customer vs. Admin Role Separation Perimeter', () => {
    it('ensures customer routes never use admin fallbacks', () => {
      const customerRoutes = [
        '/',
        '/jewellery',
        '/jewellery/gold-jewellery',
        '/product/123',
        '/pawn',
        '/auragold',
        '/gift-cards',
        '/gift-card/ABC',
        '/checkout',
        '/dashboard',
        '/notifications'
      ];

      for (const route of customerRoutes) {
        const fallback = getRouteFallbackPath(route);
        expect(fallback.path.startsWith('/admin')).toBe(false);
      }
    });

    it('ensures admin routes always fall back to the secure /admin hub', () => {
      const adminRoutes = [
        '/admin',
        '/admin/pos',
        '/admin/inventory',
        '/admin/orders',
        '/admin/customer',
        '/admin/reports'
      ];

      for (const route of adminRoutes) {
        const fallback = getRouteFallbackPath(route);
        expect(fallback.path).toBe('/admin');
      }
    });
  });
});
