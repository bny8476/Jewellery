export interface CampaignData {
  id: string;
  name: string;
  badge_label: string;
  heading: string;
  description: string;
  coupon_section_title: string;
  coupon_code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_value: number;
  max_discount: number;
  eligible_categories: string[];
  eligible_products: string[];
  cta_text: string;
  cta_link: string;
  secondary_text: string;
  trust_message: string;
  banner_url?: string;
  start_date: string;
  expiry_date: string;
  display_priority: number;
  status: 'active' | 'draft' | 'expired' | 'archived';
  target_audience: 'first_time_visitors' | 'all';
  analytics: {
    impressions: number;
    dismissals: number;
    coupon_copies: number;
    cta_clicks: number;
    conversions: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  success: boolean;
  coupon?: {
    code: string;
    campaignId?: string;
    discountAmount: number;
    description: string;
    minOrderValue: number;
    maxDiscount?: number;
  };
  error?: string;
}

const API_BASE = '/api';

export const campaignService = {
  // Fetch active campaign for homepage popup
  async getActiveCampaign(): Promise<CampaignData | null> {
    try {
      const res = await fetch(`${API_BASE}/campaigns/active`, {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.active && data.campaign) {
        return data.campaign;
      }
      return null;
    } catch (err) {
      console.warn('[CampaignService] Failed to fetch active campaign from backend:', err);
      // Fallback default campaign if offline
      return {
        id: 'festive-extravaganza-2026',
        name: 'Festive Extravaganza Offer',
        badge_label: 'LIMITED FESTIVE OFFER',
        heading: 'FESTIVE EXTRAVAGANZA',
        description: 'Celebrate timeless heritage with Flat 20% OFF on Making Charges on all eligible BIS 916 Gold & Diamond Jewellery.',
        coupon_section_title: 'EXCLUSIVE PROMOTIONAL COUPON',
        coupon_code: 'ROYAL20',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_value: 5000,
        max_discount: 15000,
        eligible_categories: ['All', 'Gold', 'Diamond', 'Bridal', 'Necklaces', 'Bangles', 'Rings', 'Earrings'],
        eligible_products: [],
        cta_text: 'SHOP ELIGIBLE COLLECTION',
        cta_link: '/#catalog?filter=festive',
        secondary_text: 'LATER',
        trust_message: '100% BIS Hallmarked Purity • RBI Approved Registered Pawn Services',
        banner_url: '/images/concierge_luxury_jewellery_bg.jpg',
        start_date: '2026-01-01T00:00:00.000Z',
        expiry_date: '2027-12-31T23:59:59.000Z',
        display_priority: 100,
        status: 'active',
        target_audience: 'first_time_visitors',
        analytics: {
          impressions: 142,
          dismissals: 19,
          coupon_copies: 58,
          cta_clicks: 43,
          conversions: 14
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },

  // Fetch all campaigns for Admin portal
  async getAllCampaigns(): Promise<CampaignData[]> {
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data = await res.json();
      return data.campaigns || [];
    } catch (err) {
      console.warn('[CampaignService] Using local fallback campaigns:', err);
      return [];
    }
  },

  // Create campaign
  async createCampaign(campaign: Partial<CampaignData>): Promise<CampaignData> {
    const res = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create campaign');
    }
    const data = await res.json();
    return data.campaign;
  },

  // Update campaign
  async updateCampaign(id: string, updates: Partial<CampaignData>): Promise<CampaignData> {
    const res = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update campaign');
    }
    const data = await res.json();
    return data.campaign;
  },

  // Delete campaign
  async deleteCampaign(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/campaigns/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete campaign');
    }
    return true;
  },

  // Record analytics events (impression, dismiss, copy_code, cta_click, conversion)
  async recordAnalytics(
    campaignId: string,
    event: 'impression' | 'dismiss' | 'copy_code' | 'cta_click' | 'conversion'
  ): Promise<void> {
    try {
      await fetch(`${API_BASE}/campaigns/${campaignId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      });
    } catch (err) {
      console.debug('[CampaignService] Analytics event logging failed (non-blocking):', err);
    }
  },

  // Server-side coupon validation
  async validateCouponServer(
    code: string,
    subtotal: number,
    category = 'All'
  ): Promise<CouponValidationResult> {
    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, category })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid promotional coupon' };
      }
      return data;
    } catch (err: any) {
      console.warn('[CampaignService] Server coupon validation failed, fallback to local:', err);
      return { success: false, error: 'Could not reach server to validate coupon' };
    }
  }
};
