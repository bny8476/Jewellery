import { describe, it, expect } from 'vitest';
import {
  validatePosBilling,
  validateQuickCustomer,
  type PosBillingInput,
  type QuickCustomerInput
} from '../../utils/adminFormRules';

describe('SalesBillingSection POS Validation & Statutory Enforcements', () => {
  const dummyItem = {
    jewelry_item_id: 'item-101',
    item_name: '22K Traditional Gold Haram',
    quantity: 1,
    unit_price: 250000,
    subtotal: 250000
  };

  it('rejects an empty cart with error', () => {
    const input: PosBillingInput = {
      cartItems: [],
      subtotal: 0,
      makingCharges: 0,
      discount: 0,
      payableTotal: 0,
      paymentMethod: 'cash'
    };
    const errors = validatePosBilling(input);
    expect(errors.cart).toBeDefined();
    expect(errors.cart).toContain('at least one jewelry item');
  });

  it('rejects a cash sale of ₹2,00,000 under Income Tax Sec 269ST', () => {
    const input: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 200000,
      makingCharges: 0,
      discount: 0,
      payableTotal: 200000,
      paymentMethod: 'cash',
      panNumber: 'ABCDE1234F' // PAN present, but cash is ₹2L
    };
    const errors = validatePosBilling(input);
    expect(errors.paymentMethod).toBeDefined();
    expect(errors.paymentMethod).toContain('Sec 269ST');
    expect(errors.paymentMethod).toContain('₹2,00,000');
  });

  it('rejects cash sale when prior cash today + this bill reaches ₹2,00,000', () => {
    const input: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 50000,
      makingCharges: 0,
      discount: 0,
      payableTotal: 50000,
      paymentMethod: 'cash',
      cashReceivedTodayFromCustomer: 150000 // 150,000 + 50,000 = 200,000
    };
    const errors = validatePosBilling(input);
    expect(errors.paymentMethod).toBeDefined();
    expect(errors.paymentMethod).toContain('Sec 269ST');
  });

  it('allows cash sale under ₹2,00,000 (e.g. ₹1,99,999)', () => {
    const input: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 199999,
      makingCharges: 0,
      discount: 0,
      payableTotal: 199999,
      paymentMethod: 'cash',
      cashReceivedTodayFromCustomer: 0
    };
    const errors = validatePosBilling(input);
    expect(errors.paymentMethod).toBeUndefined();
    expect(errors.panNumber).toBeUndefined(); // <= 200,000 so PAN not mandatory
  });

  it('blocks sale > ₹2,00,000 without PAN under Rule 114B', () => {
    const input: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 250000,
      makingCharges: 0,
      discount: 0,
      payableTotal: 250000,
      paymentMethod: 'neft',
      paymentReference: 'CMS982348274',
      panNumber: ''
    };
    const errors = validatePosBilling(input);
    expect(errors.panNumber).toBeDefined();
    expect(errors.panNumber).toContain('Rule 114B');
    expect(errors.panNumber).toContain('2,00,000');
  });

  it('blocks sale > ₹2,00,000 with invalid PAN format', () => {
    const input: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 250000,
      makingCharges: 0,
      discount: 0,
      payableTotal: 250000,
      paymentMethod: 'upi',
      paymentReference: 'UPI12345678',
      panNumber: 'ABCDE12345' // invalid last char (must be letter)
    };
    const errors = validatePosBilling(input);
    expect(errors.panNumber).toBeDefined();
    expect(errors.panNumber).toContain('valid 10-character PAN');
  });

  it('proceeds with sale > ₹2,00,000 when valid PAN and valid non-cash UTR provided', () => {
    const input: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 250000,
      makingCharges: 0,
      discount: 0,
      payableTotal: 250000,
      paymentMethod: 'neft',
      paymentReference: 'NEFT20261021001',
      panNumber: 'ABCDE1234F'
    };
    const errors = validatePosBilling(input);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('blocks non-cash sale (card/upi/neft) when payment reference is missing or too short', () => {
    const missingRef: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 50000,
      makingCharges: 0,
      discount: 0,
      payableTotal: 50000,
      paymentMethod: 'card',
      paymentReference: ''
    };
    expect(validatePosBilling(missingRef).paymentReference).toContain('required');

    const shortRef: PosBillingInput = {
      ...missingRef,
      paymentReference: '123'
    };
    expect(validatePosBilling(shortRef).paymentReference).toContain('at least 6');
  });

  it('rejects negative discount or discount exceeding items subtotal + making charges', () => {
    const negativeDiscount: PosBillingInput = {
      cartItems: [dummyItem],
      subtotal: 50000,
      makingCharges: 5000,
      discount: -100,
      payableTotal: 55000,
      paymentMethod: 'cash'
    };
    expect(validatePosBilling(negativeDiscount).discount).toContain('cannot be negative');

    const excessiveDiscount: PosBillingInput = {
      ...negativeDiscount,
      discount: 60000
    };
    expect(validatePosBilling(excessiveDiscount).discount).toContain('cannot exceed total');
  });

  it('validates quick customer creation modal in POS', () => {
    const invalid: QuickCustomerInput = {
      name: 'A',
      phone: '123'
    };
    const errors = validateQuickCustomer(invalid);
    expect(errors.name).toBeDefined();
    expect(errors.phone).toBeDefined();

    const valid: QuickCustomerInput = {
      name: 'Ramesh Sundaram',
      phone: '9840112233'
    };
    expect(Object.keys(validateQuickCustomer(valid))).toHaveLength(0);
  });
});
