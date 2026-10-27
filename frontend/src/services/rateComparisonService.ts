export interface ComparisonSource {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl: string;
  integrationMethod: 'manual_entry' | 'authorized_feed' | 'api';
  syncSchedule: string;
  isEnabled: boolean;
  lastSyncAt: string | null;
  status: 'healthy' | 'warning' | 'error';
  verifiedProductCount: number;
  totalProductCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RetailerProductListing {
  id: string;
  sourceId: string;
  sourceName: string;
  externalProductId: string;
  productUrl: string;
  name: string;
  category: string;
  metalType: 'gold' | 'silver' | 'platinum';
  purity: '24K' | '22K' | '18K' | '14K' | '925' | 'Pt950';
  grossWeight: number;
  netMetalWeight: number;
  stoneWeight?: number;
  stoneDescription?: string;
  baseMetalValue: number;
  makingChargesMethod: 'percentage' | 'per_gram' | 'fixed';
  makingChargesValue: number;
  calculatedMakingCharges: number;
  stoneCharges: number;
  wastagePercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  deliveryCharges: number;
  finalPrice: number;
  imageUrl: string;
  inStock: boolean;
  lastVerifiedAt: string;
  confidenceStatus: 'verified' | 'pending_review' | 'estimated';
  specDifferences?: string[];
}

export interface ProductMatch {
  id: string;
  yazhiniProductId: string;
  yazhiniProductName: string;
  yazhiniProductSku: string;
  yazhiniCategory: string;
  yazhiniMetalType: 'gold' | 'silver' | 'platinum';
  yazhiniPurity: string;
  yazhiniNetWeight: number;
  yazhiniGrossWeight: number;
  yazhiniMakingCharges: number;
  yazhiniPrice: number;
  yazhiniImageUrl: string;
  matchedRetailerListing: RetailerProductListing;
  matchConfidenceScore: number;
  matchedAttributes: string[];
  matchStatus: 'approved' | 'pending' | 'rejected';
  priceDifference: number; // yazhiniPrice - retailerPrice
  weightDifference: number; // yazhiniNetWeight - retailerNetWeight
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface ComparisonFilterOptions {
  category?: string;
  metal?: string;
  purity?: string;
  retailer?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: 'approved' | 'pending' | 'rejected' | 'all';
}

export interface PriceCalculatorInputs {
  netWeight: number;
  ratePerGram: number;
  purity: string;
  makingChargesMethod: 'percentage' | 'per_gram' | 'fixed';
  makingChargesValue: number;
  stoneValue: number;
  wastagePercent: number;
  discountAmount: number;
  deliveryCharges: number;
}

export interface PriceCalculatorResult {
  inputs: PriceCalculatorInputs;
  breakdown: {
    metalValue: number;
    wastageValue: number;
    calculatedMakingCharges: number;
    stoneValue: number;
    rawSubtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    totalGst: number;
    gstPercent: number;
    deliveryCharges: number;
    finalPayable: number;
  };
  timestamp: string;
  disclaimer: string;
}

export interface ComparisonSyncLog {
  id: string;
  sourceId: string;
  sourceName: string;
  syncType: string;
  status: 'success' | 'failed' | 'partial';
  itemsProcessed: number;
  itemsUpdated: number;
  errorMessage?: string;
  durationMs: number;
  createdAt: string;
}

const API_BASE = '/api';

export class RateComparisonService {
  /**
   * Fetch approved product comparisons for customer page
   */
  static async getProductComparisons(filters: ComparisonFilterOptions = {}): Promise<{
    matches: ProductMatch[];
    sources: ComparisonSource[];
    count: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters.metal && filters.metal !== 'all') params.set('metal', filters.metal);
      if (filters.purity && filters.purity !== 'ALL') params.set('purity', filters.purity);
      if (filters.retailer && filters.retailer !== 'all') params.set('retailer', filters.retailer);
      if (filters.search) params.set('search', filters.search);
      if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`${API_BASE}/jewellery-comparisons?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch comparisons: HTTP ${res.status}`);
      }
      const data = await res.json();
      return {
        matches: data.data || [],
        sources: data.sources || [],
        count: data.count || 0
      };
    } catch (err) {
      console.warn('[RateComparisonService] API request failed, falling back to local dataset:', err);
      return {
        matches: [],
        sources: [],
        count: 0
      };
    }
  }

  /**
   * Calculate transparent jewellery price breakdown
   */
  static async calculatePriceBreakdown(inputs: Partial<PriceCalculatorInputs>): Promise<PriceCalculatorResult> {
    const netWeight = Math.max(0, inputs.netWeight || 0);
    const ratePerGram = Math.max(0, inputs.ratePerGram || 6824);
    const purity = inputs.purity || '22K';
    const makingChargesMethod = inputs.makingChargesMethod || 'percentage';
    const makingChargesValue = Math.max(0, inputs.makingChargesValue || 12);
    const stoneValue = Math.max(0, inputs.stoneValue || 0);
    const wastagePercent = Math.max(0, inputs.wastagePercent || 0);
    const discountAmount = Math.max(0, inputs.discountAmount || 0);
    const deliveryCharges = Math.max(0, inputs.deliveryCharges || 0);

    try {
      const res = await fetch(`${API_BASE}/jewellery-comparisons/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          netWeight,
          ratePerGram,
          purity,
          makingChargesMethod,
          makingChargesValue,
          stoneValue,
          wastagePercent,
          discountAmount,
          deliveryCharges
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.calculation) {
          return json.calculation;
        }
      }
    } catch (err) {
      console.warn('[RateComparisonService] Backend calculation offline, computing client-side:', err);
    }

    // Client-side deterministic calculation matching server rules
    const metalValue = Math.round(netWeight * ratePerGram);
    const wastageValue = Math.round(metalValue * (wastagePercent / 100));

    let calculatedMakingCharges = 0;
    if (makingChargesMethod === 'percentage') {
      calculatedMakingCharges = Math.round(metalValue * (makingChargesValue / 100));
    } else if (makingChargesMethod === 'per_gram') {
      calculatedMakingCharges = Math.round(netWeight * makingChargesValue);
    } else {
      calculatedMakingCharges = Math.round(makingChargesValue);
    }

    const rawSubtotal = metalValue + wastageValue + calculatedMakingCharges + stoneValue;
    const taxableAmount = Math.max(0, rawSubtotal - discountAmount);
    const cgst = Math.round(taxableAmount * 0.015);
    const sgst = Math.round(taxableAmount * 0.015);
    const totalGst = cgst + sgst;
    const finalPayable = taxableAmount + totalGst + deliveryCharges;

    return {
      inputs: {
        netWeight,
        ratePerGram,
        purity,
        makingChargesMethod,
        makingChargesValue,
        stoneValue,
        wastagePercent,
        discountAmount,
        deliveryCharges
      },
      breakdown: {
        metalValue,
        wastageValue,
        calculatedMakingCharges,
        stoneValue,
        rawSubtotal,
        discountAmount,
        taxableAmount,
        cgst,
        sgst,
        totalGst,
        gstPercent: 3.0,
        deliveryCharges,
        finalPayable
      },
      timestamp: new Date().toISOString(),
      disclaimer: 'Calculated quotation estimate based on prevailing precious metal benchmarks. Showroom invoice will reflect live rates at moment of billing.'
    };
  }

  /**
   * Save customer comparison selection
   */
  static async saveComparison(productIds: string[], name?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/jewellery-comparisons/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, name })
      });
      return res.ok;
    } catch {
      // Local fallback
      try {
        if (typeof localStorage !== 'undefined') {
          const key = 'yazhini_saved_comparisons';
          const saved = JSON.parse(localStorage.getItem(key) || '[]');
          saved.unshift({ id: `saved-${Date.now()}`, productIds, name, createdAt: new Date().toISOString() });
          localStorage.setItem(key, JSON.stringify(saved.slice(0, 10)));
          return true;
        }
      } catch {}
      return false;
    }
  }

  /**
   * Admin: Fetch sources & overview metrics
   */
  static async getAdminSources(): Promise<{
    sources: ComparisonSource[];
    stats: {
      totalSources: number;
      activeSources: number;
      totalMatches: number;
      pendingReviewCount: number;
      approvedMatchesCount: number;
    };
  }> {
    try {
      const res = await fetch(`${API_BASE}/admin/comparison-sources`);
      if (res.ok) {
        const data = await res.json();
        return {
          sources: data.sources || [],
          stats: data.stats || {
            totalSources: 0,
            activeSources: 0,
            totalMatches: 0,
            pendingReviewCount: 0,
            approvedMatchesCount: 0
          }
        };
      }
    } catch (err) {
      console.warn('[RateComparisonService] Failed to load admin sources:', err);
    }
    return {
      sources: [],
      stats: { totalSources: 0, activeSources: 0, totalMatches: 0, pendingReviewCount: 0, approvedMatchesCount: 0 }
    };
  }

  /**
   * Admin: Add new comparison source
   */
  static async createSource(payload: {
    name: string;
    websiteUrl: string;
    integrationMethod: string;
    syncSchedule: string;
  }): Promise<ComparisonSource | null> {
    try {
      const res = await fetch(`${API_BASE}/admin/comparison-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.source;
      }
    } catch (err) {
      console.error('[RateComparisonService] Create source failed:', err);
    }
    return null;
  }

  /**
   * Admin: Update source configuration (e.g. toggle enabled)
   */
  static async updateSource(id: string, patch: Partial<ComparisonSource>): Promise<ComparisonSource | null> {
    try {
      const res = await fetch(`${API_BASE}/admin/comparison-sources/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        const data = await res.json();
        return data.source;
      }
    } catch (err) {
      console.error('[RateComparisonService] Update source failed:', err);
    }
    return null;
  }

  /**
   * Admin: Trigger source synchronization
   */
  static async triggerSourceSync(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/comparison-sources/${encodeURIComponent(id)}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Admin: Fetch sync audit logs
   */
  static async getSyncLogs(): Promise<ComparisonSyncLog[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/comparison-sync-logs`);
      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch {}
    return [];
  }

  /**
   * Admin: Review and approve/reject a product match
   */
  static async reviewProductMatch(
    matchId: string,
    status: 'approved' | 'rejected' | 'pending',
    reviewNotes: string,
    reviewedBy = 'Staff Evaluator'
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/product-matches/${encodeURIComponent(matchId)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes, reviewedBy })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
