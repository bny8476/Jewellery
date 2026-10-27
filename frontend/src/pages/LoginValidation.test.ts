import { describe, it, expect } from 'vitest';
import { validateEmail, validateRequired, validateMinLength } from '../utils/validation';

describe('Login & Authentication Form Validation Engine', () => {
  // Helper mimicking Login.tsx validateSingleField
  const validateLoginField = (
    field: 'email' | 'password' | 'confirmPassword',
    value: string,
    options?: { isSignUp?: boolean; passwordComparison?: string }
  ): string | undefined => {
    if (field === 'email') {
      const trimmed = value.trim();
      if (!validateRequired(trimmed)) {
        return 'Email address is required';
      }
      if (!validateEmail(trimmed)) {
        return 'Please enter a valid email address';
      }
    }

    if (field === 'password') {
      if (!validateRequired(value)) {
        return 'Password is required';
      }
      if (value.length < 6) {
        return 'Password must be at least 6 characters long';
      }
    }

    if (field === 'confirmPassword' && options?.isSignUp) {
      if (!validateRequired(value)) {
        return 'Please confirm your password';
      }
      if (value !== options.passwordComparison) {
        return 'Passwords do not match';
      }
    }

    return undefined;
  };

  describe('Email Field Validation', () => {
    it('rejects completely empty email input', () => {
      expect(validateLoginField('email', '')).toBe('Email address is required');
    });

    it('rejects whitespace-only email input', () => {
      expect(validateLoginField('email', '   \t  ')).toBe('Email address is required');
    });

    it('rejects malformed email addresses', () => {
      const invalidEmails = [
        'plainaddress',
        '#@%^%#$@#$@#.com',
        '@example.com',
        'Joe Smith <email@example.com>',
        'email.example.com',
        'email@example@example.com',
        'email@example'
      ];

      invalidEmails.forEach(invalid => {
        expect(validateLoginField('email', invalid)).toBe('Please enter a valid email address');
      });
    });

    it('accepts properly formatted client and admin email addresses with optional leading/trailing spaces', () => {
      const validEmails = [
        'patron@rcbjewelry.in',
        '  patron@rcbjewelry.in  ',
        'admin@luxury.com',
        'manager@luxury.com',
        'staff@luxury.com',
        'royal.patron+bespoke@yazhini.co.in'
      ];

      validEmails.forEach(valid => {
        expect(validateLoginField('email', valid)).toBeUndefined();
      });
    });
  });

  describe('Password Field Validation', () => {
    it('rejects completely empty password input', () => {
      expect(validateLoginField('password', '')).toBe('Password is required');
    });

    it('rejects passwords shorter than 6 characters', () => {
      expect(validateLoginField('password', '123')).toBe('Password must be at least 6 characters long');
      expect(validateLoginField('password', 'pass')).toBe('Password must be at least 6 characters long');
      expect(validateLoginField('password', 'abcde')).toBe('Password must be at least 6 characters long');
    });

    it('accepts passwords of 6 characters or longer', () => {
      expect(validateLoginField('password', 'secret')).toBeUndefined();
      expect(validateLoginField('password', 'password123')).toBeUndefined();
      expect(validateLoginField('password', 'SuperSecurePass2026!')).toBeUndefined();
    });
  });

  describe('Sign-Up Confirm Password Validation', () => {
    it('rejects empty confirm password in sign-up mode', () => {
      const err = validateLoginField('confirmPassword', '', { isSignUp: true, passwordComparison: 'royal123' });
      expect(err).toBe('Please confirm your password');
    });

    it('rejects mismatching confirm password', () => {
      const err = validateLoginField('confirmPassword', 'wrongpass', { isSignUp: true, passwordComparison: 'royal123' });
      expect(err).toBe('Passwords do not match');
    });

    it('accepts matching confirm password in sign-up mode', () => {
      const err = validateLoginField('confirmPassword', 'royal123', { isSignUp: true, passwordComparison: 'royal123' });
      expect(err).toBeUndefined();
    });
  });

  describe('Forgot Password Modal Field Validation', () => {
    const validateResetEmail = (val: string): string | undefined => {
      const trimmed = val.trim();
      if (!validateRequired(trimmed)) {
        return 'Email address is required';
      }
      if (!validateEmail(trimmed)) {
        return 'Please enter a valid email address';
      }
      return undefined;
    };

    it('rejects empty reset email', () => {
      expect(validateResetEmail('')).toBe('Email address is required');
      expect(validateResetEmail('   ')).toBe('Email address is required');
    });

    it('rejects invalid reset email', () => {
      expect(validateResetEmail('not-an-email')).toBe('Please enter a valid email address');
      expect(validateResetEmail('patron@')).toBe('Please enter a valid email address');
    });

    it('accepts valid reset email', () => {
      expect(validateResetEmail('patron@rcbjewelry.in')).toBeUndefined();
      expect(validateResetEmail('client@luxury.com')).toBeUndefined();
    });
  });
});
