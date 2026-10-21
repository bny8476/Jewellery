import { describe, it, expect } from 'vitest';
import {
  validateGSTIN,
  normalizePhone,
  hasErrors,
  firstError,
  validatePosBilling,
  validateQuickCustomer,
  validatePurchaseEntry,
  validateSupplierForm,
  validateDiamondEntry,
  validateAdminSettings,
  validateLiveRateAdjustments,
  validateBankPledgeEntry,
  validateBankPledgeReceive,
  validateCustomerRecordPayment,
  validateCustomerSendMessage,
  CASH_TRANSACTION_LIMIT_269ST,
  PAN_MANDATORY_THRESHOLD
} from './adminFormRules';

describe('Admin Form Rules: General Utilities', () => {
  it('validates Indian GSTIN patterns accurately', () => {
    // Valid 15-char Indian GSTINs
    expect(validateGSTIN('33AAAAA0000A1Z5')).toBe(true);
    expect(validateGSTIN('27AAPFU0939F1ZV')).toBe(true);
    expect(validateGSTIN('07AAAAA0000A1Z5')).toBe(true);

    // Invalid GSTINs
    expect(validateGSTIN('')).toBe(false);
    expect(validateGSTIN(null)).toBe(false);
    expect(validateGSTIN('00AAAAA0000A1Z5')).toBe(false); // Invalid state code 00
    expect(validateGSTIN('39AAAAA0000A1Z5')).toBe(false); // Invalid state code 39 (> 38)
    expect(validateGSTIN('33AAAAA0000A15')).toBe(false); // Too short
    expect(validateGSTIN('33AAAAA0000A1Z599')).toBe(false); // Too long
    expect(validateGSTIN('33AAAAA0000A1A5')).toBe(false); // Must have 'Z' at 14th pos
  });

  it('normalizes Indian phone numbers reliably', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('9876543210');
    expect(normalizePhone('919876543210')).toBe('9876543210');
    expect(normalizePhone('09876543210')).toBe('9876543210');
    expect(normalizePhone('9876543210')).toBe('9876543210');
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(null)).toBe('');
  });

  it('evaluates error map status and first error extractor', () => {
    expect(hasErrors({})).toBe(false);
    expect(firstError({})).toBeNull();

    const sampleErrors = { discount: 'Discount invalid', cart: 'Cart empty' };
    expect(hasErrors(sampleErrors)).toBe(true);
    expect(firstError(sampleErrors)).toBe('Discount invalid');
  });
});

describe('Admin Form Rules: POS Billing (SalesBillingSection)', () => {
  const baseValidInput = {
    itemCount: 2,
    subtotal: 50000,
    makingCharges: 4000,
    discount: 1000,
    payableTotal: 53000,
    paymentMethod: 'cash',
    customerPhone: '9876543210',
    cashReceivedTodayFromCustomer: 0
  };

  it('passes a standard valid cash POS bill below statutory limit', () => {
    const errors = validatePosBilling(baseValidInput);
    expect(hasErrors(errors)).toBe(false);
  });

  it('rejects empty cart', () => {
    const errors = validatePosBilling({ ...baseValidInput, itemCount: 0 });
    expect(errors.cart).toContain('at least one jewelry item');
  });

  it('rejects negative discount and discounts exceeding subtotal + making charges', () => {
    const neg = validatePosBilling({ ...baseValidInput, discount: -50 });
    expect(neg.discount).toContain('cannot be negative');

    const excessive = validatePosBilling({ ...baseValidInput, discount: 60000 });
    expect(excessive.discount).toContain('cannot exceed total subtotal & making charges');

    // Exactly equal to subtotal + making charges is allowed
    const maxOk = validatePosBilling({ ...baseValidInput, discount: 54000 });
    expect(maxOk.discount).toBeUndefined();
  });

  it('enforces Income Tax Sec 269ST on single cash bill at ₹2,00,000 threshold', () => {
    // Exactly ₹2,00,000 cash rejected
    const boundaryCash = validatePosBilling({
      ...baseValidInput,
      payableTotal: CASH_TRANSACTION_LIMIT_269ST,
      paymentMethod: 'cash',
      panNumber: 'ABCDE1234F'
    });
    expect(boundaryCash.paymentMethod).toContain('Sec 269ST');

    // Below ₹2,00,000 cash passes
    const belowLimitCash = validatePosBilling({
      ...baseValidInput,
      payableTotal: 199999,
      paymentMethod: 'cash'
    });
    expect(belowLimitCash.paymentMethod).toBeUndefined();
  });

  it('enforces Income Tax Sec 269ST on accumulated daily cash from same customer', () => {
    const accumulatedOverLimit = validatePosBilling({
      ...baseValidInput,
      payableTotal: 50000,
      paymentMethod: 'cash',
      cashReceivedTodayFromCustomer: 150000 // 150,000 + 50,000 = 200,000
    });
    expect(accumulatedOverLimit.paymentMethod).toContain('Sec 269ST');
  });

  it('enforces Rule 114B mandatory PAN quoting on sales exceeding ₹2,00,000', () => {
    // ₹2,00,000 exactly does not require PAN
    const atThreshold = validatePosBilling({
      ...baseValidInput,
      payableTotal: PAN_MANDATORY_THRESHOLD,
      paymentMethod: 'upi',
      paymentReference: 'UPI-REF-123456'
    });
    expect(atThreshold.panNumber).toBeUndefined();

    // ₹2,00,001 requires valid PAN
    const overThresholdNoPan = validatePosBilling({
      ...baseValidInput,
      payableTotal: 200001,
      paymentMethod: 'upi',
      paymentReference: 'UPI-REF-123456'
    });
    expect(overThresholdNoPan.panNumber).toContain('Mandatory PAN required');

    // Invalid PAN format
    const invalidPan = validatePosBilling({
      ...baseValidInput,
      payableTotal: 250000,
      paymentMethod: 'card',
      paymentReference: 'CARD-TXN-998877',
      panNumber: 'INVALIDPAN'
    });
    expect(invalidPan.panNumber).toContain('valid 10-character PAN');

    // Valid PAN passes
    const validPan = validatePosBilling({
      ...baseValidInput,
      payableTotal: 250000,
      paymentMethod: 'card',
      paymentReference: 'CARD-TXN-998877',
      panNumber: 'ABCDE1234F'
    });
    expect(validPan.panNumber).toBeUndefined();
  });

  it('requires valid payment reference (6+ chars) for all non-cash payment methods', () => {
    for (const method of ['upi', 'card', 'netbanking', 'bank_transfer']) {
      const missingRef = validatePosBilling({
        ...baseValidInput,
        paymentMethod: method,
        paymentReference: ''
      });
      expect(missingRef.paymentReference).toContain('reference');

      const shortRef = validatePosBilling({
        ...baseValidInput,
        paymentMethod: method,
        paymentReference: '123'
      });
      expect(shortRef.paymentReference).toContain('at least 6');

      const invalidChars = validatePosBilling({
        ...baseValidInput,
        paymentMethod: method,
        paymentReference: 'REF 123#$'
      });
      expect(invalidChars.paymentReference).toContain('invalid characters');

      const validRef = validatePosBilling({
        ...baseValidInput,
        paymentMethod: method,
        paymentReference: 'UPI_123456'
      });
      expect(validRef.paymentReference).toBeUndefined();
    }
  });
});

describe('Admin Form Rules: Quick Customer Creation', () => {
  it('validates minimum name length and 10-digit phone', () => {
    expect(validateQuickCustomer({ name: 'A', phone: '9876543210' }).name).toBeDefined();
    expect(validateQuickCustomer({ name: 'Raj', phone: '123' }).phone).toBeDefined();
    expect(validateQuickCustomer({ name: 'Raj Sharma', phone: '9876543210' })).toEqual({});
  });

  it('validates optional email and PAN if provided', () => {
    expect(validateQuickCustomer({ name: 'Raj', phone: '9876543210', email: 'invalid-email' }).email).toBeDefined();
    expect(validateQuickCustomer({ name: 'Raj', phone: '9876543210', pan: 'BADPAN' }).pan).toBeDefined();
    expect(validateQuickCustomer({ name: 'Raj', phone: '9876543210', email: 'raj@gmail.com', pan: 'ABCDE1234F' })).toEqual({});
  });
});

describe('Admin Form Rules: Purchases & Suppliers (PurchaseSupplierSection)', () => {
  const basePurchase = {
    supplier_id: 'supp-101',
    item_description: '22K Gold Cast Bullion Ingot',
    gross_weight: 100.5,
    net_weight: 100.0,
    rate_per_gram: 7200,
    total_amount: 720000,
    paid_amount: 500000,
    payment_mode: 'bank_transfer'
  };

  it('validates a correct purchase invoice', () => {
    const errors = validatePurchaseEntry(basePurchase);
    expect(hasErrors(errors)).toBe(false);
  });

  it('rejects net weight greater than gross weight', () => {
    const errors = validatePurchaseEntry({
      ...basePurchase,
      gross_weight: 50.0,
      net_weight: 52.0
    });
    expect(errors.net_weight).toContain('cannot exceed gross weight');
  });

  it('accepts net weight exactly equal to gross weight (pure bullion)', () => {
    const errors = validatePurchaseEntry({
      ...basePurchase,
      gross_weight: 50.0,
      net_weight: 50.0
    });
    expect(errors.net_weight).toBeUndefined();
  });

  it('rejects zero or negative gross/net weight and rate', () => {
    expect(validatePurchaseEntry({ ...basePurchase, gross_weight: 0 }).gross_weight).toBeDefined();
    expect(validatePurchaseEntry({ ...basePurchase, net_weight: 0 }).net_weight).toBeDefined();
    expect(validatePurchaseEntry({ ...basePurchase, rate_per_gram: 0 }).rate_per_gram).toBeDefined();
  });

  it('rejects paid amount exceeding total amount', () => {
    const errors = validatePurchaseEntry({
      ...basePurchase,
      total_amount: 100000,
      paid_amount: 120000
    });
    expect(errors.paid_amount).toContain('cannot exceed total bill amount');
  });

  it('validates supplier registration form & prevents duplicate GSTIN', () => {
    const suppliers = [{ id: 's1', gstin: '33AAAAA0000A1Z5' }];

    // Missing name or phone
    expect(validateSupplierForm({ name: 'A', phone: '9876543210' }).name).toBeDefined();
    expect(validateSupplierForm({ name: 'ABC Bullion', phone: '123' }).phone).toBeDefined();

    // Invalid GSTIN format
    expect(validateSupplierForm({ name: 'ABC Bullion', phone: '9876543210', gstin: 'INVALID' }).gstin).toBeDefined();

    // Duplicate GSTIN
    const dup = validateSupplierForm({ name: 'ABC Bullion', phone: '9876543210', gstin: '33AAAAA0000A1Z5' }, suppliers);
    expect(dup.gstin).toContain('already registered');

    // Unregistered / blank GSTIN is allowed
    expect(validateSupplierForm({ name: 'Local Goldsmith', phone: '9876543210', gstin: 'Unregistered' })).toEqual({});
    expect(validateSupplierForm({ name: 'Local Goldsmith', phone: '9876543210', gstin: '' })).toEqual({});
  });
});

describe('Admin Form Rules: Diamonds & Gemstones (DiamondGemSection)', () => {
  const baseDiamond = {
    certificate_number: 'GIA-2219034',
    lab: 'GIA',
    carat: 1.25,
    cost_price: 85000,
    selling_price: 110000
  };

  it('accepts valid diamond grading specifications', () => {
    expect(validateDiamondEntry(baseDiamond)).toEqual({});
  });

  it('rejects duplicate certificate numbers for the same grading lab', () => {
    const existing = [{ id: 'd1', certificate_number: 'GIA-2219034', lab: 'GIA' }];
    const dup = validateDiamondEntry(baseDiamond, existing);
    expect(dup.certificate_number).toContain('already exists for lab GIA');

    // Same certificate for DIFFERENT lab is allowed (different lab registries)
    const diffLab = validateDiamondEntry({ ...baseDiamond, lab: 'IGI' }, existing);
    expect(diffLab.certificate_number).toBeUndefined();
  });

  it('validates carat bounds between 0.01 and 50 ct', () => {
    expect(validateDiamondEntry({ ...baseDiamond, carat: 0.005 }).carat).toBeDefined();
    expect(validateDiamondEntry({ ...baseDiamond, carat: 55 }).carat).toBeDefined();
    expect(validateDiamondEntry({ ...baseDiamond, carat: 0.01 }).carat).toBeUndefined();
    expect(validateDiamondEntry({ ...baseDiamond, carat: 50 }).carat).toBeUndefined();
  });

  it('enforces selling price not below cost price', () => {
    const errors = validateDiamondEntry({
      ...baseDiamond,
      cost_price: 100000,
      selling_price: 80000
    });
    expect(errors.selling_price).toContain('cannot be below purchase cost');
  });
});

describe('Admin Form Rules: Settings, Live Rates & Bank Custody', () => {
  it('validates AdminSettings bounds for GST, interest, buffers and hallmark fee', () => {
    const valid = {
      storeName: 'YAZHINI Fine Jewels',
      gstRate: 3.0,
      defaultInterestRate: 18.0,
      makingChargeBuffer: 5.0,
      hallmarkFee: 45,
      storePhone: '9876543210',
      storeEmail: 'contact@yazhini.in',
      storeGstin: '33AAAAA0000A1Z5'
    };
    expect(validateAdminSettings(valid)).toEqual({});

    expect(validateAdminSettings({ ...valid, gstRate: 30 }).gstRate).toBeDefined();
    expect(validateAdminSettings({ ...valid, defaultInterestRate: 120 }).defaultInterestRate).toBeDefined();
    expect(validateAdminSettings({ ...valid, hallmarkFee: 1500 }).hallmarkFee).toBeDefined();
  });

  it('validates LiveRateAdjustments limits (gold/platinum +/- 5000, silver +/- 500)', () => {
    const valid = {
      goldAdjustmentPerGram: 150,
      silverAdjustmentPerGram: -25,
      platinumAdjustmentPerGram: 200,
      refreshIntervalMinutes: 15,
      cacheTtlMinutes: 15
    };
    expect(validateLiveRateAdjustments(valid)).toEqual({});

    expect(validateLiveRateAdjustments({ ...valid, goldAdjustmentPerGram: 5500 }).goldAdjustmentPerGram).toBeDefined();
    expect(validateLiveRateAdjustments({ ...valid, silverAdjustmentPerGram: 600 }).silverAdjustmentPerGram).toBeDefined();
    expect(validateLiveRateAdjustments({ ...valid, platinumAdjustmentPerGram: -6000 }).platinumAdjustmentPerGram).toBeDefined();
  });

  it('validates Bank Pledge Entry and Receive forms', () => {
    const entryValid = {
      pledge_id: 'PL-1001',
      bank_name: 'State Bank of India',
      loan_amount: 80000,
      interest_rate: 9.5,
      sent_date: new Date().toISOString().split('T')[0]
    };
    expect(validateBankPledgeEntry(entryValid)).toEqual({});

    // Future date rejected
    expect(validateBankPledgeEntry({ ...entryValid, sent_date: '2099-01-01' }).sent_date).toBeDefined();

    const receiveValid = {
      amount_paid: 80000,
      interest_amount: 3200,
      received_date: new Date().toISOString().split('T')[0],
      bankDisbursedAmount: 80000
    };
    expect(validateBankPledgeReceive(receiveValid)).toEqual({});

    // Principal paid exceeding bank disbursement rejected
    expect(validateBankPledgeReceive({ ...receiveValid, amount_paid: 95000 }).amount_paid).toBeDefined();
  });

  it('validates Customer Record Payment & Message send rules', () => {
    const paymentValid = {
      amount: 5000,
      paymentMode: 'upi',
      referenceNumber: 'UPI-TXN-883921',
      totalBalance: 10000
    };
    expect(validateCustomerRecordPayment(paymentValid)).toEqual({});
    expect(validateCustomerRecordPayment({ ...paymentValid, amount: 15000 }).amount).toBeDefined();
    expect(validateCustomerRecordPayment({ ...paymentValid, referenceNumber: '' }).referenceNumber).toBeDefined();

    expect(validateCustomerSendMessage({ channel: 'whatsapp', message: 'Hi customer' })).toEqual({});
    expect(validateCustomerSendMessage({ channel: 'email', message: 'Hello', subject: '' }).subject).toBeDefined();
  });
});
