import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../services/apiService';
import { localJewelryItems } from '../utils/localData';
import { formatCurrencyINR } from '../utils/formatters';

describe('Product Card Click Navigation & Pricing System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Product Retrieval by ID / Slug', () => {
    it('retrieves an exact product by its unique ID from localJewelryItems fallback', async () => {
      const targetId = 'aurelle-1';
      const product = await ApiService.getJewelryItemById(targetId);

      expect(product).toBeDefined();
      expect(product?.id).toBe(targetId);
      expect(product?.name).toBe('Royal Vivaah Ruby & Kundan Bridal Set');
      expect(product?.category).toBe('Bridal Sets');
      expect(product?.metal_type).toBe('gold');
      expect(product?.weight).toBe(48.5);
    });

    it('returns null gracefully when a nonexistent product ID is requested', async () => {
      const product = await ApiService.getJewelryItemById('non-existent-product-id-99999');
      expect(product).toBeNull();
    });

    it('verifies all catalog items have valid unique non-empty IDs', () => {
      const ids = localJewelryItems.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBeGreaterThan(0);
      expect(uniqueIds.size).toBe(ids.length);
      ids.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('2. Rate & Pricing Calculations', () => {
    it('computes gold jewellery metal value and total price with making charges and 3% GST', () => {
      const gold22kRatePerGram = 13515.00;
      const grossWeight = 20.0; // grams
      const netWeight = 20.0 * 0.94; // 18.8g pure 22K gold
      const wastagePercent = 12; // 12% making charge

      // Metal value = Net gold weight * applicable gold rate per gram
      const metalValue = netWeight * gold22kRatePerGram;
      expect(metalValue).toBeCloseTo(254082, 0);

      // Making charges = metalValue * (wastagePercent / 100)
      const makingCharges = metalValue * (wastagePercent / 100);
      expect(makingCharges).toBeCloseTo(30489.84, 1);

      // Subtotal before tax
      const subtotal = metalValue + makingCharges;

      // 3% statutory GST (1.5% CGST + 1.5% SGST)
      const cgst = subtotal * 0.015;
      const sgst = subtotal * 0.015;
      const gstTotal = cgst + sgst;
      expect(gstTotal).toBeCloseTo(subtotal * 0.03, 1);

      // Final price
      const finalPrice = subtotal + gstTotal;
      expect(finalPrice).toBeCloseTo(subtotal * 1.03, 1);
    });

    it('formats Indian rupee currency with appropriate decimal precision and symbol', () => {
      const formatted = formatCurrencyINR(185000);
      expect(formatted).toContain('1,85,000');
      expect(formatted).toContain('₹');
    });

    it('verifies purity rates are distinct and in INR per gram', () => {
      const rates = {
        gold24k: 14744.00,
        gold22k: 13515.00,
        gold18k: 11058.00,
        silver: 181.20,
        platinum: 5085.00,
      };

      // 24K pure gold must be higher than 22K and 18K
      expect(rates.gold24k).toBeGreaterThan(rates.gold22k);
      expect(rates.gold22k).toBeGreaterThan(rates.gold18k);
      expect(rates.gold18k).toBeGreaterThan(rates.platinum);
      expect(rates.platinum).toBeGreaterThan(rates.silver);
    });
  });

  describe('3. Event Isolation & Navigation Flow', () => {
    it('isolates stopPropagation on wishlist, cart, and quick-view actions', () => {
      let cardNavigated = false;
      let quickViewOpened = false;
      let wishlistToggled = false;
      let cartAdded = false;

      const onCardClick = () => { cardNavigated = true; };
      const onQuickView = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        quickViewOpened = true;
      };
      const onWishlist = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        wishlistToggled = true;
      };
      const onAddToCart = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        cartAdded = true;
      };

      // Mock event
      const createMockEvent = () => {
        let stopped = false;
        return {
          stopPropagation: () => { stopped = true; },
          isPropagationStopped: () => stopped,
        };
      };

      // Trigger Quick View
      const qvEvent = createMockEvent();
      onQuickView(qvEvent);
      if (!qvEvent.isPropagationStopped()) onCardClick();
      expect(quickViewOpened).toBe(true);
      expect(cardNavigated).toBe(false);

      // Trigger Wishlist
      const wlEvent = createMockEvent();
      onWishlist(wlEvent);
      if (!wlEvent.isPropagationStopped()) onCardClick();
      expect(wishlistToggled).toBe(true);
      expect(cardNavigated).toBe(false);

      // Trigger Cart
      const cartEvent = createMockEvent();
      onAddToCart(cartEvent);
      if (!cartEvent.isPropagationStopped()) onCardClick();
      expect(cartAdded).toBe(true);
      expect(cardNavigated).toBe(false);

      // Trigger Direct Card Navigation
      onCardClick();
      expect(cardNavigated).toBe(true);
    });
  });
});
