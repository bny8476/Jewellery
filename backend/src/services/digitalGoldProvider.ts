import crypto from 'crypto';
import { queryDb } from '../db.ts';

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
   * Fetches the latest 24K benchmark gold rates and computes buy/sell prices
   */
  async getLiveRates(): Promise<DigitalGoldRates> {
    let benchmark24k = 14744.00; // Baseline 24K per gram (15/Oct/2026)

    try {
      const snapRows = await queryDb(
        `SELECT gold_24k FROM public.daily_metal_rates_snapshot ORDER BY effective_date DESC LIMIT 1;`
      ).catch(() => []);

      if (snapRows && snapRows.length > 0 && Number(snapRows[0].gold_24k) > 0) {
        benchmark24k = Number(snapRows[0].gold_24k);
      } else {
        const rows = await queryDb(
          `SELECT rate_per_gram, metal_type FROM public.metal_rates WHERE metal_type = 'gold' ORDER BY effective_date DESC LIMIT 1;`
        ).catch(() => []);
        if (rows && rows.length > 0 && Number(rows[0].rate_per_gram) > 0) {
          benchmark24k = Number(rows[0].rate_per_gram);
        }
      }
    } catch (err) {
      console.warn('[DigitalGoldProvider] Using fallback benchmark rate:', err);
    }

    // Standard Digital Gold Bullion Pricing:
    // Buy Rate = Base spot + 1.25% wholesale/vault markup
    // Sell Rate = Base spot - 1.50% redemption spread
    const buyRate = Math.round((benchmark24k * 1.0125) * 100) / 100;
    const sellRate = Math.round((benchmark24k * 0.985) * 100) / 100;
    const spreadPercent = Math.round(((buyRate - sellRate) / buyRate) * 10000) / 100;

    return {
      metalType: 'GOLD_24K_9999',
      purity: '999.9',
      buyRatePerGram: buyRate,
      sellRatePerGram: sellRate,
      marketSpotRatePerGram: benchmark24k,
      spreadPercent,
      currency: 'INR',
      provider: this.activeProviderName,
      isSandbox: this.isSandbox,
      freshnessTimestamp: new Date().toISOString(),
      cacheTtlSeconds: 300, // 5 minutes
      providerStatus: 'ONLINE'
    };
  }

  /**
   * Generates a 5-minute locked quote for Buy or Sell
   */
  async generateQuote(params: QuoteRequest): Promise<QuoteResponse> {
    const rates = await this.getLiveRates();
    const ratePerGram = params.type === 'BUY' ? rates.buyRatePerGram : rates.sellRatePerGram;

    let grams = 0;
    let metalValue = 0;
    let gstAmount = 0;
    let totalAmount = 0;

    if (params.amountInr && params.amountInr > 0) {
      if (params.type === 'BUY') {
        // Buyer pays amountInr inclusive of 3% GST
        // totalAmount = metalValue + 3% GST
        // metalValue = totalAmount / 1.03
        totalAmount = Math.round(params.amountInr * 100) / 100;
        metalValue = Math.round((totalAmount / 1.03) * 100) / 100;
        gstAmount = Math.round((totalAmount - metalValue) * 100) / 100;
        grams = Math.round((metalValue / ratePerGram) * 10000) / 10000;
      } else {
        // Selling: net proceed = grams * sellRate (no GST on customer selling back)
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
    const quoteRef = `AG-QT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

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
        'GOLD_24K_9999',
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
      metalType: 'GOLD_24K_9999',
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
}

export const digitalGoldProvider = new DigitalGoldProviderService();
