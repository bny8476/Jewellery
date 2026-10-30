import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { memoryStore } from '../db.ts';

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

const CAMPAIGNS_FILE_PATH = process.cwd().endsWith('backend')
  ? path.resolve(process.cwd(), 'src', 'data', 'campaigns.json')
  : path.resolve(process.cwd(), 'backend', 'src', 'data', 'campaigns.json');

// Default initial campaign matching Festive Extravaganza specification
const DEFAULT_CAMPAIGNS: CampaignData[] = [
  {
    id: 'festive-extravaganza-2026',
    name: 'Festive Extravaganza Offer',
    badge_label: 'LIMITED FESTIVE OFFER',
    heading: 'FESTIVE EXTRAVAGANZA',
    description: 'Celebrate timeless heritage with Flat 20% OFF on Making Charges on all eligible BIS 916 Gold & Diamond Jewellery.',
    coupon_section_title: 'EXCLUSIVE PROMOTIONAL COUPON',
    coupon_code: 'ROYAL20',
    discount_type: 'percentage',
    discount_value: 20, // 20% off making charges (equivalent to 5% overall order discount)
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
  }
];

function loadCampaignsFromStorage(): CampaignData[] {
  try {
    if (fs.existsSync(CAMPAIGNS_FILE_PATH)) {
      const data = fs.readFileSync(CAMPAIGNS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Campaigns] Failed to read campaigns from disk, using defaults:', err);
  }
  return [...DEFAULT_CAMPAIGNS];
}

function saveCampaignsToStorage(campaigns: CampaignData[]): void {
  try {
    const dir = path.dirname(CAMPAIGNS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CAMPAIGNS_FILE_PATH, JSON.stringify(campaigns, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Campaigns] Failed to save campaigns to disk:', err);
  }
  // Keep memoryStore updated as well
  memoryStore.promotional_campaigns = campaigns;
}

// In-memory runtime cache initialized from disk or defaults
let runtimeCampaigns: CampaignData[] = loadCampaignsFromStorage();
memoryStore.promotional_campaigns = runtimeCampaigns;

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleCampaignsRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> {
  // 1. GET /api/campaigns/active - Returns highest-priority active campaign for first-time homepage popup
  if (pathname === '/api/campaigns/active' && req.method === 'GET') {
    const now = new Date();
    const activeCampaigns = runtimeCampaigns
      .filter((c) => {
        if (c.status !== 'active') return false;
        const start = new Date(c.start_date);
        const expiry = new Date(c.expiry_date);
        return now >= start && now <= expiry;
      })
      .sort((a, b) => b.display_priority - a.display_priority);

    if (activeCampaigns.length === 0) {
      sendJson(res, 200, {
        active: false,
        message: 'No active promotional campaigns currently configured'
      });
      return true;
    }

    const campaign = activeCampaigns[0];
    sendJson(res, 200, {
      active: true,
      campaign
    });
    return true;
  }

  // 2. GET /api/campaigns - List all campaigns (Admin view)
  if (pathname === '/api/campaigns' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      campaigns: runtimeCampaigns
    });
    return true;
  }

  // 3. POST /api/campaigns - Create a new campaign (Admin)
  if (pathname === '/api/campaigns' && req.method === 'POST') {
    try {
      const body = (req as any).body || {};
      const newCampaign: CampaignData = {
        id: body.id || `campaign-${crypto.randomUUID()}`,
        name: body.name || 'New Festive Campaign',
        badge_label: body.badge_label || 'LIMITED FESTIVE OFFER',
        heading: body.heading || 'FESTIVE EXTRAVAGANZA',
        description: body.description || 'Celebrate timeless heritage with special festive discounts.',
        coupon_section_title: body.coupon_section_title || 'EXCLUSIVE PROMOTIONAL COUPON',
        coupon_code: (body.coupon_code || 'ROYAL20').trim().toUpperCase(),
        discount_type: body.discount_type === 'flat' ? 'flat' : 'percentage',
        discount_value: Number(body.discount_value) || 20,
        min_order_value: Number(body.min_order_value) || 5000,
        max_discount: Number(body.max_discount) || 15000,
        eligible_categories: Array.isArray(body.eligible_categories) ? body.eligible_categories : ['All'],
        eligible_products: Array.isArray(body.eligible_products) ? body.eligible_products : [],
        cta_text: body.cta_text || 'SHOP ELIGIBLE COLLECTION',
        cta_link: body.cta_link || '/#catalog?filter=festive',
        secondary_text: body.secondary_text || 'LATER',
        trust_message: body.trust_message || '100% BIS Hallmarked Purity • Trusted Jewellery Services',
        banner_url: body.banner_url || '',
        start_date: body.start_date || new Date().toISOString(),
        expiry_date: body.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        display_priority: Number(body.display_priority) || 10,
        status: body.status || 'active',
        target_audience: body.target_audience || 'first_time_visitors',
        analytics: {
          impressions: 0,
          dismissals: 0,
          coupon_copies: 0,
          cta_clicks: 0,
          conversions: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      runtimeCampaigns.unshift(newCampaign);
      saveCampaignsToStorage(runtimeCampaigns);

      sendJson(res, 201, {
        success: true,
        campaign: newCampaign,
        message: 'Promotional campaign created successfully'
      });
      return true;
    } catch (err: any) {
      sendJson(res, 400, { success: false, error: err.message || 'Failed to create campaign' });
      return true;
    }
  }

  // 4. PUT /api/campaigns/:id - Update existing campaign (Admin)
  if (pathname.startsWith('/api/campaigns/') && req.method === 'PUT' && !pathname.endsWith('/analytics')) {
    const id = pathname.replace('/api/campaigns/', '').trim();
    const index = runtimeCampaigns.findIndex((c) => c.id === id);
    if (index === -1) {
      sendJson(res, 404, { success: false, error: 'Campaign not found' });
      return true;
    }

    try {
      const body = (req as any).body || {};
      const current = runtimeCampaigns[index];
      const updated: CampaignData = {
        ...current,
        name: body.name ?? current.name,
        badge_label: body.badge_label ?? current.badge_label,
        heading: body.heading ?? current.heading,
        description: body.description ?? current.description,
        coupon_section_title: body.coupon_section_title ?? current.coupon_section_title,
        coupon_code: body.coupon_code ? body.coupon_code.trim().toUpperCase() : current.coupon_code,
        discount_type: body.discount_type ?? current.discount_type,
        discount_value: body.discount_value !== undefined ? Number(body.discount_value) : current.discount_value,
        min_order_value: body.min_order_value !== undefined ? Number(body.min_order_value) : current.min_order_value,
        max_discount: body.max_discount !== undefined ? Number(body.max_discount) : current.max_discount,
        eligible_categories: body.eligible_categories ?? current.eligible_categories,
        eligible_products: body.eligible_products ?? current.eligible_products,
        cta_text: body.cta_text ?? current.cta_text,
        cta_link: body.cta_link ?? current.cta_link,
        secondary_text: body.secondary_text ?? current.secondary_text,
        trust_message: body.trust_message ?? current.trust_message,
        banner_url: body.banner_url !== undefined ? body.banner_url : current.banner_url,
        start_date: body.start_date ?? current.start_date,
        expiry_date: body.expiry_date ?? current.expiry_date,
        display_priority: body.display_priority !== undefined ? Number(body.display_priority) : current.display_priority,
        status: body.status ?? current.status,
        target_audience: body.target_audience ?? current.target_audience,
        updated_at: new Date().toISOString()
      };

      runtimeCampaigns[index] = updated;
      saveCampaignsToStorage(runtimeCampaigns);

      sendJson(res, 200, {
        success: true,
        campaign: updated,
        message: 'Campaign updated successfully'
      });
      return true;
    } catch (err: any) {
      sendJson(res, 400, { success: false, error: err.message || 'Failed to update campaign' });
      return true;
    }
  }

  // 5. DELETE /api/campaigns/:id - Delete campaign (Admin)
  if (pathname.startsWith('/api/campaigns/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/campaigns/', '').trim();
    const index = runtimeCampaigns.findIndex((c) => c.id === id);
    if (index === -1) {
      sendJson(res, 404, { success: false, error: 'Campaign not found' });
      return true;
    }

    runtimeCampaigns.splice(index, 1);
    saveCampaignsToStorage(runtimeCampaigns);

    sendJson(res, 200, {
      success: true,
      message: 'Campaign deleted successfully'
    });
    return true;
  }

  // 6. POST /api/campaigns/:id/analytics - Record analytics metrics
  if (pathname.startsWith('/api/campaigns/') && pathname.endsWith('/analytics') && req.method === 'POST') {
    const parts = pathname.split('/');
    // e.g. /api/campaigns/{id}/analytics -> parts[3] is id
    const id = parts[3];
    const campaign = runtimeCampaigns.find((c) => c.id === id);
    if (!campaign) {
      sendJson(res, 404, { success: false, error: 'Campaign not found' });
      return true;
    }

    const body = (req as any).body || {};
    const event = body.event as 'impression' | 'dismiss' | 'copy_code' | 'cta_click' | 'conversion';

    if (!campaign.analytics) {
      campaign.analytics = { impressions: 0, dismissals: 0, coupon_copies: 0, cta_clicks: 0, conversions: 0 };
    }

    switch (event) {
      case 'impression':
        campaign.analytics.impressions = (campaign.analytics.impressions || 0) + 1;
        break;
      case 'dismiss':
        campaign.analytics.dismissals = (campaign.analytics.dismissals || 0) + 1;
        break;
      case 'copy_code':
        campaign.analytics.coupon_copies = (campaign.analytics.coupon_copies || 0) + 1;
        break;
      case 'cta_click':
        campaign.analytics.cta_clicks = (campaign.analytics.cta_clicks || 0) + 1;
        break;
      case 'conversion':
        campaign.analytics.conversions = (campaign.analytics.conversions || 0) + 1;
        break;
    }

    campaign.updated_at = new Date().toISOString();
    saveCampaignsToStorage(runtimeCampaigns);

    sendJson(res, 200, {
      success: true,
      event,
      analytics: campaign.analytics
    });
    return true;
  }

  // 7. POST /api/coupons/validate - Server-Side Coupon Validation
  if (pathname === '/api/coupons/validate' && req.method === 'POST') {
    const body = (req as any).body || {};
    const rawCode = String(body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;
    const category = String(body.category || 'All').trim();

    if (!rawCode) {
      sendJson(res, 400, {
        success: false,
        error: 'Please enter a coupon code.'
      });
      return true;
    }

    const now = new Date();

    // First check dynamic active campaigns matching this coupon code
    const matchingCampaign = runtimeCampaigns.find((c) => {
      if (c.coupon_code.toUpperCase() !== rawCode) return false;
      if (c.status !== 'active') return false;
      const start = new Date(c.start_date);
      const expiry = new Date(c.expiry_date);
      return now >= start && now <= expiry;
    });

    if (matchingCampaign) {
      // Validate category eligibility
      if (
        category !== 'All' &&
        matchingCampaign.eligible_categories &&
        !matchingCampaign.eligible_categories.includes('All') &&
        !matchingCampaign.eligible_categories.some(cat => cat.toLowerCase() === category.toLowerCase())
      ) {
        sendJson(res, 400, {
          success: false,
          error: `Coupon "${rawCode}" is not applicable to items in category "${category}".`
        });
        return true;
      }

      // Check min order value
      if (subtotal < matchingCampaign.min_order_value) {
        sendJson(res, 400, {
          success: false,
          error: `Coupon "${rawCode}" requires a minimum order value of ₹${matchingCampaign.min_order_value.toLocaleString('en-IN')}.`
        });
        return true;
      }

      // Calculate discount
      let discount = 0;
      if (matchingCampaign.discount_type === 'flat') {
        discount = matchingCampaign.discount_value;
      } else {
        // Percentage: Flat 20% on Making Charges or 5% equivalent overall discount
        discount = Math.round((subtotal * 5) / 100);
        if (matchingCampaign.max_discount && discount > matchingCampaign.max_discount) {
          discount = matchingCampaign.max_discount;
        }
      }

      sendJson(res, 200, {
        success: true,
        coupon: {
          code: matchingCampaign.coupon_code,
          campaignId: matchingCampaign.id,
          discountAmount: discount,
          description: `${matchingCampaign.heading}: Flat 20% Off Making Charges (up to ₹${matchingCampaign.max_discount.toLocaleString('en-IN')})`,
          minOrderValue: matchingCampaign.min_order_value,
          maxDiscount: matchingCampaign.max_discount
        }
      });
      return true;
    }

    // Fallback: check static valid coupons
    const staticCoupons: Record<string, { type: 'percentage' | 'flat'; value: number; minOrderValue: number; maxDiscount?: number; description: string }> = {
      ROYAL20: {
        type: 'percentage',
        value: 5,
        minOrderValue: 5000,
        maxDiscount: 15000,
        description: 'Flat 20% Off Making Charges (up to ₹15,000)'
      },
      WELCOME500: {
        type: 'flat',
        value: 500,
        minOrderValue: 10000,
        description: 'Flat ₹500 Off for Valued Patrons'
      },
      FESTIVE1000: {
        type: 'flat',
        value: 1000,
        minOrderValue: 25000,
        description: 'Royal Festive Discount of ₹1,000'
      },
      EXCHANGE5: {
        type: 'percentage',
        value: 5,
        minOrderValue: 10000,
        maxDiscount: 20000,
        description: 'Special Old Gold Trade-in Privilege: Extra 5% Off (up to ₹20,000)'
      }
    };

    const def = staticCoupons[rawCode];
    if (!def) {
      sendJson(res, 400, {
        success: false,
        error: `Coupon code "${rawCode}" is invalid or expired.`
      });
      return true;
    }

    if (subtotal < def.minOrderValue) {
      sendJson(res, 400, {
        success: false,
        error: `Coupon "${rawCode}" requires a minimum order value of ₹${def.minOrderValue.toLocaleString('en-IN')}.`
      });
      return true;
    }

    let discount = 0;
    if (def.type === 'flat') {
      discount = def.value;
    } else {
      discount = Math.round((subtotal * def.value) / 100);
      if (def.maxDiscount && discount > def.maxDiscount) {
        discount = def.maxDiscount;
      }
    }

    sendJson(res, 200, {
      success: true,
      coupon: {
        code: rawCode,
        discountAmount: discount,
        description: def.description,
        minOrderValue: def.minOrderValue,
        maxDiscount: def.maxDiscount
      }
    });
    return true;
  }

  return false;
}
