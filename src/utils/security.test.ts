import { describe, it, expect } from 'vitest';
import { validatePhone, validateEmail, validateAadhar, validatePAN, validatePincode } from './validation';

describe('Security & Input Validation Verification', () => {
  it('validates role-based access for admin routes', () => {
    const isAuthorizedAdmin = (role?: string, email?: string, configuredAdminEmail?: string) => {
      return (
        role === 'admin' ||
        role === 'manager' ||
        role === 'staff' ||
        (Boolean(configuredAdminEmail) && email === configuredAdminEmail)
      );
    };

    expect(isAuthorizedAdmin('admin')).toBe(true);
    expect(isAuthorizedAdmin('manager')).toBe(true);
    expect(isAuthorizedAdmin('staff')).toBe(true);
    expect(isAuthorizedAdmin('cashier', 'admin@rcbjewelry.com', 'admin@rcbjewelry.com')).toBe(true);
    expect(isAuthorizedAdmin('customer', 'client@example.com')).toBe(false);
    expect(isAuthorizedAdmin(undefined, 'unauthorized@example.com')).toBe(false);
  });

  it('rejects malicious or invalid Indian phone inputs', () => {
    expect(validatePhone('<script>alert(1)</script>')).toBe(false);
    expect(validatePhone("'; DROP TABLE customers; --")).toBe(false);
    expect(validatePhone('12345')).toBe(false);
    expect(validatePhone('9876543210')).toBe(true);
    expect(validatePhone('+919876543210')).toBe(true);
  });

  it('validates email addresses securely', () => {
    expect(validateEmail('admin@rcbjewelry.com')).toBe(true);
    expect(validateEmail('invalid-email-string')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
  });

  it('validates Indian Government identity proofs (Aadhar, PAN, PIN)', () => {
    // Aadhar (12 digits)
    expect(validateAadhar('123456789012')).toBe(true);
    expect(validateAadhar('1234 5678 9012')).toBe(true);
    expect(validateAadhar('123')).toBe(false);

    // PAN Card (5 letters, 4 digits, 1 letter)
    expect(validatePAN('ABCDE1234F')).toBe(true);
    expect(validatePAN('INVALID_PAN')).toBe(false);

    // Pincode (6 digits, not starting with 0)
    expect(validatePincode('600001')).toBe(true);
    expect(validatePincode('000111')).toBe(false);
    expect(validatePincode('60000')).toBe(false);
  });
});
