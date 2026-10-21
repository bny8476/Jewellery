import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  fetchDigitalGoldRates, 
  requestBullionQuote, 
  createDigitalGoldSip,
  createRedemptionOrder,
  fulfillAdminRedemption
} from './digitalGoldService';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock_token',
            user: { id: 'cust-12345678-0000-0000-0000-000000000000', email: 'patron@yazhini.in' }
          }
        }
      })
    }
  }
}));

describe('Aura Gold SIP, Redemption & Unified Pricing Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Fetches unified digital bullion rates with 24K gold and 999 silver spreads', async () => {
    const mockRates = {
      success: true,
      rates: {
        metalType: 'GOLD_24K_9999',
        purity: '999.9',
        buyRatePerGram: 14928.3,
        sellRatePerGram: 14522.84,
        marketSpotRatePerGram: 14744.0,
        spreadPercent: 2.72,
        currency: 'INR',
        provider: 'AUGMONT_SAFEGOLD_SANDBOX',
        isSandbox: true,
        freshnessTimestamp: new Date().toISOString(),
        cacheTtlSeconds: 300,
        providerStatus: 'ONLINE',
        silver: {
          buyRatePerGram: 184.82,
          sellRatePerGram: 177.58,
          marketSpotRatePerGram: 181.2,
          spreadPercent: 3.92
        }
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRates
    } as any);

    const rates = await fetchDigitalGoldRates();
    expect(rates.buyRatePerGram).toBe(14928.3);
    expect(rates.marketSpotRatePerGram).toBe(14744.0);
    expect(rates.silver?.buyRatePerGram).toBe(184.82);
    expect(rates.silver?.marketSpotRatePerGram).toBe(181.2);
  });

  it('2. Requests locked buy quote with accurate 3% GST and gram calculation', async () => {
    const mockQuote = {
      success: true,
      quote: {
        quoteId: 'qt-101',
        quoteReference: 'AG-QT-2026',
        type: 'BUY',
        metalType: 'GOLD_24K_9999',
        ratePerGram: 14928.3,
        grams: 0.065,
        metalValue: 970.87,
        gstRatePercent: 3.0,
        gstAmount: 29.13,
        convenienceFee: 0.0,
        totalAmount: 1000.0,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        validForSeconds: 300,
        provider: 'AUGMONT_SAFEGOLD_SANDBOX'
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuote
    } as any);

    const quote = await requestBullionQuote({
      type: 'BUY',
      metalType: 'GOLD_24K_9999',
      amountInr: 1000
    });

    expect(quote.totalAmount).toBe(1000.0);
    expect(quote.gstAmount).toBe(29.13);
    expect(quote.grams).toBe(0.065);
    expect(quote.metalValue + quote.gstAmount).toBe(1000.0);
  });

  it('3. Creates Systematic Investment Plan (SIP) with frequency and auto-debit parameters', async () => {
    const mockSipRes = {
      success: true,
      message: 'Systematic Investment Plan (SIP) activated successfully!',
      plan: {
        id: 'sip-999',
        customer_id: 'cust-12345678-0000-0000-0000-000000000000',
        plan_reference: 'AG-SIP-XYZ',
        metal_type: 'GOLD_24K_9999',
        frequency: 'MONTHLY',
        amount_inr: 2500,
        start_date: '2026-10-21',
        next_execution_date: '2026-11-21',
        payment_method: 'UPI_AUTOPAY',
        status: 'ACTIVE',
        total_invested_inr: 2500,
        total_grams_accumulated: 0.1625,
        successful_executions: 1,
        failed_executions: 0,
        created_at: new Date().toISOString()
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSipRes
    } as any);

    const result = await createDigitalGoldSip({
      frequency: 'MONTHLY',
      amountInr: 2500,
      metalType: 'GOLD_24K_9999',
      executeFirstNow: true
    });

    expect(result.success).toBe(true);
    expect(result.plan.amount_inr).toBe(2500);
    expect(result.plan.frequency).toBe('MONTHLY');
    expect(result.plan.status).toBe('ACTIVE');
  });

  it('4. Creates Razorpay checkout order for coin redemption minting fee', async () => {
    const mockRedemptionOrder = {
      success: true,
      productId: 'prod-coin-1g',
      productName: '1 Gram 24K 999.9 Aura Gold Minted Coin',
      grams: 1.0,
      mintingCharges: 450,
      razorpay: {
        key: 'rzp_test_mock',
        orderId: 'rzp_rdm_123',
        amount: 45000,
        currency: 'INR',
        name: 'YAZHINI Fine Jewels & Aura Gold',
        description: 'Minting & Transit Insurance: 1 Gram 24K 999.9 Aura Gold Minted Coin'
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRedemptionOrder
    } as any);

    const res = await createRedemptionOrder({
      productId: 'prod-coin-1g',
      shippingAddress: {
        deliveryName: 'Ananya Sharma',
        deliveryPhone: '9876543210',
        deliveryAddress: '42 Cathedral Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600086'
      }
    });

    expect(res.success).toBe(true);
    expect(res.mintingCharges).toBe(450);
    expect(res.razorpay.amount).toBe(45000); // 450 INR in paise
  });

  it('5. Allows Admin to fulfill redemption order with Sequel Logistics AWB tracking', async () => {
    const mockFulfillRes = {
      success: true,
      message: 'Redemption order marked as DISPATCHED. Tracking AWB recorded.',
      redemption: {
        id: 'rdm-777',
        status: 'DISPATCHED',
        carrier_name: 'Sequel Logistics',
        tracking_number: 'SQL-99881122',
        dispatched_at: new Date().toISOString()
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFulfillRes
    } as any);

    const updated = await fulfillAdminRedemption({
      redemptionId: 'rdm-777',
      status: 'DISPATCHED',
      carrierName: 'Sequel Logistics',
      trackingNumber: 'SQL-99881122'
    });

    expect(updated.status).toBe('DISPATCHED');
    expect(updated.carrier_name).toBe('Sequel Logistics');
    expect(updated.tracking_number).toBe('SQL-99881122');
  });
});
