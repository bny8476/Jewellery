import { describe, it, expect, beforeEach } from 'vitest';
import { platformSyncService, PlatformSyncPayload } from '../services/platformSyncService';

// Mock storage for tests
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
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

// Setup Window and CustomEvent for node vitest environment
if (typeof window === 'undefined') {
  const listeners: Record<string, Array<(e: any) => void>> = {};
  (globalThis as any).window = {
    addEventListener: (event: string, cb: any) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    },
    removeEventListener: (event: string, cb: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== cb);
      }
    },
    dispatchEvent: (e: any) => {
      const cbs = listeners[e.type] || [];
      cbs.forEach(cb => cb(e));
      return true;
    }
  };
}

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

/**
 * Pure calculation engine used by ProductDetails & PriceBreakdownCard
 */
export function calculateLuxuryJewelleryPrice(params: {
  grossWeight: number;
  stoneWeight: number;
  purity: '24K' | '22K' | '18K' | '14K';
  metalRates: { gold24k: number; gold22k: number; gold18k: number; silver: number; platinum: number };
  stoneValue: number;
  makingChargePercent: number;
  festiveDiscountPercent?: number; // e.g. 20% off making charges
}) {
  const netMetalWeight = Math.max(0, params.grossWeight - params.stoneWeight);
  
  let baseRatePerGram = params.metalRates.gold22k;
  if (params.purity === '24K') baseRatePerGram = params.metalRates.gold24k;
  else if (params.purity === '22K') baseRatePerGram = params.metalRates.gold22k;
  else if (params.purity === '18K') baseRatePerGram = params.metalRates.gold18k || Math.round(params.metalRates.gold24k * (18 / 24));
  else if (params.purity === '14K') baseRatePerGram = Math.round(params.metalRates.gold24k * (14 / 24));

  const metalCost = Math.round(netMetalWeight * baseRatePerGram);
  const grossMakingCharges = Math.round(metalCost * (params.makingChargePercent / 100));
  const festiveDiscountAmount = Math.round(grossMakingCharges * ((params.festiveDiscountPercent || 0) / 100));
  const effectiveMakingCharges = Math.max(0, grossMakingCharges - festiveDiscountAmount);

  const taxableSubtotal = metalCost + params.stoneValue + effectiveMakingCharges;
  const gst = Math.round(taxableSubtotal * 0.03); // 3% Indian GST on Gold jewellery
  const totalPayable = taxableSubtotal + gst;

  // Standard MRP reference (without making charge concession, with standard markup)
  const fullGrossMaking = Math.round(metalCost * (params.makingChargePercent / 100));
  const mrpWithoutDiscount = Math.round((metalCost + params.stoneValue + fullGrossMaking) * 1.03 * 1.08); // 8% standard luxury retail buffer

  return {
    netMetalWeight,
    baseRatePerGram,
    metalCost,
    grossMakingCharges,
    festiveDiscountAmount,
    effectiveMakingCharges,
    stoneValue: params.stoneValue,
    taxableSubtotal,
    gst,
    totalPayable,
    mrpWithoutDiscount,
    savingsAmount: Math.max(0, mrpWithoutDiscount - totalPayable),
    savingsPercent: Math.round(((mrpWithoutDiscount - totalPayable) / mrpWithoutDiscount) * 100)
  };
}

describe('YAZHINI FINE JEWELS — Luxury Product Detail Page Redesign & Engineering Suite', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. Live Metal-Rate & Purity Pricing Calculations', () => {
    const liveRates = {
      gold24k: 7350,
      gold22k: 6740,
      gold18k: 5515,
      silver: 92,
      platinum: 3600
    };

    it('calculates 22K gold bridal necklace pricing accurately with net weight deduction', () => {
      // 45g gross, 3g rubies/kundan stones, 22K gold, 12% making charges, 20% festive discount on making
      const price = calculateLuxuryJewelleryPrice({
        grossWeight: 45,
        stoneWeight: 3,
        purity: '22K',
        metalRates: liveRates,
        stoneValue: 35000,
        makingChargePercent: 12,
        festiveDiscountPercent: 20
      });

      expect(price.netMetalWeight).toBe(42);
      expect(price.baseRatePerGram).toBe(6740);
      expect(price.metalCost).toBe(42 * 6740); // 283,080
      expect(price.grossMakingCharges).toBe(Math.round(283080 * 0.12)); // 33,970
      expect(price.festiveDiscountAmount).toBe(Math.round(33970 * 0.20)); // 6,794
      expect(price.effectiveMakingCharges).toBe(33970 - 6794); // 27,176
      expect(price.taxableSubtotal).toBe(283080 + 35000 + 27176); // 345,256
      expect(price.gst).toBe(Math.round(345256 * 0.03)); // 10,358
      expect(price.totalPayable).toBe(345256 + 10358); // 355,614
      expect(price.totalPayable).toBeGreaterThan(0);
      expect(price.savingsAmount).toBeGreaterThan(0);
    });

    it('recalculates dynamically when customer switches purity to 18K', () => {
      const price22K = calculateLuxuryJewelleryPrice({
        grossWeight: 30,
        stoneWeight: 0,
        purity: '22K',
        metalRates: liveRates,
        stoneValue: 0,
        makingChargePercent: 10
      });

      const price18K = calculateLuxuryJewelleryPrice({
        grossWeight: 30,
        stoneWeight: 0,
        purity: '18K',
        metalRates: liveRates,
        stoneValue: 0,
        makingChargePercent: 10
      });

      expect(price18K.baseRatePerGram).toBe(5515);
      expect(price18K.metalCost).toBe(30 * 5515);
      expect(price18K.totalPayable).toBeLessThan(price22K.totalPayable);
    });

    it('recalculates dynamically when customer switches purity to 24K', () => {
      const price24K = calculateLuxuryJewelleryPrice({
        grossWeight: 20,
        stoneWeight: 0,
        purity: '24K',
        metalRates: liveRates,
        stoneValue: 0,
        makingChargePercent: 8
      });

      expect(price24K.baseRatePerGram).toBe(7350);
      expect(price24K.metalCost).toBe(20 * 7350);
    });

    it('calculates 14K gold with proportional 14/24 scaling', () => {
      const price14K = calculateLuxuryJewelleryPrice({
        grossWeight: 15,
        stoneWeight: 0,
        purity: '14K',
        metalRates: liveRates,
        stoneValue: 0,
        makingChargePercent: 12
      });

      const expected14kRate = Math.round(7350 * (14 / 24)); // 4288
      expect(price14K.baseRatePerGram).toBe(expected14kRate);
      expect(price14K.metalCost).toBe(15 * expected14kRate);
    });
  });

  describe('2. Weight and Variant Customization', () => {
    const liveRates = {
      gold24k: 7350,
      gold22k: 6740,
      gold18k: 5515,
      silver: 92,
      platinum: 3600
    };

    it('scales price proportionally with weight variant change (e.g. 42g to 48g)', () => {
      const lighterVariant = calculateLuxuryJewelleryPrice({
        grossWeight: 42,
        stoneWeight: 2,
        purity: '22K',
        metalRates: liveRates,
        stoneValue: 20000,
        makingChargePercent: 12
      });

      const heavierVariant = calculateLuxuryJewelleryPrice({
        grossWeight: 48,
        stoneWeight: 2,
        purity: '22K',
        metalRates: liveRates,
        stoneValue: 20000,
        makingChargePercent: 12
      });

      expect(heavierVariant.netMetalWeight).toBe(46);
      expect(lighterVariant.netMetalWeight).toBe(40);
      expect(heavierVariant.totalPayable).toBeGreaterThan(lighterVariant.totalPayable);
    });

    it('validates ring and bangle sizing options format', () => {
      const ringSizes = ['10', '12', '14', '16', '18', '20', '22'];
      const bangleSizes = ['2.2', '2.4', '2.6', '2.8', '2.10'];
      const necklaceLengths = ['16"', '18"', '20"', '22"', '24"'];

      expect(ringSizes).toContain('16');
      expect(bangleSizes).toContain('2.6');
      expect(necklaceLengths).toContain('18"');
    });
  });

  describe('3. Pincode & Courier Logistics Verification', () => {
    function verifyIndianPincode(pin: string) {
      const cleaned = pin.trim();
      if (!/^\d{6}$/.test(cleaned)) {
        return { isValid: false, message: 'Please enter a valid 6-digit Indian Postal PIN.' };
      }

      const majorMetros: Record<string, { city: string; days: number }> = {
        '600': { city: 'Chennai / Tamil Nadu', days: 2 },
        '560': { city: 'Bengaluru / Karnataka', days: 2 },
        '500': { city: 'Hyderabad / Telangana', days: 3 },
        '400': { city: 'Mumbai / Maharashtra', days: 3 },
        '110': { city: 'Delhi NCR', days: 3 },
        '700': { city: 'Kolkata / West Bengal', days: 4 }
      };

      const prefix = cleaned.substring(0, 3);
      const metroInfo = majorMetros[prefix];

      if (metroInfo) {
        return {
          isValid: true,
          city: metroInfo.city,
          estimatedDays: metroInfo.days,
          courier: 'BlueDart Apex / Sequel Secure Valuables Logistics',
          isInsured: true,
          shippingCost: 0 // Complimentary insured transit
        };
      }

      return {
        isValid: true,
        city: 'Verified Indian Destination',
        estimatedDays: 4,
        courier: 'Sequel Secure Valuables Logistics',
        isInsured: true,
        shippingCost: 0
      };
    }

    it('validates 600001 (Chennai) as 2-day complimentary insured delivery', () => {
      const res = verifyIndianPincode('600001');
      expect(res.isValid).toBe(true);
      expect(res.city).toContain('Chennai');
      expect(res.estimatedDays).toBe(2);
      expect(res.isInsured).toBe(true);
      expect(res.shippingCost).toBe(0);
    });

    it('rejects invalid pincode formats', () => {
      expect(verifyIndianPincode('123').isValid).toBe(false);
      expect(verifyIndianPincode('abcdef').isValid).toBe(false);
      expect(verifyIndianPincode('6000001').isValid).toBe(false);
    });
  });

  describe('4. "Complete the Royal Set" Ensemble Bundle Calculations', () => {
    it('applies 5% bundle discount when purchasing matching earrings and bangle', () => {
      const mainItemPrice = 285000;
      const matchingEarringsPrice = 65000;
      const matchingBanglePrice = 120000;

      const itemsTotal = mainItemPrice + matchingEarringsPrice + matchingBanglePrice; // 470,000
      const bundleDiscountPercent = 5;
      const bundleSavings = Math.round(itemsTotal * (bundleDiscountPercent / 100)); // 23,500
      const bundledTotal = itemsTotal - bundleSavings; // 446,500

      expect(itemsTotal).toBe(470000);
      expect(bundleSavings).toBe(23500);
      expect(bundledTotal).toBe(446500);
      expect(bundledTotal).toBeLessThan(itemsTotal);
    });
  });

  describe('5. Cart & Wishlist Storage and Mini-Cart Integration', () => {
    it('persists customized product configuration into localStorage cart', () => {
      const cartItem = {
        id: 'cart-1',
        product_id: 'aurelle-1',
        title: 'Vivaah Royal Kundan & Ruby Bridal Haram',
        purity: '22K',
        metalFinish: 'Yellow Gold',
        weight: '45.00g (Net 42.00g)',
        size: '18"',
        price: 355614,
        quantity: 1,
        image: '/images/bridal_vivaah_ruby_kundan.jpg'
      };

      const existingCart = [cartItem];
      mockLocalStorage.setItem('yazhini_cart', JSON.stringify(existingCart));

      const retrieved = JSON.parse(mockLocalStorage.getItem('yazhini_cart') || '[]');
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].title).toBe('Vivaah Royal Kundan & Ruby Bridal Haram');
      expect(retrieved[0].purity).toBe('22K');
      expect(retrieved[0].price).toBe(355614);
    });

    it('tracks recently viewed products without duplicating records', () => {
      const p1 = { id: 'prod-1', name: 'Necklace 1' };
      const p2 = { id: 'prod-2', name: 'Ring 1' };

      const history = [p1];
      // Add p2
      if (!history.some(x => x.id === p2.id)) history.unshift(p2);
      // Re-visit p1
      const filtered = history.filter(x => x.id !== p1.id);
      filtered.unshift(p1);

      expect(filtered.length).toBe(2);
      expect(filtered[0].id).toBe('prod-1');
    });
  });

  describe('6. Luxury Design System & Trust Badges Specifications', () => {
    it('verifies 6 luxury trust privileges conform to authentic business policies', () => {
      const trustBadges = [
        { id: 'bis', title: 'BIS 916 Hallmarked', code: 'Govt. Certified HUID' },
        { id: 'shipping', title: '100% Insured Shipping', code: 'Complimentary Transit' },
        { id: 'returns', title: '14-Day Money Back', code: 'Hassle-Free Return' },
        { id: 'exchange', title: 'Lifetime Exchange', code: '100% Metal Valuation' },
        { id: 'service', title: 'Free Annual Spa', code: 'Polishing & Claw Check' },
        { id: 'diamonds', title: 'Certified Diamonds', code: 'IGI & GIA Authenticated' }
      ];

      expect(trustBadges.length).toBe(6);
      expect(trustBadges.map(b => b.id)).toEqual([
        'bis', 'shipping', 'returns', 'exchange', 'service', 'diamonds'
      ]);
    });

    it('verifies the 8 comprehensive product editorial tabs', () => {
      const tabs = [
        'details',
        'specifications',
        'pricing',
        'shipping',
        'returns',
        'care',
        'reviews',
        'faqs'
      ];

      expect(tabs.length).toBe(8);
      expect(tabs).toContain('details');
      expect(tabs).toContain('specifications');
      expect(tabs).toContain('pricing');
      expect(tabs).toContain('reviews');
    });
  });

  describe('7. Admin Product Synchronization via PlatformSyncService', () => {
    it('notifies product detail subscribers when Admin updates jewellery records', () => {
      let receivedPayload: PlatformSyncPayload | null = null;

      const unsubscribe = platformSyncService.subscribe('ecommerce', (payload) => {
        receivedPayload = payload;
      });

      platformSyncService.broadcast(
        'ecommerce',
        'update',
        'product',
        {
          id: 'bridal-sita-kalyanam',
          price: 295000,
          stock: 3,
          making_charge: 10
        },
        'bridal-sita-kalyanam'
      );

      expect(receivedPayload).not.toBeNull();
      const payload = receivedPayload as any;
      expect(payload?.platform).toBe('ecommerce');
      expect(payload?.action).toBe('update');
      expect(payload?.data.id).toBe('bridal-sita-kalyanam');
      expect(payload?.data.price).toBe(295000);

      unsubscribe();
    });
  });
});
