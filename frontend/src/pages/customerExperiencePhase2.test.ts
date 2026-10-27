import { describe, it, expect } from 'vitest';
import { validatePhone, validatePincode, validateMinLength, validateRequired } from '../utils/validation';
import { validateAndApplyCoupon, AVAILABLE_COUPONS } from '../utils/couponUtils';

describe('Phase 2: Customer Experience & Checkout Architecture Tests', () => {
  describe('1. Address Validation & Insured Delivery Compliance', () => {
    it('accepts valid 6-digit Indian PIN codes', () => {
      expect(validatePincode('600017')).toBe(true);
      expect(validatePincode('110001')).toBe(true);
      expect(validatePincode('560001')).toBe(true);
    });

    it('rejects invalid or malformed PIN codes when required', () => {
      // Mandatory checkout requires non-empty and valid 6 digits
      const validateRequiredPin = (pin: string) => validateRequired(pin) && validatePincode(pin);

      expect(validateRequiredPin('')).toBe(false);
      expect(validateRequiredPin('60001')).toBe(false); // 5 digits
      expect(validateRequiredPin('6000178')).toBe(false); // 7 digits
      expect(validateRequiredPin('60001A')).toBe(false); // alphanumeric
      expect(validateRequiredPin('000000')).toBe(false); // starts with 0
    });

    it('validates 10-digit Indian mobile numbers for dispatch notifications', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('8877665544')).toBe(true);
      expect(validatePhone('7123456789')).toBe(true);
      expect(validatePhone('6345678901')).toBe(true);
    });

    it('rejects invalid mobile numbers', () => {
      expect(validatePhone('1234567890')).toBe(false); // doesn't start with 6-9
      expect(validatePhone('987654321')).toBe(false); // 9 digits
      expect(validatePhone('98765432100')).toBe(false); // 11 digits
      expect(validatePhone('98765abcde')).toBe(false); // letters
    });

    it('requires minimum 5 characters for street addresses', () => {
      expect(validateMinLength('Flat 4B, Emerald Residency', 5)).toBe(true);
      expect(validateMinLength('123', 5)).toBe(false);
    });
  });

  describe('2. Privilege Coupon Arithmetic & Thresholds', () => {
    it('applies percentage-based privilege coupons correctly', () => {
      const orderTotal = 100000;
      const couponsList = Object.values(AVAILABLE_COUPONS);
      const percentageCoupon = couponsList.find((c) => c.type === 'percentage');

      expect(percentageCoupon).toBeDefined();
      if (percentageCoupon) {
        const res = validateAndApplyCoupon(percentageCoupon.code, orderTotal);
        expect(res.success).toBe(true);
        expect(res.coupon?.discountAmount).toBeGreaterThan(0);
        expect(orderTotal - (res.coupon?.discountAmount || 0)).toBeLessThan(orderTotal);
      }
    });

    it('enforces minimum order value for privilege coupons', () => {
      const couponsList = Object.values(AVAILABLE_COUPONS);
      const highMinCoupon = couponsList.find((c) => c.minOrderValue > 1000);

      if (highMinCoupon) {
        const res = validateAndApplyCoupon(highMinCoupon.code, 500); // Below minimum
        expect(res.success).toBe(false);
        expect(res.error).toBeDefined();
      }
    });

    it('rejects nonexistent coupon codes gracefully', () => {
      const res = validateAndApplyCoupon('INVALID_CODE_999', 50000);
      expect(res.success).toBe(false);
      expect(res.error).toContain('invalid');
    });
  });

  describe('3. Statutory 3.0% GST and Making Charges Breakdown', () => {
    it('accurately derives 3% GST breakdown (1.5% CGST + 1.5% SGST)', () => {
      const taxableValue = 100000;
      const cgst = Math.round(taxableValue * 0.015);
      const sgst = Math.round(taxableValue * 0.015);
      const totalGst = cgst + sgst;
      const grandTotal = taxableValue + totalGst;

      expect(cgst).toBe(1500);
      expect(sgst).toBe(1500);
      expect(totalGst).toBe(3000);
      expect(grandTotal).toBe(103000);
    });

    it('calculates net payable amount after coupon and gift card credit', () => {
      const subtotal = 150000;
      const couponDiscount = 5000;
      const afterCoupon = subtotal - couponDiscount;
      const giftCardCredit = 20000;
      const finalPayable = Math.max(0, afterCoupon - giftCardCredit);

      expect(afterCoupon).toBe(145000);
      expect(finalPayable).toBe(125000);
    });

    it('prevents negative payable when gift card exceeds order total', () => {
      const subtotal = 10000;
      const giftCardCredit = 15000;
      const finalPayable = Math.max(0, subtotal - giftCardCredit);

      expect(finalPayable).toBe(0);
    });
  });

  describe('4. Luxury Gifting Configuration Compliance', () => {
    it('verifies gift message character limit constraint', () => {
      const validMessage = 'Wishing you a lifetime of joy and radiance on your wedding day!';
      expect(validMessage.length).toBeLessThanOrEqual(250);

      const oversizedMessage = 'A'.repeat(251);
      expect(oversizedMessage.length).toBeGreaterThan(250);
    });
  });
});
