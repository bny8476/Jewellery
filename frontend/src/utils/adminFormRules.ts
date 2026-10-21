// ==============================================================================
// YAZHINI Fine Jewels & Pawn Shop - Admin Form Validation Rules Engine
// Comprehensive, pure-function validation rules for Admin Dashboard forms.
// Build on top of validation.ts with domain-specific rules (IT Act, BIS, Hallmarking).
// ==============================================================================

import {
  validatePhone,
  validateEmail,
  validatePAN,
  validatePositiveNumber,
  isValidDate,
  validateDateNotFuture
} from './validation';

// ------------------------------------------------------------------------------
// Indian Statutory & Jewellery Domain Constants
// ------------------------------------------------------------------------------

/**
 * Section 269ST of Income Tax Act: No person shall receive an amount of ₹2,00,000
 * or more in cash in a single day from a person or in respect of a single transaction.
 */
export const CASH_TRANSACTION_LIMIT_269ST = 200000;

/**
 * Rule 114B of Income Tax Rules: Mandatory quoting of PAN for sale or purchase
 * of goods or services of an amount exceeding ₹2,00,000 per transaction.
 */
export const PAN_MANDATORY_THRESHOLD = 200000;

export const MAX_GOLD_ADJUSTMENT_PER_GRAM = 5000;
export const MAX_SILVER_ADJUSTMENT_PER_GRAM = 500;
export const MAX_PLATINUM_ADJUSTMENT_PER_GRAM = 5000;

export const MAX_GST_PERCENT = 28;
export const MAX_INTEREST_RATE = 100;
export const MAX_MAKING_CHARGE_BUFFER = 100;
export const MAX_HALLMARK_FEE = 1000;

export const MIN_CARAT_WEIGHT = 0.01;
export const MAX_CARAT_WEIGHT = 50;

// ------------------------------------------------------------------------------
// General Utility Functions
// ------------------------------------------------------------------------------

/**
 * Validates Indian GSTIN (15 characters: 2 state digits 01-38, 10-char PAN, 1 entity, 'Z', 1 checksum)
 * Regex: ^(0[1-9]|[1-2][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$
 */
export const validateGSTIN = (gstin: string | null | undefined): boolean => {
  if (!gstin || typeof gstin !== 'string') return false;
  const trimmed = gstin.trim().toUpperCase();
  const gstinRegex = /^(0[1-9]|[1-2][0-9]|3[0-8])[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  return gstinRegex.test(trimmed);
};

/**
 * Normalizes an Indian phone number by removing spaces, dashes, brackets,
 * and stripping leading '+91', '91', or '0' if present, returning the 10-digit number.
 */
export const normalizePhone = (phone: string | null | undefined): string => {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length > 10) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Returns true if the validation errors map has at least one error.
 */
export const hasErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Returns the first error message from the validation errors map, or null if valid.
 */
export const firstError = (errors: Record<string, string>): string | null => {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
};

// ------------------------------------------------------------------------------
// 1. POS Billing & Checkout Rules (SalesBillingSection)
// ------------------------------------------------------------------------------

export interface PosBillingInput {
  itemCount?: number;
  cartItems?: any[];
  subtotal: number;
  makingCharges: number;
  discount: number | string;
  payableTotal: number;
  paymentMethod: string; // 'cash' | 'card' | 'upi' | 'netbanking' | 'bank_transfer'
  paymentReference?: string;
  panNumber?: string;
  customerPhone?: string;
  customerName?: string;
  cashReceivedTodayFromCustomer?: number;
}

export const validatePosBilling = (data: PosBillingInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  // 1. Cart Item count
  const count = data.itemCount !== undefined 
    ? data.itemCount 
    : (Array.isArray(data.cartItems) ? data.cartItems.length : 0);
  if (count <= 0) {
    errors.cart = 'Please add at least one jewelry item to the bill';
  }

  // 2. Discount bounds: >= 0 and <= (subtotal + making charges)
  const maxAllowedDiscount = Math.max(0, (data.subtotal || 0) + (data.makingCharges || 0));
  const numDiscount = Number(data.discount || 0);

  if (Number.isNaN(numDiscount) || numDiscount < 0) {
    errors.discount = 'Discount cannot be negative';
  } else if (numDiscount > maxAllowedDiscount) {
    errors.discount = `Discount cannot exceed total subtotal & making charges (₹${maxAllowedDiscount.toLocaleString('en-IN')})`;
  }

  // 3. Payment Method & Reference for Non-Cash
  const method = (data.paymentMethod || 'cash').toLowerCase();
  const isNonCash = method !== 'cash';

  if (isNonCash) {
    const ref = (data.paymentReference || '').trim();
    if (!ref) {
      errors.paymentReference = `Payment reference / UTR is required for ${method.toUpperCase()} payments`;
    } else if (ref.length < 6) {
      errors.paymentReference = 'Payment reference must be at least 6 alphanumeric characters';
    } else if (!/^[A-Za-z0-9_\-\/]+$/.test(ref)) {
      errors.paymentReference = 'Payment reference contains invalid characters (allowed: letters, digits, -, _, /)';
    }
  }

  // 4. Income Tax Sec 269ST: Cash payment limit check
  if (method === 'cash') {
    const cashToday = Number(data.cashReceivedTodayFromCustomer || 0);
    const thisBillCash = Number(data.payableTotal || 0);
    const totalCashToday = cashToday + thisBillCash;

    if (totalCashToday >= CASH_TRANSACTION_LIMIT_269ST) {
      errors.paymentMethod = `Cash payment rejected (Income Tax Sec 269ST): Total cash of ₹${totalCashToday.toLocaleString('en-IN')} reaches or exceeds the ₹2,00,000 statutory limit. Please collect payment via UPI, Card, or NEFT/RTGS.`;
    }
  }

  // 5. Rule 114B: Mandatory PAN for transactions exceeding ₹2,00,000
  if (data.payableTotal > PAN_MANDATORY_THRESHOLD) {
    const pan = (data.panNumber || '').trim().toUpperCase();
    if (!pan) {
      errors.panNumber = `Mandatory PAN required: Income Tax Rule 114B mandates PAN quoting for transactions exceeding ₹2,00,000 (Current: ₹${data.payableTotal.toLocaleString('en-IN')})`;
    } else if (!validatePAN(pan)) {
      errors.panNumber = 'Please enter a valid 10-character PAN (e.g. ABCDE1234F)';
    }
  }

  // 6. Customer details format if provided
  if (data.customerPhone) {
    const cleanPhone = normalizePhone(data.customerPhone);
    if (!validatePhone(cleanPhone)) {
      errors.customerPhone = 'Please enter a valid 10-digit Indian mobile number';
    }
  }

  return errors;
};

// ------------------------------------------------------------------------------
// 2. Quick Customer Creation Rules (SalesBillingSection modal)
// ------------------------------------------------------------------------------

export interface QuickCustomerInput {
  name: string;
  phone: string;
  email?: string;
  pan?: string;
}

export const validateQuickCustomer = (data: QuickCustomerInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Customer full name must be at least 2 characters';
  }

  const cleanPhone = normalizePhone(data.phone);
  if (!cleanPhone) {
    errors.phone = 'Mobile number is required';
  } else if (!validatePhone(cleanPhone)) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number';
  }

  if (data.email && data.email.trim()) {
    if (!validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  if (data.pan && data.pan.trim()) {
    if (!validatePAN(data.pan.trim())) {
      errors.pan = 'Please enter a valid 10-character PAN (e.g. ABCDE1234F)';
    }
  }

  return errors;
};

// ------------------------------------------------------------------------------
// 3. Purchase & Supplier Rules (PurchaseSupplierSection)
// ------------------------------------------------------------------------------

export interface PurchaseEntryInput {
  supplier_id: string;
  item_description?: string;
  gross_weight: number | string;
  net_weight: number | string;
  rate_per_gram: number | string;
  total_amount?: number | string;
  paid_amount: number | string;
  payment_mode?: string;
  huid?: string;
}

export const validatePurchaseEntry = (data: PurchaseEntryInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.supplier_id || !data.supplier_id.trim()) {
    errors.supplier_id = 'Please select a registered or approved supplier';
  }

  if (data.item_description !== undefined && data.item_description !== null && data.item_description.trim().length > 0 && data.item_description.trim().length < 3) {
    errors.item_description = 'Item description must be at least 3 characters';
  }

  // Gross Weight > 0
  const gross = Number(data.gross_weight);
  if (!validatePositiveNumber(data.gross_weight) || gross <= 0) {
    errors.gross_weight = 'Gross weight must be greater than 0 grams';
  }

  // Net Weight: 0 < net <= gross
  const net = Number(data.net_weight);
  if (!validatePositiveNumber(data.net_weight) || net <= 0) {
    errors.net_weight = 'Net weight must be greater than 0 grams';
  } else if (gross > 0 && net > gross) {
    errors.net_weight = `Net weight (${net}g) cannot exceed gross weight (${gross}g)`;
  }

  // Rate per gram > 0
  const rate = Number(data.rate_per_gram);
  if (!validatePositiveNumber(data.rate_per_gram) || rate <= 0) {
    errors.rate_per_gram = 'Rate per gram must be a positive number';
  }

  // Paid amount: 0 <= paid <= total
  const total = Number(data.total_amount);
  const paid = Number(data.paid_amount);

  if (Number.isNaN(paid) || paid < 0) {
    errors.paid_amount = 'Paid amount cannot be negative';
  } else if (Number.isFinite(total) && total > 0 && paid > total) {
    errors.paid_amount = `Paid amount (₹${paid}) cannot exceed total bill amount (₹${total})`;
  }

  return errors;
};

export interface SupplierFormInput {
  name?: string;
  supplier_name?: string;
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
}

export const validateSupplierForm = (
  data: SupplierFormInput,
  existingSuppliers: Array<{ id?: string; gstin?: string }> | string[] = [],
  currentSupplierId?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const nameVal = (data.supplier_name || data.name || '').trim();
  if (nameVal.length < 2) {
    errors.name = 'Supplier company or contact name must be at least 2 characters';
    errors.supplier_name = 'Supplier company or contact name must be at least 2 characters';
  }

  const cleanPhone = normalizePhone(data.phone);
  if (!cleanPhone) {
    errors.phone = 'Contact phone number is required';
  } else if (!validatePhone(cleanPhone)) {
    errors.phone = 'Please enter a valid 10-digit Indian phone number';
  }

  if (data.email && data.email.trim()) {
    if (!validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // GSTIN Validation (if provided and not 'Unregistered')
  const gstinInput = (data.gstin || '').trim().toUpperCase();
  if (gstinInput && gstinInput !== 'UNREGISTERED') {
    if (!validateGSTIN(gstinInput)) {
      errors.gstin = 'Invalid GSTIN: Must be 15 characters conforming to Indian GST format (e.g. 33AAAAA0000A1Z5)';
    } else {
      // Check duplicate GSTIN
      const isDuplicate = existingSuppliers.some(item => {
        if (typeof item === 'string') {
          return item.trim().toUpperCase() === gstinInput;
        }
        return item.id !== currentSupplierId && item.gstin && item.gstin.trim().toUpperCase() === gstinInput;
      });
      if (isDuplicate) {
        errors.gstin = `A supplier with GSTIN ${gstinInput} is already registered`;
      }
    }
  }

  return errors;
};

// ------------------------------------------------------------------------------
// 4. Diamond & Gemstone Inventory Rules (DiamondGemSection)
// ------------------------------------------------------------------------------

export interface DiamondEntryInput {
  certificate_number: string;
  lab: string;
  carat: number | string;
  cut?: string;
  color?: string;
  clarity?: string;
  shape?: string;
  cost_price?: number | string;
  selling_price?: number | string;
}

export const validateDiamondEntry = (
  data: DiamondEntryInput,
  existingDiamonds: Array<{ id?: string; certificate_number?: string; lab?: string }> = [],
  currentDiamondId?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Certificate: 5–20 alphanumeric/hyphen
  const cert = (data.certificate_number || '').trim().toUpperCase();
  if (!cert) {
    errors.certificate_number = 'Grading certificate number is required';
  } else if (cert.length < 5 || cert.length > 20) {
    errors.certificate_number = 'Certificate number must be between 5 and 20 characters';
  } else if (!/^[A-Za-z0-9\-]+$/.test(cert)) {
    errors.certificate_number = 'Certificate number may only contain letters, digits, and hyphens';
  } else if (data.lab) {
    // Unique per lab check
    const isDuplicate = existingDiamonds.some(
      d => d.id !== currentDiamondId &&
        d.certificate_number?.trim().toUpperCase() === cert &&
        d.lab?.trim().toUpperCase() === data.lab.trim().toUpperCase()
    );
    if (isDuplicate) {
      errors.certificate_number = `Certificate #${cert} already exists for lab ${data.lab}`;
    }
  }

  // Carat weight: 0.01 - 50
  const carat = Number(data.carat);
  if (!validatePositiveNumber(data.carat) || carat < MIN_CARAT_WEIGHT || carat > MAX_CARAT_WEIGHT) {
    errors.carat = `Carat weight must be between ${MIN_CARAT_WEIGHT} and ${MAX_CARAT_WEIGHT} ct`;
  }

  // Pricing rules
  const cost = data.cost_price !== undefined && data.cost_price !== '' ? Number(data.cost_price) : undefined;
  const sell = data.selling_price !== undefined && data.selling_price !== '' ? Number(data.selling_price) : undefined;

  if (cost !== undefined) {
    if (Number.isNaN(cost) || cost < 0) {
      errors.cost_price = 'Cost price cannot be negative';
    }
  }

  if (sell !== undefined) {
    if (Number.isNaN(sell) || sell < 0) {
      errors.selling_price = 'Selling price cannot be negative';
    }
  }

  if (cost !== undefined && sell !== undefined && cost >= 0 && sell >= 0) {
    if (sell < cost) {
      errors.selling_price = `Selling price (₹${sell}) cannot be below purchase cost (₹${cost})`;
    }
  }

  return errors;
};

// ------------------------------------------------------------------------------
// 5. Admin Settings Rules (AdminSettingsSection)
// ------------------------------------------------------------------------------

export interface AdminSettingsInput {
  storeName: string;
  gstRate: number | string;
  defaultInterestRate?: number | string;
  goldLoanInterest?: number | string;
  makingChargeBuffer: number | string;
  hallmarkFee?: number | string;
  bisFeePerPiece?: number | string;
  storePhone?: string;
  phone?: string;
  storeEmail?: string;
  email?: string;
  storeGstin?: string;
  gstin?: string;
}

export const validateAdminSettings = (data: AdminSettingsInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.storeName || data.storeName.trim().length < 2) {
    errors.storeName = 'Store name is required (at least 2 characters)';
  }

  // GST rate: 0 to 28%
  const gst = Number(data.gstRate);
  if (Number.isNaN(gst) || gst < 0 || gst > MAX_GST_PERCENT) {
    errors.gstRate = `GST rate must be between 0% and ${MAX_GST_PERCENT}%`;
  }

  // Default interest rate: 0 to 100%
  const rawInterest = data.defaultInterestRate !== undefined ? data.defaultInterestRate : data.goldLoanInterest;
  const interest = Number(rawInterest);
  if (Number.isNaN(interest) || interest < 0 || interest > MAX_INTEREST_RATE) {
    errors.defaultInterestRate = `Pawn interest rate must be between 0% and ${MAX_INTEREST_RATE}%`;
    errors.goldLoanInterest = `Pawn interest rate must be between 0% and ${MAX_INTEREST_RATE}%`;
  }

  // Making charge buffer: 0 to 100%
  const buffer = Number(data.makingChargeBuffer);
  if (Number.isNaN(buffer) || buffer < 0 || buffer > MAX_MAKING_CHARGE_BUFFER) {
    errors.makingChargeBuffer = `Making charge buffer must be between 0% and ${MAX_MAKING_CHARGE_BUFFER}%`;
  }

  // Hallmark fee: 0 to 1000
  const rawHallmark = data.hallmarkFee !== undefined ? data.hallmarkFee : data.bisFeePerPiece;
  const hallmark = Number(rawHallmark);
  if (Number.isNaN(hallmark) || hallmark < 0 || hallmark > MAX_HALLMARK_FEE) {
    errors.hallmarkFee = `BIS Hallmark certification fee must be between ₹0 and ₹${MAX_HALLMARK_FEE}`;
    errors.bisFeePerPiece = `BIS Hallmark certification fee must be between ₹0 and ₹${MAX_HALLMARK_FEE}`;
  }

  // Optional store contact details
  const phoneVal = data.storePhone || data.phone;
  if (phoneVal && phoneVal.trim()) {
    const cleanPhone = normalizePhone(phoneVal);
    if (!validatePhone(cleanPhone)) {
      errors.storePhone = 'Please enter a valid 10-digit Indian phone number';
      errors.phone = 'Please enter a valid 10-digit Indian phone number';
    }
  }

  const emailVal = data.storeEmail || data.email;
  if (emailVal && emailVal.trim()) {
    if (!validateEmail(emailVal)) {
      errors.storeEmail = 'Please enter a valid store email address';
      errors.email = 'Please enter a valid store email address';
    }
  }

  const gstinVal = (data.storeGstin || data.gstin || '').trim();
  if (gstinVal && gstinVal.toUpperCase() !== 'UNREGISTERED') {
    if (!validateGSTIN(gstinVal)) {
      errors.storeGstin = 'Please enter a valid 15-character Indian GSTIN format';
      errors.gstin = 'Please enter a valid 15-character Indian GSTIN format';
    }
  }

  return errors;
};

// ------------------------------------------------------------------------------
// 6. Live Rates Admin Adjustments (LiveRatesAdminSection)
// ------------------------------------------------------------------------------

export interface LiveRateAdjustmentsInput {
  goldAdjustmentPerGram: number | string;
  silverAdjustmentPerGram: number | string;
  platinumAdjustmentPerGram: number | string;
  refreshIntervalMinutes?: number | string;
  cacheTtlMinutes?: number | string;
}

export const validateLiveRateAdjustments = (data: LiveRateAdjustmentsInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  const goldAdj = Number(data.goldAdjustmentPerGram);
  if (Number.isNaN(goldAdj) || Math.abs(goldAdj) > MAX_GOLD_ADJUSTMENT_PER_GRAM) {
    errors.goldAdjustmentPerGram = `Gold adjustment must be within ±₹${MAX_GOLD_ADJUSTMENT_PER_GRAM}/g`;
  }

  const silverAdj = Number(data.silverAdjustmentPerGram);
  if (Number.isNaN(silverAdj) || Math.abs(silverAdj) > MAX_SILVER_ADJUSTMENT_PER_GRAM) {
    errors.silverAdjustmentPerGram = `Silver adjustment must be within ±₹${MAX_SILVER_ADJUSTMENT_PER_GRAM}/g`;
  }

  const platAdj = Number(data.platinumAdjustmentPerGram);
  if (Number.isNaN(platAdj) || Math.abs(platAdj) > MAX_PLATINUM_ADJUSTMENT_PER_GRAM) {
    errors.platinumAdjustmentPerGram = `Platinum adjustment must be within ±₹${MAX_PLATINUM_ADJUSTMENT_PER_GRAM}/g`;
  }

  if (data.refreshIntervalMinutes !== undefined && data.refreshIntervalMinutes !== '') {
    const interval = Number(data.refreshIntervalMinutes);
    if (Number.isNaN(interval) || interval < 1 || interval > 1440) {
      errors.refreshIntervalMinutes = 'Refresh interval must be between 1 and 1440 minutes';
    }
  }

  if (data.cacheTtlMinutes !== undefined && data.cacheTtlMinutes !== '') {
    const ttl = Number(data.cacheTtlMinutes);
    if (Number.isNaN(ttl) || ttl < 1 || ttl > 1440) {
      errors.cacheTtlMinutes = 'Cache TTL must be between 1 and 1440 minutes';
    }
  }

  return errors;
};

// ------------------------------------------------------------------------------
// 7. Bank Custody & Re-pledge Rules (BankPledgeEntryForm & BankPledgeReceiveForm)
// ------------------------------------------------------------------------------

export interface BankPledgeEntryInput {
  pledge_id: string;
  bank_name?: string;
  bank_id?: string;
  loan_amount?: number | string;
  amount_received?: number | string;
  interest_rate?: number | string;
  bank_interest_rate?: number | string;
  sent_date: string;
  customerLoanAmount?: number;
}

export const validateBankPledgeEntry = (data: BankPledgeEntryInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.pledge_id || !data.pledge_id.trim()) {
    errors.pledge_id = 'Please select an active customer pledge to re-pledge';
  }

  const bank = (data.bank_name || data.bank_id || '').trim();
  if (!bank) {
    errors.bank_name = 'Please select or enter the commercial bank name';
    errors.bank_id = 'Please select a commercial bank';
  }

  const rawAmount = data.loan_amount !== undefined ? data.loan_amount : data.amount_received;
  const amount = Number(rawAmount);
  if (!validatePositiveNumber(rawAmount) || amount <= 0) {
    errors.loan_amount = 'Disbursed bank loan amount must be greater than 0';
    errors.amount_received = 'Amount received from bank must be greater than 0';
  } else if (data.customerLoanAmount && amount > data.customerLoanAmount * 2.5) {
    // Domain sanity check warning flag
    errors.loan_amount = `Bank loan amount (₹${amount.toLocaleString('en-IN')}) is unusually high relative to customer loan (₹${data.customerLoanAmount.toLocaleString('en-IN')})`;
    errors.amount_received = `Bank loan amount (₹${amount.toLocaleString('en-IN')}) is unusually high relative to customer loan (₹${data.customerLoanAmount.toLocaleString('en-IN')})`;
  }

  const rawRate = data.interest_rate !== undefined ? data.interest_rate : data.bank_interest_rate;
  const rate = Number(rawRate !== undefined && rawRate !== '' ? rawRate : 0);
  if (Number.isNaN(rate) || rate < 0 || rate > 100) {
    errors.interest_rate = 'Bank annual interest rate must be between 0% and 100%';
    errors.bank_interest_rate = 'Bank annual interest rate must be between 0% and 100%';
  }

  if (!data.sent_date || !isValidDate(data.sent_date)) {
    errors.sent_date = 'Please enter a valid date';
  } else if (!validateDateNotFuture(data.sent_date)) {
    errors.sent_date = 'Bank dispatch date cannot be in the future';
  }

  return errors;
};

export interface BankPledgeReceiveInput {
  amount_paid: number | string;
  interest_amount?: number | string;
  interest_paid?: number | string;
  received_date: string;
  bankDisbursedAmount?: number;
}

export const validateBankPledgeReceive = (data: BankPledgeReceiveInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  const paid = Number(data.amount_paid);
  if (!validatePositiveNumber(data.amount_paid) || paid <= 0) {
    errors.amount_paid = 'Principal amount paid to bank must be greater than 0';
  } else if (data.bankDisbursedAmount && paid > data.bankDisbursedAmount) {
    errors.amount_paid = `Principal paid (₹${paid.toLocaleString('en-IN')}) cannot exceed amount received from bank (₹${data.bankDisbursedAmount.toLocaleString('en-IN')})`;
  }

  const rawInterest = data.interest_amount !== undefined ? data.interest_amount : data.interest_paid;
  const interest = Number(rawInterest !== undefined && rawInterest !== '' ? rawInterest : 0);
  if (Number.isNaN(interest) || interest < 0) {
    errors.interest_amount = 'Interest paid to bank cannot be negative';
    errors.interest_paid = 'Interest paid to bank cannot be negative';
  }

  if (!data.received_date || !isValidDate(data.received_date)) {
    errors.received_date = 'Please enter a valid date';
  } else if (!validateDateNotFuture(data.received_date)) {
    errors.received_date = 'Release date cannot be in the future';
  }

  return errors;
};

// ------------------------------------------------------------------------------
// 8. Customer Profile & CRM Modals (Payment & Messaging)
// ------------------------------------------------------------------------------

export interface CustomerRecordPaymentInput {
  amount: number | string;
  paymentMode: string;
  referenceNumber?: string;
  paymentDate?: string;
  totalBalance?: number;
}

export const validateCustomerRecordPayment = (data: CustomerRecordPaymentInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  const amt = Number(data.amount);
  if (!validatePositiveNumber(data.amount) || amt <= 0) {
    errors.amount = 'Payment amount must be greater than 0';
  } else if (data.totalBalance !== undefined && data.totalBalance > 0 && amt > data.totalBalance) {
    errors.amount = `Payment amount (₹${amt.toLocaleString('en-IN')}) cannot exceed total outstanding balance (₹${data.totalBalance.toLocaleString('en-IN')})`;
  }

  if (!data.paymentMode) {
    errors.paymentMode = 'Please select a payment mode';
  }

  const isNonCash = data.paymentMode && data.paymentMode.toLowerCase() !== 'cash';
  if (isNonCash) {
    const ref = (data.referenceNumber || '').trim();
    if (!ref) {
      errors.referenceNumber = 'Payment reference / transaction ID is required for non-cash payments';
    } else if (ref.length < 6) {
      errors.referenceNumber = 'Reference number must be at least 6 characters';
    }
  }

  if (data.paymentDate && (!isValidDate(data.paymentDate) || !validateDateNotFuture(data.paymentDate))) {
    errors.paymentDate = 'Payment date cannot be in the future';
  }

  return errors;
};

export interface CustomerSendMessageInput {
  channel: 'whatsapp' | 'sms' | 'email' | string;
  message: string;
  subject?: string;
}

export const validateCustomerSendMessage = (data: CustomerSendMessageInput): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.channel || !['whatsapp', 'sms', 'email'].includes(data.channel)) {
    errors.channel = 'Please select a valid communication channel';
  }

  const msg = (data.message || '').trim();
  if (!msg || msg.length < 3) {
    errors.message = 'Message text must be at least 3 characters';
  } else if (msg.length > 1000) {
    errors.message = 'Message text cannot exceed 1000 characters';
  }

  if (data.channel === 'email') {
    const subj = (data.subject || '').trim();
    if (!subj || subj.length < 2) {
      errors.subject = 'Email subject line is required (at least 2 characters)';
    }
  }

  return errors;
};
