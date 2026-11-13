import { z } from 'zod';

// Regex constants adhering to Indian statutory & format requirements
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const AADHAAR_REGEX = /^\d{12}$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const GSTIN_REGEX = /^(0[1-9]|[1-2][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAYMENT_REF_REGEX = /^[A-Za-z0-9_\-\/]{6,}$/;

export const CASH_TRANSACTION_LIMIT_269ST = 200000;
export const PAN_MANDATORY_THRESHOLD = 200000;

/**
 * Normalizes Indian phone numbers by stripping country code (+91), spaces, and dashes.
 */
export const normalizePhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1);
  return cleaned;
};

// ------------------------------------------------------------------------------
// 1. Customer Schema
// ------------------------------------------------------------------------------
export const createCustomerSchema = z.object({
  full_name: z.string().trim().min(2, 'Customer full name must be at least 2 characters'),
  phone: z.string().transform(normalizePhone).pipe(
    z.string().regex(PHONE_REGEX, 'Phone number must be a valid 10-digit Indian mobile number')
  ),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().refine(
    (val) => !val || PINCODE_REGEX.test(val.trim()),
    'Pincode must be a 6-digit Indian PIN (e.g. 600001)'
  ),
  pan_number: z.string().optional().transform(v => (v ? v.trim().toUpperCase() : '')).refine(
    (val) => !val || PAN_REGEX.test(val),
    'PAN must be a valid 10-character alphanumeric code (e.g. ABCDE1234F)'
  ),
  aadhaar_number: z.string().optional().transform(v => (v ? v.replace(/[\s-]/g, '') : '')).refine(
    (val) => !val || AADHAAR_REGEX.test(val),
    'Aadhaar number must be exactly 12 digits'
  ),
  category: z.enum(['retail', 'wholesale', 'vip', 'pawn_only']).optional(),
  kyc_status: z.string().optional().transform(v => {
    if (!v) return 'UNVERIFIED';
    const upper = v.trim().toUpperCase();
    if (['VERIFIED', 'REJECTED', 'PENDING', 'UNVERIFIED', 'NOT_SUBMITTED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'EXPIRED'].includes(upper)) {
      if (['PENDING_VERIFICATION', 'UNDER_REVIEW', 'ACTION_REQUIRED'].includes(upper)) return 'PENDING';
      if (upper === 'NOT_SUBMITTED') return 'UNVERIFIED';
      return upper;
    }
    return 'UNVERIFIED';
  }),
  user_id: z.string().optional(),
  customer_code: z.string().optional()
}).strict();

// ------------------------------------------------------------------------------
// 2. Sale / Order Schema
// ------------------------------------------------------------------------------
const saleItemSchema = z.object({
  id: z.string().optional(),
  jewelry_item_id: z.string().optional(),
  product_id: z.string().optional(),
  name: z.string().optional(),
  item_name: z.string().optional(),
  quantity: z.number().int().positive('Item quantity must be at least 1').default(1),
  unit_price: z.number().nonnegative('Unit price cannot be negative'),
  subtotal: z.number().nonnegative('Subtotal cannot be negative').optional()
}).refine(item => !!(item.id || item.jewelry_item_id || item.product_id), {
  message: 'Each item must have an id, jewelry_item_id, or product_id'
});

export const createSaleOrderSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Sale must include at least one jewelry item'),
  customer_id: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable().transform(v => (v ? normalizePhone(v) : '')).refine(
    val => !val || PHONE_REGEX.test(val),
    'Customer phone must be a valid 10-digit Indian number'
  ),
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  making_charges: z.number().nonnegative('Making charges cannot be negative').default(0),
  discount: z.number().nonnegative('Discount cannot be negative').default(0),
  total_amount: z.number().positive('Total amount must be greater than 0'),
  final_amount: z.number().positive('Final amount must be greater than 0').optional(),
  payment_method: z.enum([
    'cash', 'card', 'upi', 'neft', 'rtgs', 'netbanking', 'bank_transfer', 'cheque'
  ]),
  payment_reference: z.string().optional().default(''),
  pan_number: z.string().optional().transform(v => (v ? v.trim().toUpperCase() : '')),
  cash_received_today: z.number().nonnegative().optional().default(0),
  order_id: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => {
  const maxDiscount = (data.subtotal || 0) + (data.making_charges || 0);
  return data.discount <= maxDiscount;
}, {
  message: 'Discount cannot exceed sum of subtotal and making charges',
  path: ['discount']
}).refine((data) => {
  if (data.payment_method === 'cash') {
    const billTotal = data.final_amount ?? data.total_amount;
    const totalCash = (data.cash_received_today || 0) + billTotal;
    return totalCash < CASH_TRANSACTION_LIMIT_269ST;
  }
  return true;
}, {
  message: 'Cash payment rejected under Income Tax Sec 269ST: Total cash reaches or exceeds ₹2,00,000 statutory limit',
  path: ['payment_method']
}).refine((data) => {
  const billTotal = data.final_amount ?? data.total_amount;
  if (billTotal > PAN_MANDATORY_THRESHOLD) {
    return Boolean(data.pan_number && PAN_REGEX.test(data.pan_number));
  }
  return true;
}, {
  message: 'Income Tax Rule 114B mandates a valid 10-character PAN for transactions exceeding ₹2,00,000',
  path: ['pan_number']
}).refine((data) => {
  if (data.payment_method !== 'cash') {
    return Boolean(data.payment_reference && PAYMENT_REF_REGEX.test(data.payment_reference.trim()));
  }
  return true;
}, {
  message: 'Non-cash payments require a valid payment reference / UTR of at least 6 alphanumeric characters',
  path: ['payment_reference']
});

// ------------------------------------------------------------------------------
// 3. Purchase Schema
// ------------------------------------------------------------------------------
export const createPurchaseSchema = z.object({
  supplier_id: z.string().optional().nullable(),
  supplier_name: z.string().trim().min(2, 'Supplier name must be at least 2 characters').optional(),
  metal_type: z.string().transform(v => v.toLowerCase()).pipe(z.enum(['gold', 'silver', 'platinum', 'diamond', 'gemstone'])),
  purity: z.string().min(1, 'Purity specification is required'),
  gross_weight: z.number().positive('Gross weight must be strictly positive'),
  net_weight: z.number().positive('Net weight must be strictly positive'),
  rate_per_gram: z.number().positive('Rate per gram must be strictly positive'),
  total_amount: z.number().positive('Total purchase amount must be positive'),
  paid_amount: z.number().nonnegative('Paid amount cannot be negative'),
  payment_method: z.string().optional().default('cash'),
  payment_reference: z.string().optional().default(''),
  notes: z.string().optional()
}).refine(data => data.net_weight <= data.gross_weight, {
  message: 'Net weight cannot exceed gross weight',
  path: ['net_weight']
}).refine(data => data.paid_amount <= data.total_amount, {
  message: 'Paid amount cannot exceed total purchase amount',
  path: ['paid_amount']
});

// ------------------------------------------------------------------------------
// 4. Pawn Pledge Schema
// ------------------------------------------------------------------------------
export const createPledgeSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  customer_name: z.string().optional(),
  pledge_no: z.string().optional(),
  pledge_date: z.string().optional(),
  loan_amount: z.number().positive('Loan amount must be strictly greater than 0'),
  interest_rate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100% per annum'),
  gross_weight: z.number().positive().optional(),
  net_weight: z.number().positive().optional(),
  item_description: z.string().optional(),
  articles_count: z.number().int().positive().optional().default(1),
  notes: z.string().optional()
}).refine(data => {
  if (data.gross_weight !== undefined && data.net_weight !== undefined) {
    return data.net_weight <= data.gross_weight;
  }
  return true;
}, {
  message: 'Net weight cannot exceed gross weight',
  path: ['net_weight']
});

export const repayPledgeSchema = z.object({
  pledge_id: z.string().min(1, 'Valid pledge_id is required'),
  payment_amount: z.number().positive('Payment amount must be greater than 0'),
  payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque']).default('cash'),
  notes: z.string().optional(),
  receipt_number: z.string().optional()
}).strict();

// ------------------------------------------------------------------------------
// 5. Metal Rates Admin Settings Schema
// ------------------------------------------------------------------------------
export const metalRatesAdminSettingsSchema = z.object({
  activeProvider: z.enum(['goldapi', 'metals_dev', 'manual']),
  refreshIntervalMinutes: z.number().int().min(1, 'Minimum interval is 1 minute').max(1440, 'Maximum interval is 1440 minutes'),
  cacheTtlMinutes: z.number().int().min(1, 'Minimum cache TTL is 1 minute').max(1440, 'Maximum cache TTL is 1440 minutes'),
  goldAdjustmentPerGram: z.number().min(-5000, 'Gold adjustment must be within ±₹5000/g').max(5000, 'Gold adjustment must be within ±₹5000/g'),
  silverAdjustmentPerGram: z.number().min(-500, 'Silver adjustment must be within ±₹500/g').max(500, 'Silver adjustment must be within ±₹500/g'),
  platinumAdjustmentPerGram: z.number().min(-5000, 'Platinum adjustment must be within ±₹5000/g').max(5000, 'Platinum adjustment must be within ±₹5000/g'),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional()
}).strict();

// ------------------------------------------------------------------------------
// 6. Pawn Smart Valuation & Management Schemas
// ------------------------------------------------------------------------------
export const smartValuationItemSchema = z.object({
  item_description: z.string().optional(),
  category: z.string().optional(),
  gross_weight_grams: z.number().positive('Gross weight must be greater than 0'),
  stone_weight_grams: z.number().nonnegative('Stone weight cannot be negative').default(0),
  purity: z.string().min(1, 'Purity specification is required'),
  deduction_percentage: z.number().min(0, 'Deduction % cannot be negative').max(100, 'Deduction % cannot exceed 100%').default(0)
}).refine(data => data.stone_weight_grams < data.gross_weight_grams, {
  message: 'Stone weight must be strictly less than gross weight',
  path: ['stone_weight_grams']
});

export const smartValuationSchema = z.object({
  items: z.array(smartValuationItemSchema).min(1, 'At least one jewellery article is required for valuation'),
  live_rates: z.object({
    gold24k: z.number().positive().optional(),
    gold22k: z.number().positive().optional(),
    gold18k: z.number().positive().optional(),
    silver: z.number().positive().optional(),
    timestamp: z.string().optional()
  }).optional(),
  ltv_percentage: z.number().min(10, 'LTV % must be at least 10%').max(75, 'Statutory max LTV is 75%').default(75)
});

export const pawnRenewalSchema = z.object({
  pledge_id: z.string().min(1, 'Valid pledge_id is required'),
  extension_months: z.number().int().min(1, 'Extension tenure must be at least 1 month').max(36, 'Extension tenure cannot exceed 36 months').default(6),
  new_interest_rate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%').optional(),
  renewal_fee: z.number().min(0, 'Renewal fee cannot be negative').default(250),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});

export const pawnRedemptionSchema = z.object({
  pledge_id: z.string().min(1, 'Valid pledge_id is required'),
  total_amount: z.number().positive('Total payoff amount must be strictly positive'),
  payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque']).default('cash'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  receipt_number: z.string().optional()
});

// ------------------------------------------------------------------------------
// 7. Customer Order Return / Exchange Schema
// ------------------------------------------------------------------------------
export const returnExchangeSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  type: z.enum(['return', 'exchange', 'service']),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(300, 'Reason cannot exceed 300 characters'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});

// ------------------------------------------------------------------------------
// 8. Marketing Promotional Campaign Schema
// ------------------------------------------------------------------------------
export const createCampaignSchema = z.object({
  name: z.string().trim().min(3, 'Campaign name must be at least 3 characters').max(100, 'Campaign name cannot exceed 100 characters'),
  badge_label: z.string().trim().max(40, 'Badge label cannot exceed 40 characters').default('LIMITED FESTIVE OFFER'),
  heading: z.string().trim().min(3, 'Campaign heading must be at least 3 characters').max(100, 'Campaign heading cannot exceed 100 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters'),
  coupon_code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/, 'Coupon code must be 3-20 uppercase alphanumeric characters or hyphens'),
  discount_type: z.enum(['flat', 'percentage']).default('percentage'),
  discount_value: z.number().positive('Discount value must be positive').refine(val => val > 0, 'Discount value must be positive'),
  min_order_value: z.number().min(0, 'Minimum order value cannot be negative').default(0),
  max_discount: z.number().min(0, 'Maximum discount cap cannot be negative').default(0),
  start_date: z.string().optional(),
  expiry_date: z.string().optional(),
  cta_text: z.string().trim().min(2, 'CTA text must be at least 2 characters').max(50, 'CTA text cannot exceed 50 characters').default('SHOP ELIGIBLE COLLECTION'),
  cta_link: z.string().trim().default('/#catalog?filter=festive'),
  secondary_text: z.string().trim().default('LATER'),
  trust_message: z.string().trim().default('100% BIS Hallmarked Purity • Trusted Jewellery Services'),
  banner_url: z.string().optional(),
  display_priority: z.number().int().min(1).max(100).default(10),
  status: z.enum(['active', 'draft', 'expired', 'archived']).default('active'),
  target_audience: z.enum(['first_time_visitors', 'all']).default('first_time_visitors'),
  eligible_categories: z.array(z.string()).default(['All']),
  eligible_products: z.array(z.string()).default([])
}).refine(data => {
  if (data.discount_type === 'percentage' && data.discount_value > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['discount_value']
}).refine(data => {
  if (data.start_date && data.expiry_date) {
    return new Date(data.expiry_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: 'Expiry date must be after start date',
  path: ['expiry_date']
});

// ------------------------------------------------------------------------------
// 9. Competitor Rate Comparison Source Schema
// ------------------------------------------------------------------------------
export const comparisonSourceSchema = z.object({
  name: z.string().trim().min(2, 'Brand/Source name must be at least 2 characters').max(80, 'Source name cannot exceed 80 characters'),
  websiteUrl: z.string().trim().refine(val => {
    try {
      const u = new URL(val);
      return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname);
    } catch {
      return false;
    }
  }, 'Website URL must be a valid HTTP or HTTPS web address'),
  integrationMethod: z.enum(['manual_entry', 'daily_scraping', 'api_feed', 'partner_portal']).default('manual_entry'),
  syncSchedule: z.enum(['Realtime', 'Hourly', 'Daily', 'Twice-Daily', 'Weekly']).default('Daily'),
  notes: z.string().max(500, 'Review notes cannot exceed 500 characters').optional()
});

// ------------------------------------------------------------------------------
// 10. Digital Gold Physical Redemption Order Schema
// ------------------------------------------------------------------------------
export const digitalGoldRedeemOrderSchema = z.object({
  productId: z.string().min(1, 'Product selection is required'),
  shippingAddress: z.object({
    deliveryName: z.string().trim().min(2, 'Recipient full name must be at least 2 characters').max(80, 'Recipient name cannot exceed 80 characters'),
    deliveryPhone: z.string().transform(normalizePhone).pipe(
      z.string().regex(PHONE_REGEX, 'Delivery contact phone must be a valid 10-digit Indian mobile number')
    ),
    deliveryAddress: z.string().trim().min(5, 'Delivery address must be at least 5 characters').max(300, 'Address cannot exceed 300 characters'),
    city: z.string().trim().min(2, 'City name is required').max(50),
    state: z.string().trim().min(2, 'State name is required').max(50),
    pincode: z.string().trim().regex(PINCODE_REGEX, 'Pincode must be a 6-digit Indian PIN code')
  })
});


