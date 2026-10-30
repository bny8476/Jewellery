import { describe, it, expect } from 'vitest';
import { handleCampaignsRoutes } from './campaigns.ts';
import http from 'http';

function createMockReqRes(method: string, pathname: string, body: any = {}) {
  const req = {
    method,
    url: pathname,
    headers: { host: 'localhost:5001' },
    body
  } as unknown as http.IncomingMessage;

  let statusCode = 200;
  let responseData = '';
  const headers: Record<string, string> = {};

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    setHeader(key: string, val: string) {
      headers[key] = val;
    },
    end(data?: string) {
      if (data) responseData = data;
    }
  } as unknown as http.ServerResponse;

  return {
    req,
    res,
    getResponse: () => {
      try {
        return JSON.parse(responseData);
      } catch {
        return responseData;
      }
    },
    getStatusCode: () => statusCode
  };
}

describe('Backend Promotional Campaigns & Coupon API', () => {
  it('GET /api/campaigns/active returns active festive campaign matching specification', async () => {
    const { req, res, getResponse, getStatusCode } = createMockReqRes('GET', '/api/campaigns/active');

    const handled = await handleCampaignsRoutes(req, res, '/api/campaigns/active');
    expect(handled).toBe(true);
    expect(getStatusCode()).toBe(200);

    const data = getResponse();
    expect(data.active).toBe(true);
    expect(data.campaign.heading).toBe('FESTIVE EXTRAVAGANZA');
    expect(data.campaign.badge_label).toBe('LIMITED FESTIVE OFFER');
    expect(data.campaign.coupon_code).toBe('ROYAL20');
    expect(data.campaign.discount_value).toBe(20);
    expect(data.campaign.min_order_value).toBe(5000);
    expect(data.campaign.max_discount).toBe(15000);
    expect(data.campaign.cta_text).toBe('SHOP ELIGIBLE COLLECTION');
    expect(data.campaign.secondary_text).toBe('LATER');
  });

  it('GET /api/campaigns returns all campaigns for Admin portal', async () => {
    const { req, res, getResponse, getStatusCode } = createMockReqRes('GET', '/api/campaigns');

    const handled = await handleCampaignsRoutes(req, res, '/api/campaigns');
    expect(handled).toBe(true);
    expect(getStatusCode()).toBe(200);

    const data = getResponse();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.campaigns)).toBe(true);
    expect(data.campaigns.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/campaigns/:id/analytics increments metrics for impression, copy_code, cta_click, and dismiss', async () => {
    const campaignId = 'festive-extravaganza-2026';
    const { req, res, getResponse, getStatusCode } = createMockReqRes(
      'POST',
      `/api/campaigns/${campaignId}/analytics`,
      { event: 'copy_code' }
    );

    const handled = await handleCampaignsRoutes(req, res, `/api/campaigns/${campaignId}/analytics`);
    expect(handled).toBe(true);
    expect(getStatusCode()).toBe(200);

    const data = getResponse();
    expect(data.success).toBe(true);
    expect(data.event).toBe('copy_code');
    expect(data.analytics.coupon_copies).toBeGreaterThan(0);
  });

  it('POST /api/coupons/validate successfully calculates discount for ROYAL20 on valid cart', async () => {
    const { req, res, getResponse, getStatusCode } = createMockReqRes(
      'POST',
      '/api/coupons/validate',
      { code: 'ROYAL20', subtotal: 60000, category: 'All' }
    );

    const handled = await handleCampaignsRoutes(req, res, '/api/coupons/validate');
    expect(handled).toBe(true);
    expect(getStatusCode()).toBe(200);

    const data = getResponse();
    expect(data.success).toBe(true);
    expect(data.coupon.code).toBe('ROYAL20');
    expect(data.coupon.discountAmount).toBe(3000); // 5% of 60,000 = 3,000
  });

  it('POST /api/coupons/validate rejects when order value is below minimum order threshold', async () => {
    const { req, res, getResponse, getStatusCode } = createMockReqRes(
      'POST',
      '/api/coupons/validate',
      { code: 'ROYAL20', subtotal: 3500, category: 'All' }
    );

    const handled = await handleCampaignsRoutes(req, res, '/api/coupons/validate');
    expect(handled).toBe(true);
    expect(getStatusCode()).toBe(400);

    const data = getResponse();
    expect(data.success).toBe(false);
    expect(data.error).toContain('minimum order value');
  });

  it('POST /api/coupons/validate rejects invalid or fake coupon codes', async () => {
    const { req, res, getResponse, getStatusCode } = createMockReqRes(
      'POST',
      '/api/coupons/validate',
      { code: 'UNREGISTERED_COUPON', subtotal: 50000, category: 'All' }
    );

    const handled = await handleCampaignsRoutes(req, res, '/api/coupons/validate');
    expect(handled).toBe(true);
    expect(getStatusCode()).toBe(400);

    const data = getResponse();
    expect(data.success).toBe(false);
    expect(data.error).toContain('is invalid or expired');
  });
});
