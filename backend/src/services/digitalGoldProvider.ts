import crypto from 'crypto';
import { queryDb } from '../db.ts';
import { readLocalSnapshot } from '../../api/cron-update-metal-rates.ts';

export function toValidUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

export interface DigitalGoldRates {
  metalType: 'GOLD_24K_9999' | 'SILVER_999';
  purity: '999.9' | '999';
  buyRatePerGram: number;     // Price customer pays to buy 1g (before 3% GST)
  sellRatePerGram: number;    // Price customer receives to sell 1g
  marketSpotRatePerGram: number;
  spreadPercent: number;
  currency: 'INR';
  provider: string;
  isSandbox: boolean;
  freshnessTimestamp: string;
  cacheTtlSeconds: number;
  providerStatus: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
  silver: {
    buyRatePerGram: number;
    sellRatePerGram: number;
    marketSpotRatePerGram: number;
    spreadPercent: number;
  };
}

export interface QuoteRequest {
  customerId?: string;
  type: 'BUY' | 'SELL';
  metalType?: 'GOLD_24K_9999' | 'SILVER_999';
  amountInr?: number;
  grams?: number;
}

export interface QuoteResponse {
  quoteId: string;
  quoteReference: string;
  type: 'BUY' | 'SELL';
  metalType: string;
  ratePerGram: number;
  grams: number;
  metalValue: number;
  gstRatePercent: number;
  gstAmount: number;
  convenienceFee: number;
  totalAmount: number;
  expiresAt: string;
  validForSeconds: number;
  provider: string;
}

export interface RedemptionProduct {
  id: string;
  name: string;
  grams: number;
  purity: string;
  dimension: string;
  mintingCharges: number;
  inStock: boolean;
  imageUrl: string;
}

export interface SipPlanRecord {
  id: string;
  customer_id: string;
  account_id: string;
  plan_reference: string;
  metal_type: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  amount_inr: number;
  start_date: string;
  next_execution_date: string;
  payment_method: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
  total_invested_inr: number;
  total_grams_accumulated: number;
  successful_executions: number;
  failed_executions: number;
  created_at: string;
  updated_at: string;
}

export const MINTED_GOLD_PRODUCTS: RedemptionProduct[] = [
  {
    id: 'prod-coin-1g',
    name: '1 Gram 24K 999.9 Aura Gold Minted Coin',
    grams: 1.0,
    purity: '24K (999.9 Purity)',
    dimension: '12mm Diameter • CertiCard Sealed',
    mintingCharges: 450,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prod-coin-2g',
    name: '2 Grams 24K 999.9 Lakshmi Gold Coin',
    grams: 2.0,
    purity: '24K (999.9 Purity)',
    dimension: '15mm Diameter • CertiCard Sealed',
    mintingCharges: 650,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prod-coin-5g',
    name: '5 Grams 24K 999.9 Swiss Bullion Gold Bar',
    grams: 5.0,
    purity: '24K (999.9 Purity)',
    dimension: '22mm x 13mm • Tamper-Evident Assay',
    mintingCharges: 950,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prod-coin-10g',
    name: '10 Grams 24K 999.9 Royal Cast Gold Bar',
    grams: 10.0,
    purity: '24K (999.9 Purity)',
    dimension: '28mm x 17mm • Serial Numbered',
    mintingCharges: 1400,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80'
  }
];

class DigitalGoldProviderService {
  private activeProviderName = process.env.DIGITAL_GOLD_PROVIDER || 'AUGMONT_SAFEGOLD_SANDBOX';
  private isSandbox = process.env.NODE_ENV !== 'production' || !process.env.DIGITAL_GOLD_LIVE_API_KEY;

  /**
   * Fetches the benchmark gold and silver rates and computes live buy/sell prices
   */
  async getLiveRates(): Promise<DigitalGoldRates> {
    let benchmark24k = 14744.00; // Baseline 24K per gram (Official 15/Oct/2026)
    let benchmarkSilver = 181.20; // Baseline Silver per gram

    // 1. Try reading from shared daily snapshot file (exact benchmark with Showroom)
    try {
      const snap = readLocalSnapshot();
      if (snap?.rates_payload) {
        if (snap.rates_payload.gold?.k24?.ratePerGram) {
          benchmark24k = Number(snap.rates_payload.gold.k24.ratePerGram);
        }
        if (snap.rates_payload.silver?.ratePerGram) {
          benchmarkSilver = Number(snap.rates_payload.silver.ratePerGram);
        }
      }
    } catch (e) {
      console.warn('[DigitalGoldProvider] Snapshot read error:', e);
    }

    // 2. Cross-check against database daily_metal_rates_snapshot if available
    try {
      const snapRows = await queryDb(
        `SELECT gold_24k, silver FROM public.daily_metal_rates_snapshot ORDER BY effective_date DESC LIMIT 1;`
      ).catch(() => []);

      if (snapRows && snapRows.length > 0) {
        if (Number(snapRows[0].gold_24k) > 0) {
          benchmark24k = Number(snapRows[0].gold_24k);
        }
        if (Number(snapRows[0].silver) > 0) {
          benchmarkSilver = Number(snapRows[0].silver);
        }
      }
    } catch (err) {
      console.warn('[DigitalGoldProvider] Using fallback benchmark rate:', err);
    }

    // Standard Digital Bullion Pricing:
    // Gold: Buy Rate = Base spot + 1.25% wholesale/vault markup
    // Gold: Sell Rate = Base spot - 1.50% redemption spread
    const buyRateGold = Math.round((benchmark24k * 1.0125) * 100) / 100;
    const sellRateGold = Math.round((benchmark24k * 0.985) * 100) / 100;
    const spreadPercentGold = Math.round(((buyRateGold - sellRateGold) / buyRateGold) * 10000) / 100;

    // Silver: Buy Rate = Base spot + 2.0% markup
    // Silver: Sell Rate = Base spot - 2.0% spread
    const buyRateSilver = Math.round((benchmarkSilver * 1.02) * 100) / 100;
    const sellRateSilver = Math.round((benchmarkSilver * 0.98) * 100) / 100;
    const spreadPercentSilver = Math.round(((buyRateSilver - sellRateSilver) / buyRateSilver) * 10000) / 100;

    return {
      metalType: 'GOLD_24K_9999',
      purity: '999.9',
      buyRatePerGram: buyRateGold,
      sellRatePerGram: sellRateGold,
      marketSpotRatePerGram: benchmark24k,
      spreadPercent: spreadPercentGold,
      currency: 'INR',
      provider: this.activeProviderName,
      isSandbox: this.isSandbox,
      freshnessTimestamp: new Date().toISOString(),
      cacheTtlSeconds: 300, // 5 minutes
      providerStatus: 'ONLINE',
      silver: {
        buyRatePerGram: buyRateSilver,
        sellRatePerGram: sellRateSilver,
        marketSpotRatePerGram: benchmarkSilver,
        spreadPercent: spreadPercentSilver
      }
    };
  }

  /**
   * Generates a 5-minute locked quote for Buy or Sell (Gold or Silver)
   */
  async generateQuote(params: QuoteRequest): Promise<QuoteResponse> {
    const rates = await this.getLiveRates();
    const isSilver = params.metalType === 'SILVER_999';
    const metalType = isSilver ? 'SILVER_999' : 'GOLD_24K_9999';

    const ratePerGram = isSilver
      ? (params.type === 'BUY' ? rates.silver.buyRatePerGram : rates.silver.sellRatePerGram)
      : (params.type === 'BUY' ? rates.buyRatePerGram : rates.sellRatePerGram);

    let grams = 0;
    let metalValue = 0;
    let gstAmount = 0;
    let totalAmount = 0;

    if (params.amountInr && params.amountInr > 0) {
      if (params.type === 'BUY') {
        // Buyer pays amountInr inclusive of 3% GST
        // totalAmount = metalValue + 3% GST => metalValue = totalAmount / 1.03
        totalAmount = Math.round(params.amountInr * 100) / 100;
        metalValue = Math.round((totalAmount / 1.03) * 100) / 100;
        gstAmount = Math.round((totalAmount - metalValue) * 100) / 100;
        grams = Math.round((metalValue / ratePerGram) * 10000) / 10000;
      } else {
        // Selling: net proceeds = grams * sellRate (no GST on customer selling back)
        metalValue = Math.round(params.amountInr * 100) / 100;
        totalAmount = metalValue;
        gstAmount = 0;
        grams = Math.round((metalValue / ratePerGram) * 10000) / 10000;
      }
    } else if (params.grams && params.grams > 0) {
      grams = Math.round(params.grams * 10000) / 10000;
      metalValue = Math.round((grams * ratePerGram) * 100) / 100;

      if (params.type === 'BUY') {
        gstAmount = Math.round((metalValue * 0.03) * 100) / 100;
        totalAmount = Math.round((metalValue + gstAmount) * 100) / 100;
      } else {
        gstAmount = 0;
        totalAmount = metalValue;
      }
    } else {
      throw new Error('Either amountInr or grams must be specified and greater than zero.');
    }

    if (grams <= 0 || totalAmount <= 0) {
      throw new Error('Calculated quantity or amount must be greater than zero.');
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const prefix = isSilver ? 'AG-SQT' : 'AG-QT';
    const quoteRef = `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Persist quote to digital_gold_quotes table via direct PostgreSQL pool
    const validCustomerId = params.customerId ? toValidUuid(params.customerId) : null;
    const inserted = await queryDb(
      `INSERT INTO public.digital_gold_quotes (
        quote_reference, customer_id, type, metal_type, provider, rate_per_gram,
        grams, metal_value, gst_rate_percent, gst_amount, convenience_fee,
        total_amount, expires_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;`,
      [
        quoteRef,
        validCustomerId,
        params.type,
        metalType,
        this.activeProviderName,
        ratePerGram,
        grams,
        metalValue,
        params.type === 'BUY' ? 3.00 : 0.00,
        gstAmount,
        0.00,
        totalAmount,
        expiresAt,
        'ACTIVE'
      ]
    );

    const quoteRow = inserted[0];

    return {
      quoteId: quoteRow.id,
      quoteReference: quoteRef,
      type: params.type,
      metalType,
      ratePerGram,
      grams,
      metalValue,
      gstRatePercent: params.type === 'BUY' ? 3.00 : 0.00,
      gstAmount,
      convenienceFee: 0.00,
      totalAmount,
      expiresAt,
      validForSeconds: 300,
      provider: this.activeProviderName
    };
  }

  /**
   * Retrieves or creates customer digital gold account
   */
  async getOrCreateAccount(customerId: string): Promise<any> {
    const validCustomerId = toValidUuid(customerId);
    const existing = await queryDb(
      `SELECT * FROM public.digital_gold_accounts WHERE customer_id = $1 LIMIT 1;`,
      [validCustomerId]
    );

    if (existing && existing.length > 0) return existing[0];

    const accountNo = `AG-ACC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const created = await queryDb(
      `INSERT INTO public.digital_gold_accounts (
        customer_id, account_number, gold_balance_grams, reserved_grams,
        silver_balance_grams, kyc_status, status, provider
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`,
      [validCustomerId, accountNo, 0.0000, 0.0000, 0.0000, 'VERIFIED', 'ACTIVE', this.activeProviderName]
    );

    return created[0];
  }

  /**
   * Creates a new Systematic Investment Plan (SIP)
   */
  async createSipPlan(params: {
    customerId: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    amountInr: number;
    metalType?: 'GOLD_24K_9999' | 'SILVER_999';
    paymentMethod?: string;
    startDate?: string;
  }): Promise<SipPlanRecord> {
    const validCustomerId = toValidUuid(params.customerId);
    const account = await this.getOrCreateAccount(validCustomerId);

    if (params.amountInr < 100) {
      throw new Error('Minimum SIP installment is ₹100.');
    }

    const metalType = params.metalType || 'GOLD_24K_9999';
    const planRef = `AG-SIP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const paymentMethod = params.paymentMethod || 'UPI_AUTOPAY';

    // Calculate next execution date
    const today = new Date();
    const startDate = params.startDate ? new Date(params.startDate) : today;
    const nextDate = new Date(startDate);
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedNextDate = nextDate.toISOString().split('T')[0];

    const inserted = await queryDb(
      `INSERT INTO public.digital_gold_sip_plans (
        customer_id, account_id, plan_reference, metal_type, frequency,
        amount_inr, start_date, next_execution_date, payment_method, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;`,
      [
        validCustomerId,
        account.id,
        planRef,
        metalType,
        params.frequency,
        params.amountInr,
        formattedStartDate,
        formattedNextDate,
        paymentMethod,
        'ACTIVE'
      ]
    );

    return inserted[0];
  }

  /**
   * Retrieves all SIP plans for a customer
   */
  async getCustomerSipPlans(customerId: string): Promise<any[]> {
    const validCustomerId = toValidUuid(customerId);
    const plans = await queryDb(
      `SELECT * FROM public.digital_gold_sip_plans WHERE customer_id = $1 ORDER BY created_at DESC;`,
      [validCustomerId]
    );
    return plans || [];
  }

  /**
   * Pauses an active SIP plan
   */
  async pauseSipPlan(planId: string, customerId: string): Promise<any> {
    const validCustomerId = toValidUuid(customerId);
    const updated = await queryDb(
      `UPDATE public.digital_gold_sip_plans SET status = 'PAUSED', updated_at = now() 
       WHERE id = $1 AND customer_id = $2 RETURNING *;`,
      [planId, validCustomerId]
    );
    if (!updated || updated.length === 0) {
      throw new Error('SIP Plan not found or unauthorized.');
    }
    return updated[0];
  }

  /**
   * Resumes a paused SIP plan
   */
  async resumeSipPlan(planId: string, customerId: string): Promise<any> {
    const validCustomerId = toValidUuid(customerId);
    const today = new Date().toISOString().split('T')[0];
    const updated = await queryDb(
      `UPDATE public.digital_gold_sip_plans SET status = 'ACTIVE', next_execution_date = $3, updated_at = now() 
       WHERE id = $1 AND customer_id = $2 RETURNING *;`,
      [planId, validCustomerId, today]
    );
    if (!updated || updated.length === 0) {
      throw new Error('SIP Plan not found or unauthorized.');
    }
    return updated[0];
  }

  /**
   * Cancels an SIP plan
   */
  async cancelSipPlan(planId: string, customerId: string): Promise<any> {
    const validCustomerId = toValidUuid(customerId);
    const updated = await queryDb(
      `UPDATE public.digital_gold_sip_plans SET status = 'CANCELLED', updated_at = now() 
       WHERE id = $1 AND customer_id = $2 RETURNING *;`,
      [planId, validCustomerId]
    );
    if (!updated || updated.length === 0) {
      throw new Error('SIP Plan not found or unauthorized.');
    }
    return updated[0];
  }

  /**
   * Executes a single installment cycle for an active SIP plan
   */
  async executeSipCycle(planId: string, customerId: string): Promise<any> {
    const validCustomerId = toValidUuid(customerId);
    const plans = await queryDb(
      `SELECT * FROM public.digital_gold_sip_plans WHERE id = $1 AND customer_id = $2 AND status = 'ACTIVE' LIMIT 1;`,
      [planId, validCustomerId]
    );

    if (!plans || plans.length === 0) {
      throw new Error('Active SIP Plan not found.');
    }

    const plan = plans[0];
    const isSilver = plan.metal_type === 'SILVER_999';
    const amountInr = Number(plan.amount_inr);

    // Generate fresh quote for this installment
    const quote = await this.generateQuote({
      customerId: validCustomerId,
      type: 'BUY',
      metalType: isSilver ? 'SILVER_999' : 'GOLD_24K_9999',
      amountInr
    });

    const account = await this.getOrCreateAccount(validCustomerId);
    const txRef = `AG-SIP-TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // 1. Insert Transaction Record
    const txns = await queryDb(
      `INSERT INTO public.digital_gold_transactions (
        transaction_reference, customer_id, account_id, quote_id, type,
        metal_type, grams, rate_per_gram, metal_value, gst_amount, total_amount,
        payment_gateway, payment_order_id, payment_id, payment_status, provider, provider_status,
        status, idempotency_key, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *;`,
      [
        txRef,
        validCustomerId,
        account.id,
        quote.quoteId,
        'BUY',
        plan.metal_type,
        quote.grams,
        quote.ratePerGram,
        quote.metalValue,
        quote.gstAmount,
        quote.totalAmount,
        plan.payment_method,
        `mandate_${plan.plan_reference}`,
        `sip_deb_${Date.now()}`,
        'SUCCESS',
        this.activeProviderName,
        'ALLOCATED',
        'COMPLETED',
        txRef,
        JSON.stringify({ sipPlanId: plan.id, frequency: plan.frequency })
      ]
    );

    // 2. Credit grams to account
    if (isSilver) {
      const currentSilver = Number(account.silver_balance_grams || 0);
      const newSilver = Math.round((currentSilver + quote.grams) * 10000) / 10000;
      await queryDb(`UPDATE public.digital_gold_accounts SET silver_balance_grams = $1, updated_at = now() WHERE id = $2;`, [newSilver, account.id]);
    } else {
      const currentGold = Number(account.gold_balance_grams || 0);
      const newGold = Math.round((currentGold + quote.grams) * 10000) / 10000;
      await queryDb(`UPDATE public.digital_gold_accounts SET gold_balance_grams = $1, updated_at = now() WHERE id = $2;`, [newGold, account.id]);
    }

    // 3. Log SIP execution
    await queryDb(
      `INSERT INTO public.digital_gold_sip_executions (
        plan_id, transaction_id, scheduled_date, amount_inr, grams, rate_per_gram, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [plan.id, txns[0].id, new Date().toISOString().split('T')[0], amountInr, quote.grams, quote.ratePerGram, 'SUCCESS']
    );

    // 4. Compute next execution date based on frequency
    const nextDate = new Date();
    if (plan.frequency === 'DAILY') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (plan.frequency === 'WEEKLY') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const newInvested = Number(plan.total_invested_inr || 0) + amountInr;
    const newGrams = Number(plan.total_grams_accumulated || 0) + quote.grams;
    const execCount = Number(plan.successful_executions || 0) + 1;

    const updatedPlan = await queryDb(
      `UPDATE public.digital_gold_sip_plans SET 
        total_invested_inr = $1, total_grams_accumulated = $2, successful_executions = $3,
        next_execution_date = $4, updated_at = now()
       WHERE id = $5 RETURNING *;`,
      [newInvested, newGrams, execCount, nextDate.toISOString().split('T')[0], plan.id]
    );

    return {
      success: true,
      transaction: txns[0],
      plan: updatedPlan[0],
      accumulatedGrams: quote.grams
    };
  }

  /**
   * Admin: Fulfill and dispatch physical redemption order
   */
  async fulfillRedemption(redemptionId: string, params: {
    status: 'MINTING' | 'DISPATCHED' | 'DELIVERED';
    carrierName?: string;
    trackingNumber?: string;
  }): Promise<any> {
    const { status, carrierName, trackingNumber } = params;
    const dispatchedAt = status === 'DISPATCHED' || status === 'DELIVERED' ? new Date().toISOString() : null;
    const deliveredAt = status === 'DELIVERED' ? new Date().toISOString() : null;

    const updated = await queryDb(
      `UPDATE public.digital_gold_redemptions SET 
        status = $1, carrier_name = COALESCE($2, carrier_name), tracking_number = COALESCE($3, tracking_number),
        dispatched_at = COALESCE($4, dispatched_at), delivered_at = COALESCE($5, delivered_at), updated_at = now()
       WHERE id = $6 RETURNING *;`,
      [status, carrierName || null, trackingNumber || null, dispatchedAt, deliveredAt, redemptionId]
    );

    if (!updated || updated.length === 0) {
      throw new Error('Redemption order not found.');
    }

    return updated[0];
  }

  /**
   * Admin: List all physical coin redemption orders
   */
  async getAllRedemptions(): Promise<any[]> {
    const list = await queryDb(
      `SELECT r.*, c.email as customer_email, a.account_number 
       FROM public.digital_gold_redemptions r
       LEFT JOIN public.digital_gold_accounts a ON r.customer_id = a.customer_id
       LEFT JOIN auth.users c ON r.customer_id = c.id
       ORDER BY r.created_at DESC;`
    ).catch(async () => {
      // Fallback if auth.users is inaccessible
      return await queryDb(`SELECT * FROM public.digital_gold_redemptions ORDER BY created_at DESC;`);
    });
    return list || [];
  }
}

export const digitalGoldProvider = new DigitalGoldProviderService();
