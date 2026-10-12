import { describe, it, expect } from 'vitest';
import {
  validatePhone,
  validateEmail,
  validatePincode,
  validateAadhar,
  validatePAN,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateDateNotFuture,
  validateDateNotPast,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  getValidationError,
} from './validation';

describe('validatePhone', () => {
  it('accepts valid 10-digit Indian phone numbers', () => {
    expect(validatePhone('9876543210')).toBe(true);
    expect(validatePhone('8123456789')).toBe(true);
    expect(validatePhone('7000000000')).toBe(true);
    expect(validatePhone('6999999999')).toBe(true);
  });

  it('accepts valid numbers with +91 prefix and formatting spaces or dashes', () => {
    expect(validatePhone('+919876543210')).toBe(true);
    expect(validatePhone('+91 98765 43210')).toBe(true);
    expect(validatePhone('98765-43210')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(validatePhone('1234567890')).toBe(false); // Does not start with 6-9
    expect(validatePhone('987654321')).toBe(false); // Only 9 digits
    expect(validatePhone('98765432100')).toBe(false); // 11 digits
    expect(validatePhone('abcdefghij')).toBe(false); // Alphabetic
  });
});

describe('validateEmail', () => {
  it('returns true for empty string (optional field)', () => {
    expect(validateEmail('')).toBe(true);
  });

  it('returns true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@sub.domain.co.in')).toBe(true);
  });

  it('returns false for invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
  });
});

describe('validatePincode', () => {
  it('returns true for empty string (optional field)', () => {
    expect(validatePincode('')).toBe(true);
  });

  it('returns true for valid 6-digit Indian pincodes', () => {
    expect(validatePincode('600001')).toBe(true);
    expect(validatePincode('110001')).toBe(true);
  });

  it('returns false for invalid pincodes', () => {
    expect(validatePincode('012345')).toBe(false); // starts with 0
    expect(validatePincode('60001')).toBe(false); // 5 digits
    expect(validatePincode('6000001')).toBe(false); // 7 digits
    expect(validatePincode('60000a')).toBe(false); // non-numeric
  });
});

describe('validateAadhar', () => {
  it('returns true for empty string (optional field)', () => {
    expect(validateAadhar('')).toBe(true);
  });

  it('returns true for valid 12-digit Aadhar numbers with or without spaces', () => {
    expect(validateAadhar('123456789012')).toBe(true);
    expect(validateAadhar('1234 5678 9012')).toBe(true);
  });

  it('returns false for invalid Aadhar numbers', () => {
    expect(validateAadhar('12345678901')).toBe(false); // 11 digits
    expect(validateAadhar('1234567890123')).toBe(false); // 13 digits
    expect(validateAadhar('12345678901a')).toBe(false);
  });
});

describe('validatePAN', () => {
  it('returns true for empty string (optional field)', () => {
    expect(validatePAN('')).toBe(true);
  });

  it('returns true for valid PAN format (case-insensitive)', () => {
    expect(validatePAN('ABCDE1234F')).toBe(true);
    expect(validatePAN('abcde1234f')).toBe(true);
  });

  it('returns false for invalid PAN format', () => {
    expect(validatePAN('ABCD12345F')).toBe(false);
    expect(validatePAN('ABCDE12345')).toBe(false);
    expect(validatePAN('12345ABCDE')).toBe(false);
  });
});

describe('validatePositiveNumber & validateNonNegativeNumber', () => {
  it('validates positive numbers correctly', () => {
    expect(validatePositiveNumber(100)).toBe(true);
    expect(validatePositiveNumber('100.5')).toBe(true);
    expect(validatePositiveNumber(0)).toBe(false);
    expect(validatePositiveNumber(-5)).toBe(false);
    expect(validatePositiveNumber('abc')).toBe(false);
  });

  it('validates non-negative numbers correctly', () => {
    expect(validateNonNegativeNumber(0)).toBe(true);
    expect(validateNonNegativeNumber(50)).toBe(true);
    expect(validateNonNegativeNumber('0')).toBe(true);
    expect(validateNonNegativeNumber(-1)).toBe(false);
    expect(validateNonNegativeNumber('xyz')).toBe(false);
  });
});

describe('validateDateNotFuture & validateDateNotPast', () => {
  it('validates date not in future', () => {
    expect(validateDateNotFuture('')).toBe(true);
    expect(validateDateNotFuture('2020-01-01')).toBe(true);

    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 2);
    expect(validateDateNotFuture(farFuture.toISOString().slice(0, 10))).toBe(false);
  });

  it('validates date not in past', () => {
    expect(validateDateNotPast('')).toBe(true);
    expect(validateDateNotPast('2010-01-01')).toBe(false);

    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 2);
    expect(validateDateNotPast(farFuture.toISOString().slice(0, 10))).toBe(true);
  });
});

describe('validateRequired, validateMinLength, validateMaxLength', () => {
  it('validates required fields correctly', () => {
    expect(validateRequired('hello')).toBe(true);
    expect(validateRequired(0)).toBe(true);
    expect(validateRequired('')).toBe(false);
    expect(validateRequired('   ')).toBe(false);
    expect(validateRequired(undefined)).toBe(false);
    expect(validateRequired(null)).toBe(false);
  });

  it('validates min and max lengths correctly', () => {
    expect(validateMinLength('abc', 3)).toBe(true);
    expect(validateMinLength('ab', 3)).toBe(false);
    expect(validateMaxLength('abcd', 4)).toBe(true);
    expect(validateMaxLength('abcde', 4)).toBe(false);
  });
});

describe('getValidationError', () => {
  it('returns required error if field is empty', () => {
    const error = getValidationError('Customer Name', '', { required: true });
    expect(error).toBe('Customer Name is required');
  });

  it('returns phone error if phone is invalid', () => {
    const error = getValidationError('Mobile', '12345', { phone: true });
    expect(error).toContain('Invalid phone number');
  });

  it('returns null when all specified validations pass', () => {
    const error = getValidationError('Mobile', '9876543210', {
      required: true,
      phone: true,
    });
    expect(error).toBeNull();
  });
});
