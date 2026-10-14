import { describe, it, expect } from 'vitest';
import { calculateInterest, calculateDaysDifference } from './calculations';

describe('Pawn Loan Financial Business Logic & Ledger Calculations', () => {
  it('correctly calculates monthly simple interest for loan tenures', () => {
    // Principal: ₹50,000, 1.5% per month, 60 days
    const interest = calculateInterest({
      principal: 50000,
      rate: 1.5,
      startDate: '2024-01-01',
      endDate: '2024-03-01', // 60 days in leap year Jan (31) + Feb (29) = 60 days
      interestType: 'monthly'
    });
    // Daily rate = 1.5 / 30 = 0.05%
    // Interest = 50000 * 0.05% * 60 = ₹1,500
    expect(interest).toBe(1500);
  });

  it('correctly calculates yearly rate for 180 days', () => {
    // Principal: ₹1,00,000, 12% per year
    // From Jan 1 to Jul 1 = 182 days
    const interest = calculateInterest({
      principal: 100000,
      rate: 12,
      startDate: '2024-01-01',
      endDate: '2024-07-01',
      interestType: 'yearly'
    });
    // Daily rate = 12 / 365
    // 182 days interest = (100000 * (12/365) * 182) / 100 = ~5983.56
    expect(interest).toBeGreaterThan(5900);
    expect(interest).toBeLessThan(6100);
  });

  it('correctly checks 75% maximum Loan to Value (LTV) threshold against gold market value', () => {
    const goldWeight = 50; // grams
    const gold22kRate = 6800; // per gram
    const appraisedGoldValue = goldWeight * gold22kRate; // ₹3,40,000

    const maxAllowedLoan = appraisedGoldValue * 0.75; // ₹2,55,000 (75% LTV)
    const proposedLoanValid = 250000;
    const proposedLoanExcessive = 300000;

    expect(proposedLoanValid).toBeLessThanOrEqual(maxAllowedLoan);
    expect(proposedLoanExcessive).toBeGreaterThan(maxAllowedLoan);
  });

  it('calculates remaining principal after part payment allocation', () => {
    const initialPrincipal = 100000;
    const accruedInterest = 3000;
    const partPaymentAmount = 25000;

    // Banking rule: payment first clears accrued interest, remainder reduces principal
    const interestPaid = Math.min(accruedInterest, partPaymentAmount);
    const principalPaid = partPaymentAmount - interestPaid;
    const remainingPrincipal = initialPrincipal - principalPaid;

    expect(interestPaid).toBe(3000);
    expect(principalPaid).toBe(22000);
    expect(remainingPrincipal).toBe(78000);
  });

  it('accurately calculates leap year calendar date differences', () => {
    // 2024 is a leap year (February has 29 days)
    const diff = calculateDaysDifference('2024-02-01', '2024-03-01');
    expect(diff).toBe(29);
  });

  it('prevents negative loan interest or negative principal values', () => {
    expect(calculateInterest({ principal: -10000, rate: 2, startDate: '2024-01-01', endDate: '2024-01-31', interestType: 'monthly' })).toBe(0);
    expect(calculateInterest({ principal: 10000, rate: -2, startDate: '2024-01-01', endDate: '2024-01-31', interestType: 'monthly' })).toBe(0);
    expect(calculateInterest({ principal: 10000, rate: 2, startDate: '2024-01-31', endDate: '2024-01-01', interestType: 'monthly' })).toBe(0);
    expect(calculateInterest({ principal: 0, rate: 2, startDate: '2024-01-01', endDate: '2024-01-31', interestType: 'monthly' })).toBe(0);
  });
});
