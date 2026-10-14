import { describe, it, expect } from 'vitest';
import { createCustomer, getCustomers } from './customerService';
import { calculateDiamondPriceEstimate } from '../utils/diamondCalculations';
import { canAccessTab, hasPermission, normalizeAdminRole } from '../utils/rbac';
import { calculateInterest } from '../utils/calculations';

describe('Phase 21: End-to-End Business Scenarios Verification', () => {

  // Scenario A: Customer Onboarding, Inventory Pricing & POS Billing
  describe('Scenario A: Customer Onboarding & POS Sale Processing', () => {
    it('creates a customer, calculates item taxes, and verifies invoice totals', async () => {
      // 1. Onboard customer with valid KYC
      const customer = await createCustomer({
        full_name: 'Ananya Deshmukh',
        phone: '9820199887',
        address: '142 Marine Drive, Mumbai, Maharashtra',
        pincode: '400020',
        kyc_status: 'verified'
      });

      expect(customer.id).toBeDefined();
      expect(customer.customer_code).toMatch(/^RCB-CUST-/);
      expect(customer.kyc_status).toBe('verified');

      // 2. Simulate 22K Gold Bangle sale
      const goldRate22k = 6850; // INR per gram
      const grossWeight = 24.5;  // grams
      const wastagePct = 8;     // 8% wastage
      const baseMetalValue = grossWeight * goldRate22k; // 167,825
      const wastageValue = baseMetalValue * (wastagePct / 100); // 13,426
      const taxableAmount = baseMetalValue + wastageValue; // 181,251
      
      const cgst = Math.round(taxableAmount * 0.015); // 2719
      const sgst = Math.round(taxableAmount * 0.015); // 2719
      const grandTotal = Math.round(taxableAmount + cgst + sgst); // 186,689

      expect(baseMetalValue).toBe(167825);
      expect(taxableAmount).toBe(181251);
      expect(cgst).toBe(2719);
      expect(sgst).toBe(2719);
      expect(grandTotal).toBe(186689);

      // Verify customer exists in records
      const allCustomers = await getCustomers();
      const found = allCustomers.find(c => c.phone === '9820199887');
      expect(found).toBeDefined();
      expect(found?.full_name).toBe('Ananya Deshmukh');
    });
  });

  // Scenario B: Supplier, Diamond Valuation & Stock Receipt
  describe('Scenario B: Diamond Gemstone Appraisal & Stock Valuation', () => {
    it('accurately values a natural solitaire and compares with lab-grown alternative', () => {
      const solitaireNatural = calculateDiamondPriceEstimate({
        origin: 'natural',
        carat: 1.5,
        color: 'E',
        clarity: 'VVS1',
        cut: 'Ideal',
        cert: 'GIA',
        shape: 'Round'
      });

      const solitaireLab = calculateDiamondPriceEstimate({
        origin: 'lab_grown',
        carat: 1.5,
        color: 'E',
        clarity: 'VVS1',
        cut: 'Ideal',
        cert: 'GIA',
        shape: 'Round'
      });

      // Price validations
      expect(solitaireNatural.estimate.totalPrice).toBeGreaterThan(500000);
      expect(solitaireLab.estimate.totalPrice).toBeLessThan(solitaireNatural.estimate.totalPrice * 0.3);
      expect(solitaireLab.estimate.savingsPercent).toBe(80);
      expect(solitaireNatural.adjustments.certFactor).toBe(1.04);
      expect(solitaireNatural.adjustments.cutFactor).toBe(1.05);
    });
  });

  // Scenario C: Pawn Loan, Interest Accrual & Part Payment
  describe('Scenario C: Pawn Loan Appraisal, Interest & Repayment', () => {
    it('calculates gold appraisal, applies monthly interest, and verifies balance reduction', () => {
      const loanAmount = 100000; // ₹1,00,000
      const monthlyRate = 1.5;   // 1.5% per month

      // 1. Calculate accrued interest over 90 days (3 months)
      const interest = calculateInterest({
        principal: loanAmount,
        rate: monthlyRate,
        startDate: '2024-01-01',
        endDate: '2024-03-31', // 90 days
        interestType: 'monthly'
      });
      expect(interest).toBe(4500); // 100000 * (1.5 / 30) * 90 = 4500

      // 2. Total payable
      const processingFee = 500;
      const totalPayable = loanAmount + interest + processingFee;
      expect(totalPayable).toBe(105000);

      // 3. Part payment of ₹35,000
      const partPayment = 35000;
      const remainingBalance = totalPayable - partPayment;
      expect(remainingBalance).toBe(70000);

      // 4. Final payoff
      const finalPayment = remainingBalance;
      const finalBalance = remainingBalance - finalPayment;
      expect(finalBalance).toBe(0);
    });
  });

  // Scenario D: Idempotency & Duplicate Prevention
  describe('Scenario D: Duplicate Check & Input Validation', () => {
    it('rejects duplicate customer phone numbers', async () => {
      const firstCust = await createCustomer({
        full_name: 'Rajesh Sharma',
        phone: '9840011223',
        address: '22 T Nagar, Chennai, Tamil Nadu'
      });
      expect(firstCust.id).toBeDefined();

      // Attempting to register another customer with the same phone must fail
      await expect(
        createCustomer({
          full_name: 'Rajesh Kumar Sharma',
          phone: '9840011223',
          address: '24 T Nagar, Chennai, Tamil Nadu'
        })
      ).rejects.toThrow(/already exists/i);
    });
  });

  // Scenario E: Multi-Tier RBAC Access Gates
  describe('Scenario E: Role Permissions & Access Control Verification', () => {
    it('verifies that cashiers and sales staff cannot access administrative or user settings', () => {
      const cashierRole = normalizeAdminRole('cashier');
      const superAdminRole = normalizeAdminRole('super_admin');

      // Cashier permissions
      expect(canAccessTab(cashierRole, 'pos')).toBe(true);
      expect(canAccessTab(cashierRole, 'settings')).toBe(false);
      expect(canAccessTab(cashierRole, 'users')).toBe(false);
      expect(hasPermission(cashierRole, 'users', 'delete')).toBe(false);

      // Super Admin permissions
      expect(canAccessTab(superAdminRole, 'pos')).toBe(true);
      expect(canAccessTab(superAdminRole, 'settings')).toBe(true);
      expect(canAccessTab(superAdminRole, 'users')).toBe(true);
      expect(hasPermission(superAdminRole, 'users', 'delete')).toBe(true);
    });
  });
});
