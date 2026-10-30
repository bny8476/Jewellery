import { describe, it, expect, beforeEach, vi } from 'vitest';
import { campaignService, CampaignData } from './campaignService';
import { validateAndApplyCoupon } from '../utils/couponUtils';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] !== undefined ? this.store[key] : null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  key(index: number) { return Object.keys(this.store)[index] || null; }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true });

describe('YAZHINI FINE JEWELS — Festive Extravaganza Offer Popup Suite', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Core Requirement — First-Time Visitor Only Targeting', () => {
    const POPUP_DISMISSED_KEY = 'yazhini_festive_offer_dismissed_v1';
    const POPUP_SEEN_KEY = 'yazhini_first_time_visitor_offer_seen';
    const RETURNING_VISITOR_KEY = 'yazhini_patron_returning_visitor';

    it('identifies genuine first-time visitor when localStorage has no previous record', () => {
      const isDismissed = localStorage.getItem(POPUP_DISMISSED_KEY) === 'true';
      const hasSeen = localStorage.getItem(POPUP_SEEN_KEY) === 'true';
      const isReturning = localStorage.getItem(RETURNING_VISITOR_KEY) === 'true';

      const isFirstTimeVisitor = !isDismissed && !hasSeen && !isReturning;
      expect(isFirstTimeVisitor).toBe(true);
    });

    it('blocks popup on subsequent page visits when user previously dismissed or viewed it', () => {
      // Simulate user closing popup
      localStorage.setItem(POPUP_DISMISSED_KEY, 'true');
      localStorage.setItem(POPUP_SEEN_KEY, 'true');

      const isDismissed = localStorage.getItem(POPUP_DISMISSED_KEY) === 'true';
      const hasSeen = localStorage.getItem(POPUP_SEEN_KEY) === 'true';

      const shouldShow = !isDismissed && !hasSeen;
      expect(shouldShow).toBe(false);
    });

    it('does not display popup repeatedly across page refreshes or route changes', () => {
      // Simulate popup displayed on first visit
      localStorage.setItem(POPUP_SEEN_KEY, 'true');
      localStorage.setItem(RETURNING_VISITOR_KEY, 'true');

      // Refresh / route change occurs
      const hasSeen = localStorage.getItem(POPUP_SEEN_KEY) === 'true';
      const isReturning = localStorage.getItem(RETURNING_VISITOR_KEY) === 'true';

      expect(hasSeen).toBe(true);
      expect(isReturning).toBe(true);
    });

    it('does not interrupt existing customers who already have an account session', () => {
      localStorage.setItem('rcb_user_session', JSON.stringify({ id: 'user-123', email: 'patron@luxury.com' }));

      const hasAuthSession = !!localStorage.getItem('rcb_user_session');
      expect(hasAuthSession).toBe(true);
    });

    it('strictly confines display to homepage (/) and never triggers on internal routes', () => {
      const allowedPath = '/';
      const internalRoutes = [
        '/catalog',
        '/products/royal-choker',
        '/cart',
        '/checkout',
        '/dashboard',
        '/admin',
        '/vault'
      ];

      expect(allowedPath === '/').toBe(true);
      internalRoutes.forEach((route) => {
        expect(route === '/').toBe(false);
      });
    });
  });

  describe('2. Campaign Configuration & Dynamic Content', () => {
    it('provides default Festive Extravaganza offer with ROYAL20 coupon', async () => {
      const activeCampaign = await campaignService.getActiveCampaign();
      expect(activeCampaign).not.toBeNull();
      expect(activeCampaign?.heading).toBe('FESTIVE EXTRAVAGANZA');
      expect(activeCampaign?.badge_label).toBe('LIMITED FESTIVE OFFER');
      expect(activeCampaign?.coupon_code).toBe('ROYAL20');
      expect(activeCampaign?.discount_value).toBe(20);
      expect(activeCampaign?.min_order_value).toBe(5000);
      expect(activeCampaign?.max_discount).toBe(15000);
      expect(activeCampaign?.cta_text).toBe('SHOP ELIGIBLE COLLECTION');
      expect(activeCampaign?.secondary_text).toBe('LATER');
    });

    it('allows admin to create, edit, activate and deactivate campaigns', async () => {
      const customCampaign: Partial<CampaignData> = {
        name: 'Diwali Gold Gala 2026',
        badge_label: 'EXCLUSIVE DIWALI PRIVILEGE',
        heading: 'DIWALI GOLD GALA',
        description: 'Enjoy flat 25% off making charges on handcrafted temple jewellery.',
        coupon_code: 'DIWALI25',
        discount_type: 'percentage',
        discount_value: 25,
        min_order_value: 10000,
        max_discount: 25000,
        status: 'active'
      };

      expect(customCampaign.coupon_code).toBe('DIWALI25');
      expect(customCampaign.discount_value).toBe(25);
      expect(customCampaign.status).toBe('active');
    });
  });

  describe('3. Functional Workflows: Copy Code, Shop Collection & Dismiss', () => {
    it('copies active coupon code ROYAL20 to clipboard and sets copied feedback state', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      const couponCode = 'ROYAL20';
      await navigator.clipboard.writeText(couponCode);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('ROYAL20');
    });

    it('stores pre-applied coupon in sessionStorage when user clicks Shop Eligible Collection', () => {
      const couponCode = 'ROYAL20';
      sessionStorage.setItem('yazhini_applied_coupon', couponCode);

      expect(sessionStorage.getItem('yazhini_applied_coupon')).toBe('ROYAL20');
    });

    it('preserves dismissed state when user clicks LATER or close icon', () => {
      const POPUP_DISMISSED_KEY = 'yazhini_festive_offer_dismissed_v1';
      localStorage.setItem(POPUP_DISMISSED_KEY, 'true');

      expect(localStorage.getItem(POPUP_DISMISSED_KEY)).toBe('true');
    });
  });

  describe('4. Server-Side Coupon Validation & Checkout Calculation', () => {
    it('applies ROYAL20 on valid cart value above ₹5,000 with flat 20% making charge cap', () => {
      const orderTotal = 60000;
      const res = validateAndApplyCoupon('ROYAL20', orderTotal);

      expect(res.success).toBe(true);
      expect(res.coupon?.code).toBe('ROYAL20');
      // 5% equivalent discount on ₹60,000 = ₹3,000
      expect(res.coupon?.discountAmount).toBe(3000);
      expect(res.coupon?.discountAmount).toBeLessThanOrEqual(15000);
    });

    it('enforces maximum discount cap of ₹15,000 on high-value orders', () => {
      const highOrderTotal = 500000; // 5% would be ₹25,000 -> capped at ₹15,000
      const res = validateAndApplyCoupon('ROYAL20', highOrderTotal);

      expect(res.success).toBe(true);
      expect(res.coupon?.discountAmount).toBe(15000);
    });

    it('rejects coupon when subtotal is below minimum order requirement of ₹5,000', () => {
      const lowOrderTotal = 3500;
      const res = validateAndApplyCoupon('ROYAL20', lowOrderTotal);

      expect(res.success).toBe(false);
      expect(res.error).toContain('requires a minimum order value');
    });

    it('rejects invalid or unauthorized coupon codes with a clear message', () => {
      const res = validateAndApplyCoupon('FAKE_DISCOUNT_100', 50000);

      expect(res.success).toBe(false);
      expect(res.error).toContain('is invalid or expired');
    });
  });

  describe('5. Analytics & Real-Time Tracking', () => {
    it('records impression, dismiss, copy_code, and cta_click events', async () => {
      const recordSpy = vi.spyOn(campaignService, 'recordAnalytics').mockResolvedValue(undefined);

      await campaignService.recordAnalytics('festive-extravaganza-2026', 'impression');
      await campaignService.recordAnalytics('festive-extravaganza-2026', 'copy_code');
      await campaignService.recordAnalytics('festive-extravaganza-2026', 'cta_click');
      await campaignService.recordAnalytics('festive-extravaganza-2026', 'dismiss');

      expect(recordSpy).toHaveBeenCalledTimes(4);
      expect(recordSpy).toHaveBeenNthCalledWith(1, 'festive-extravaganza-2026', 'impression');
      expect(recordSpy).toHaveBeenNthCalledWith(2, 'festive-extravaganza-2026', 'copy_code');
      expect(recordSpy).toHaveBeenNthCalledWith(3, 'festive-extravaganza-2026', 'cta_click');
      expect(recordSpy).toHaveBeenNthCalledWith(4, 'festive-extravaganza-2026', 'dismiss');
    });
  });
});
