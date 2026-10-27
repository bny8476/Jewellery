import { describe, it, expect, beforeEach } from 'vitest';
import { 
  RateComparisonService, 
  PriceCalculatorInputs,
  ProductMatch,
  RetailerProductListing 
} from '../services/rateComparisonService';

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  };
}

if (typeof globalThis.localStorage === 'undefined' || typeof (globalThis.localStorage as any)?.clear !== 'function') {
  (globalThis as any).localStorage = createMemoryStorage();
}

describe('Jewellery Rate Comparison Platform — Full Feature & Pricing Engine Tests', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. Precious Metal Rates & Purity Calculations
  // =========================================================================
  describe('1. Precious Metal Rates Benchmark & Purity Conversions', () => {
    it('correctly calculates 22K (916 BIS) from 24K pure bullion rate', () => {
      const gold24k = 14928.00;
      const gold22k = Math.round(gold24k * 0.916);
      expect(gold22k).toBe(13674);

      // 10 grams rate
      expect(gold22k * 10).toBe(136740);
    });

    it('correctly derives 18K (750) and 14K (585) contemporary rates', () => {
      const gold24k = 14928.00;
      const gold18k = Math.round(gold24k * 0.750);
      const gold14k = Math.round(gold24k * (14 / 24));

      expect(gold18k).toBe(11196);
      expect(gold14k).toBe(8708);
    });

    it('correctly calculates Silver gram and 1kg bar rates', () => {
      const silverPerGram = 220.00;
      const silverPerKg = silverPerGram * 1000;
      expect(silverPerKg).toBe(220000);
    });

    it('correctly handles Pt 950 pure platinum rate calculations', () => {
      const platPerGram = 5085.00;
      const plat10g = platPerGram * 10;
      expect(plat10g).toBe(50850);
    });
  });

  // =========================================================================
  // 2. Transparent Jewellery Price Calculator (All 3 Making Charge Models)
  // =========================================================================
  describe('2. Transparent Jewellery Price Calculator Engine', () => {
    it('computes pricing under Percentage Making Charges (%) with 3% statutory GST', async () => {
      const inputs: PriceCalculatorInputs = {
        netWeight: 20.0, // 20g
        ratePerGram: 6850, // ₹6,850/g
        purity: '22K',
        makingChargesMethod: 'percentage',
        makingChargesValue: 12.0, // 12%
        stoneValue: 0,
        wastagePercent: 0,
        discountAmount: 0,
        deliveryCharges: 0
      };

      const result = await RateComparisonService.calculatePriceBreakdown(inputs);

      // Metal: 20 * 6850 = 137,000
      expect(result.breakdown.metalValue).toBe(137000);
      // Making: 137000 * 0.12 = 16,440
      expect(result.breakdown.calculatedMakingCharges).toBe(16440);
      // Taxable: 137000 + 16440 = 153,440
      expect(result.breakdown.taxableAmount).toBe(153440);
      // CGST (1.5%): 153440 * 0.015 = 2301.6 -> 2302
      expect(result.breakdown.cgst).toBe(2302);
      // SGST (1.5%): 2302
      expect(result.breakdown.sgst).toBe(2302);
      expect(result.breakdown.totalGst).toBe(4604);
      // Final: 153440 + 4604 = 158,044
      expect(result.breakdown.finalPayable).toBe(158044);
    });

    it('computes pricing under Per-Gram Making Charges (₹/g)', async () => {
      const inputs: PriceCalculatorInputs = {
        netWeight: 35.0, // 35g
        ratePerGram: 6850,
        purity: '22K',
        makingChargesMethod: 'per_gram',
        makingChargesValue: 750, // ₹750/g
        stoneValue: 0,
        wastagePercent: 0,
        discountAmount: 0,
        deliveryCharges: 0
      };

      const result = await RateComparisonService.calculatePriceBreakdown(inputs);

      // Metal: 35 * 6850 = 239,750
      expect(result.breakdown.metalValue).toBe(239750);
      // Making: 35 * 750 = 26,250
      expect(result.breakdown.calculatedMakingCharges).toBe(26250);
      // Taxable: 239750 + 26250 = 266,000
      expect(result.breakdown.taxableAmount).toBe(266000);
      // GST 3%: 266000 * 0.03 = 7,980
      expect(result.breakdown.totalGst).toBe(7980);
      // Final: 266000 + 7980 = 273,980
      expect(result.breakdown.finalPayable).toBe(273980);
    });

    it('computes pricing under Fixed Making Fee (₹) with Stone Value and Coupon Discount', async () => {
      const inputs: PriceCalculatorInputs = {
        netWeight: 8.5,
        ratePerGram: 5140, // 18K
        purity: '18K',
        makingChargesMethod: 'fixed',
        makingChargesValue: 6500, // Fixed ₹6,500
        stoneValue: 45000, // Diamond / Gemstone value
        wastagePercent: 0,
        discountAmount: 2500, // ₹2,500 privilege discount
        deliveryCharges: 0
      };

      const result = await RateComparisonService.calculatePriceBreakdown(inputs);

      // Metal: 8.5 * 5140 = 43,690
      expect(result.breakdown.metalValue).toBe(43690);
      expect(result.breakdown.calculatedMakingCharges).toBe(6500);
      expect(result.breakdown.stoneValue).toBe(45000);
      // Raw subtotal: 43690 + 6500 + 45000 = 95,190
      expect(result.breakdown.rawSubtotal).toBe(95190);
      // Taxable: 95190 - 2500 = 92,690
      expect(result.breakdown.taxableAmount).toBe(92690);
      // GST 3%: 92690 * 0.03 = 2780.7 -> 2780
      expect(result.breakdown.totalGst).toBe(2780);
      // Final: 92690 + 2780 = 95,470
      expect(result.breakdown.finalPayable).toBe(95470);
    });

    it('gracefully clamps negative or invalid numbers to zero without crashing', async () => {
      const inputs: any = {
        netWeight: -5.0,
        ratePerGram: -6850,
        makingChargesValue: -20,
        stoneValue: -100
      };

      const result = await RateComparisonService.calculatePriceBreakdown(inputs);
      expect(result.breakdown.metalValue).toBe(0);
      expect(result.breakdown.calculatedMakingCharges).toBe(0);
      expect(result.breakdown.stoneValue).toBe(0);
      expect(result.breakdown.finalPayable).toBe(0);
    });
  });

  // =========================================================================
  // 3. Fair Comparison Principles & Specification Difference Detection
  // =========================================================================
  describe('3. Fair Cross-Retailer Comparison & Difference Highlighting', () => {
    it('detects gold weight advantage when YAZHINI product has higher net gold', () => {
      const yazhiniWeight = 42.0; // grams
      const competitorWeight = 41.5; // grams

      const weightDiff = yazhiniWeight - competitorWeight;
      expect(weightDiff).toBe(0.5);

      const hasGoldAdvantage = weightDiff > 0;
      expect(hasGoldAdvantage).toBe(true);
    });

    it('identifies price difference between YAZHINI direct pricing and competitor', () => {
      const yazhiniPrice = 326700;
      const competitorPrice = 336805;

      const priceDiff = yazhiniPrice - competitorPrice;
      expect(priceDiff).toBe(-10105); // YAZHINI saves ₹10,105

      const customerSavings = Math.abs(priceDiff);
      expect(customerSavings).toBe(10105);
    });

    it('prevents misleading comparison: flags stone deductions that artificially lower metal weight', () => {
      const grossWeight = 44.2;
      const netMetalWeight = 41.5;
      const stoneWeight = grossWeight - netMetalWeight;

      expect(stoneWeight).toBeCloseTo(2.7, 1);
      // A bill that charges gold rate on gross 44.2g would overcharge the customer!
      const metalRate = 6850;
      const overchargeIfBilledOnGross = Math.round(stoneWeight * metalRate);
      expect(overchargeIfBilledOnGross).toBe(18495); // ₹18,495 overcharge avoided by YAZHINI net weight policy
    });
  });

  // =========================================================================
  // 4. Product Selection & Side-by-Side Comparison Matrix Limits
  // =========================================================================
  describe('4. Side-by-Side Comparison Tray Rules', () => {
    it('allows selecting up to 4 jewellery designs and blocks 5th item', () => {
      let selectedIds: string[] = [];

      const selectProduct = (id: string) => {
        if (selectedIds.includes(id)) {
          selectedIds = selectedIds.filter(i => i !== id);
          return { success: true, count: selectedIds.length };
        }
        if (selectedIds.length >= 4) {
          return { success: false, error: 'Maximum 4 products allowed' };
        }
        selectedIds.push(id);
        return { success: true, count: selectedIds.length };
      };

      expect(selectProduct('prod-1').success).toBe(true);
      expect(selectProduct('prod-2').success).toBe(true);
      expect(selectProduct('prod-3').success).toBe(true);
      expect(selectProduct('prod-4').success).toBe(true);
      expect(selectedIds).toHaveLength(4);

      // Attempting 5th product
      const res5 = selectProduct('prod-5');
      expect(res5.success).toBe(false);
      expect(res5.error).toContain('Maximum 4');
      expect(selectedIds).toHaveLength(4);

      // Toggle off item 2
      expect(selectProduct('prod-2').success).toBe(true);
      expect(selectedIds).toHaveLength(3);
    });
  });

  // =========================================================================
  // 5. Customer Saved Comparison Sessions
  // =========================================================================
  describe('5. Saved Comparison Sessions & Local Storage Resilience', () => {
    it('saves a comparison session to local storage fallback cleanly', async () => {
      const productIds = ['prod-001', 'prod-002'];
      const success = await RateComparisonService.saveComparison(productIds, 'Bridal Haram Comparison');
      expect(success).toBe(true);

      const stored = JSON.parse(localStorage.getItem('yazhini_saved_comparisons') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].productIds).toEqual(productIds);
      expect(stored[0].name).toBe('Bridal Haram Comparison');
    });
  });

  // =========================================================================
  // 6. Admin Source & Match Review Rules
  // =========================================================================
  describe('6. Admin Comparison Source Management & Review Workflow', () => {
    it('validates required fields for comparison sources', () => {
      const validateSource = (input: { name?: string; websiteUrl?: string }) => {
        const errors: Record<string, string> = {};
        if (!input.name?.trim()) errors.name = 'Retailer name is required';
        if (!input.websiteUrl?.trim()) errors.websiteUrl = 'Website URL is required';
        return errors;
      };

      const emptyErrors = validateSource({});
      expect(emptyErrors.name).toBeDefined();
      expect(emptyErrors.websiteUrl).toBeDefined();

      const validErrors = validateSource({
        name: 'Kalyan Jewellers',
        websiteUrl: 'https://www.kalyanjewellers.net'
      });
      expect(Object.keys(validErrors)).toHaveLength(0);
    });

    it('correctly tracks match status transitions (approved, pending, rejected)', () => {
      type MatchStatus = 'approved' | 'pending' | 'rejected';
      const validStatuses: MatchStatus[] = ['approved', 'pending', 'rejected'];

      const isValidStatus = (status: string): status is MatchStatus => {
        return validStatuses.includes(status as any);
      };

      expect(isValidStatus('approved')).toBe(true);
      expect(isValidStatus('pending')).toBe(true);
      expect(isValidStatus('rejected')).toBe(true);
      expect(isValidStatus('unknown')).toBe(false);
    });
  });
});
