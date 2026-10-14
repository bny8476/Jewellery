import { describe, it, expect } from 'vitest';
import { formatCurrencyINR, formatDate, formatWeight } from './formatters';

describe('Shared Formatters Utility', () => {
  describe('formatCurrencyINR', () => {
    it('formats integer amounts in INR', () => {
      const formatted = formatCurrencyINR(50000);
      expect(formatted).toContain('50,000');
      expect(formatted).toMatch(/₹|INR/);
    });

    it('formats zero correctly', () => {
      const formatted = formatCurrencyINR(0);
      expect(formatted).toContain('0');
    });

    it('handles null, undefined, or NaN safely by returning ₹0', () => {
      expect(formatCurrencyINR(null)).toContain('0');
      expect(formatCurrencyINR(undefined)).toContain('0');
      expect(formatCurrencyINR(NaN)).toContain('0');
    });

    it('formats large values with Indian thousand & lakh grouping', () => {
      const formatted = formatCurrencyINR(1250000);
      expect(formatted).toContain('12,50,000');
    });

    it('respects optional maximumFractionDigits', () => {
      const formatted = formatCurrencyINR(1234.56, { maximumFractionDigits: 2 });
      expect(formatted).toContain('1,234.56');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date strings', () => {
      const formatted = formatDate('2024-03-15');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('3');
      expect(formatted).toContain('15');
    });

    it('formats Date objects', () => {
      const d = new Date(2024, 0, 1);
      const formatted = formatDate(d);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('1');
    });

    it('returns empty string for null, undefined, or invalid date strings', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('formatWeight', () => {
    it('formats weight in grams with 2 decimals', () => {
      expect(formatWeight(10.5)).toBe('10.50 g');
      expect(formatWeight(8)).toBe('8.00 g');
      expect(formatWeight(0)).toBe('0.00 g');
    });

    it('handles null and undefined safely', () => {
      expect(formatWeight(null)).toBe('0.00 g');
      expect(formatWeight(undefined)).toBe('0.00 g');
    });
  });
});
