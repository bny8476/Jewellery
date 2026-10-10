import { describe, it, expect } from 'vitest';
import {
  validatePhone,
  validateEmail,
  validatePincode,
  validateAadhar,
  validatePAN,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNumberRange,
  isValidDate,
  validateDateNotFuture,
  validateDateNotPast,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePassword,
  validateGrossAndNetWeight,
  getValidationError,
  validateFormRecord,
  isStrictNumericString,
  validateDateRange,
  validateMatch,
  validateFile
} from './validation';

describe('isStrictNumericString', () => {
  it('identifies strict numeric strings', () => {
    expect(isStrictNumericString('100')).toBe(true);
    expect(isStrictNumericString('100.55')).toBe(true);
    expect(isStrictNumericString('-45.2')).toBe(true);
    expect(isStrictNumericString('0')).toBe(true);
    expect(isStrictNumericString('.5')).toBe(true);
  });

  it('rejects partially parsed or malformed numeric strings', () => {
    expect(isStrictNumericString('12abc')).toBe(false);
    expect(isStrictNumericString('abc')).toBe(false);
    expect(isStrictNumericString('10.5.5')).toBe(false);
    expect(isStrictNumericString('')).toBe(false);
    expect(isStrictNumericString('   ')).toBe(false);
  });
});

describe('validatePhone (Indian format)', () => {
  it('accepts valid 10-digit Indian phone numbers', () => {
    expect(validatePhone('9876543210')).toBe(true);
    expect(validatePhone('8123456789')).toBe(true);
    expect(validatePhone('7000000000')).toBe(true);
    expect(validatePhone('6999999999')).toBe(true);
  });

  it('accepts valid numbers with +91 or 0 prefix and formatting spaces or dashes', () => {
    expect(validatePhone('+919876543210')).toBe(true);
    expect(validatePhone('+91 98765 43210')).toBe(true);
    expect(validatePhone('09876543210')).toBe(true);
    expect(validatePhone('98765-43210')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(validatePhone('1234567890')).toBe(false); // Does not start with 6-9
    expect(validatePhone('987654321')).toBe(false); // Only 9 digits
    expect(validatePhone('98765432100')).toBe(false); // 11 digits without prefix
    expect(validatePhone('abcdefghij')).toBe(false); // Alphabetic
    expect(validatePhone('')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('returns true for empty string (optional field)', () => {
    expect(validateEmail('')).toBe(true);
    expect(validateEmail(null)).toBe(true);
    expect(validateEmail(undefined)).toBe(true);
  });

  it('returns true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('client.name+tag@luxury.co.in')).toBe(true);
    expect(validateEmail('admin@subdomain.rcbjewelry.com')).toBe(true);
  });

  it('returns false for invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@domain')).toBe(false);
  });
});

describe('validatePincode', () => {
  it('returns true for empty string (optional field)', () => {
    expect(validatePincode('')).toBe(true);
    expect(validatePincode(null)).toBe(true);
  });

  it('returns true for valid 6-digit Indian pincodes', () => {
    expect(validatePincode('600001')).toBe(true);
    expect(validatePincode('110001')).toBe(true);
    expect(validatePincode('560001')).toBe(true);
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
    expect(validateAadhar(null)).toBe(true);
  });

  it('returns true for valid 12-digit Aadhar numbers with or without spaces/dashes', () => {
    expect(validateAadhar('123456789012')).toBe(true);
    expect(validateAadhar('1234 5678 9012')).toBe(true);
    expect(validateAadhar('1234-5678-9012')).toBe(true);
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
  it('validates positive numbers and rejects invalid numeric strings like 12abc', () => {
    expect(validatePositiveNumber(100)).toBe(true);
    expect(validatePositiveNumber('100.5')).toBe(true);
    expect(validatePositiveNumber(0)).toBe(false);
    expect(validatePositiveNumber('0')).toBe(false);
    expect(validatePositiveNumber(-5)).toBe(false);
    expect(validatePositiveNumber('12abc')).toBe(false); // Verified defect fix
    expect(validatePositiveNumber('abc')).toBe(false);
    expect(validatePositiveNumber(NaN)).toBe(false);
    expect(validatePositiveNumber(Infinity)).toBe(false);
    expect(validatePositiveNumber('')).toBe(false);
  });

  it('validates non-negative numbers correctly', () => {
    expect(validateNonNegativeNumber(0)).toBe(true);
    expect(validateNonNegativeNumber('0')).toBe(true);
    expect(validateNonNegativeNumber(50)).toBe(true);
    expect(validateNonNegativeNumber('50.25')).toBe(true);
    expect(validateNonNegativeNumber(-1)).toBe(false);
    expect(validateNonNegativeNumber('-0.5')).toBe(false);
    expect(validateNonNegativeNumber('0abc')).toBe(false);
    expect(validateNonNegativeNumber(NaN)).toBe(false);
  });

  it('validates number range boundaries', () => {
    expect(validateNumberRange(10, 5, 20)).toBe(true);
    expect(validateNumberRange('5', 5, 20)).toBe(true);
    expect(validateNumberRange('20', 5, 20)).toBe(true);
    expect(validateNumberRange(4, 5, 20)).toBe(false);
    expect(validateNumberRange(21, 5, 20)).toBe(false);
    expect(validateNumberRange('10xyz', 5, 20)).toBe(false);
  });
});

describe('isValidDate, validateDateNotFuture & validateDateNotPast', () => {
  it('validates calendar dates properly and rejects non-dates', () => {
    expect(isValidDate('2026-05-15')).toBe(true);
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });

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
  it('validates required fields with whitespace trimming', () => {
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
    expect(validateMinLength('  ab  ', 3)).toBe(false); // trimmed length
    expect(validateMaxLength('abcd', 4)).toBe(true);
    expect(validateMaxLength('abcde', 4)).toBe(false);
  });

  it('validates password requirements', () => {
    expect(validatePassword('secret123')).toBe(true);
    expect(validatePassword('12345')).toBe(false); // Less than 6
    expect(validatePassword('', 6)).toBe(false);
  });
});

describe('validateGrossAndNetWeight', () => {
  it('accepts valid gross and net weights', () => {
    expect(validateGrossAndNetWeight(10.5, 9.8).isValid).toBe(true);
    expect(validateGrossAndNetWeight(10, 10).isValid).toBe(true);
    expect(validateGrossAndNetWeight('15.2', '14.0').isValid).toBe(true);
  });

  it('rejects invalid or negative weights', () => {
    expect(validateGrossAndNetWeight(0).isValid).toBe(false);
    expect(validateGrossAndNetWeight(-5).isValid).toBe(false);
    expect(validateGrossAndNetWeight('12abc').isValid).toBe(false);
  });

  it('rejects net weight greater than gross weight', () => {
    const result = validateGrossAndNetWeight(10, 12);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Net weight cannot exceed gross weight');
  });
});

describe('getValidationError & validateFormRecord', () => {
  it('evaluates rules and returns readable messages', () => {
    expect(getValidationError('Email', '', { required: true })).toBe('Email is required');
    expect(getValidationError('Email', 'invalid', { email: true })).toBe('Please enter a valid email address');
    expect(getValidationError('Amount', '12abc', { positiveNumber: true })).toBe('Amount must be a positive number');
  });

  it('validates entire form record accurately', () => {
    const data = {
      full_name: '',
      phone: '12345',
      loan_amount: 'invalid',
      email: ''
    };

    const rules = {
      full_name: { required: true },
      phone: { required: true, phone: true },
      loan_amount: { required: true, positiveNumber: true },
      email: { email: true } // optional
    };

    const errors = validateFormRecord(data, rules);
    expect(errors.full_name).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.loan_amount).toBeDefined();
    expect(errors.email).toBeUndefined(); // valid because empty and optional
  });

  it('validates custom validator rules and cross-field rules', () => {
    const rules = {
      score: {
        custom: (val: any) => (val > 100 ? 'Score cannot exceed 100' : null)
      }
    };

    expect(validateFormRecord({ score: 120 }, rules).score).toBe('Score cannot exceed 100');
    expect(validateFormRecord({ score: 80 }, rules).score).toBeUndefined();
  });

  it('validates date ranges and matching fields', () => {
    expect(validateDateRange('2026-01-01', '2026-01-10')).toBe(true);
    expect(validateDateRange('2026-05-01', '2026-04-01')).toBe(false);
    expect(validateMatch('password123', 'password123')).toBe(true);
    expect(validateMatch('password123', 'different')).toBe(false);
  });

  it('validates file upload constraints', () => {
    const validFile = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = validateFile(validFile, { maxSizeMB: 5, allowedTypes: ['image/jpeg', 'image/png'] });
    expect(result.isValid).toBe(true);

    const invalidType = new File(['dummy'], 'doc.exe', { type: 'application/x-msdownload' });
    const typeResult = validateFile(invalidType, { allowedTypes: ['image/jpeg'] });
    expect(typeResult.isValid).toBe(false);
  });
});
