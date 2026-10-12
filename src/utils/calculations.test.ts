import { describe, it, expect } from 'vitest';
import { calculateDaysDifference, calculateInterest } from './calculations';

describe('calculateDaysDifference', () => {
  it('returns 0 when start and end date are the same', () => {
    expect(calculateDaysDifference('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('returns correct number of days when end date is after start date', () => {
    expect(calculateDaysDifference('2026-01-01', '2026-01-05')).toBe(4);
    expect(calculateDaysDifference('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('returns 0 when end date is before start date', () => {
    expect(calculateDaysDifference('2026-01-10', '2026-01-01')).toBe(0);
  });

  it('handles ISO date strings correctly', () => {
    expect(
      calculateDaysDifference('2026-02-01T10:00:00.000Z', '2026-02-11T18:00:00.000Z')
    ).toBe(10);
  });
});

describe('calculateInterest', () => {
  it('returns 0 if days difference is 0 or negative', () => {
    const result = calculateInterest({
      principal: 10000,
      rate: 2,
      startDate: '2026-01-01',
      endDate: '2026-01-01',
      interestType: 'monthly',
    });
    expect(result).toBe(0);
  });

  it('returns 0 if principal is <= 0', () => {
    const result = calculateInterest({
      principal: 0,
      rate: 2,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      interestType: 'monthly',
    });
    expect(result).toBe(0);
  });

  it('returns 0 if rate is <= 0', () => {
    const result = calculateInterest({
      principal: 10000,
      rate: 0,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      interestType: 'monthly',
    });
    expect(result).toBe(0);
  });

  it('calculates monthly interest accurately', () => {
    // 10000 principal, 2% monthly rate, 30 days = 10000 * (2/30) * 30 / 100 = 200
    const result = calculateInterest({
      principal: 10000,
      rate: 2,
      startDate: '2026-01-01',
      endDate: '2026-01-31', // 30 days
      interestType: 'monthly',
    });
    expect(result).toBe(200);
  });

  it('calculates yearly interest accurately', () => {
    // 10000 principal, 12% yearly rate, 365 days = 10000 * (12/365) * 365 / 100 = 1200
    const result = calculateInterest({
      principal: 10000,
      rate: 12,
      startDate: '2026-01-01',
      endDate: '2027-01-01', // 365 days
      interestType: 'yearly',
    });
    expect(result).toBe(1200);
  });

  it('calculates daily interest accurately', () => {
    // 10000 principal, 0.1% daily rate, 10 days = 10000 * 0.1 * 10 / 100 = 100
    const result = calculateInterest({
      principal: 10000,
      rate: 0.1,
      startDate: '2026-01-01',
      endDate: '2026-01-11', // 10 days
      interestType: 'daily',
    });
    expect(result).toBe(100);
  });

  it('defaults to monthly calculation for unknown interest type', () => {
    const result = calculateInterest({
      principal: 10000,
      rate: 2,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      // @ts-expect-error Testing fallback behavior
      interestType: 'unknown_type',
    });
    expect(result).toBe(200);
  });

  it('rounds to 2 decimal places', () => {
    // 15555 principal, 1.75% monthly rate, 17 days
    // 15555 * (1.75 / 30) * 17 / 100 = 154.254166... -> 154.25
    const result = calculateInterest({
      principal: 15555,
      rate: 1.75,
      startDate: '2026-01-01',
      endDate: '2026-01-18', // 17 days
      interestType: 'monthly',
    });
    expect(result).toBe(154.25);
  });
});
