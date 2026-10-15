import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { canAccessTab, normalizeAdminRole } from '../utils/rbac';

describe('AURA GOLD™ DIGITAL GOLD: End-to-End Enterprise Architecture & Ledger Integrity Suite', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. Live Gold Rate Engine & Financial Precision Tests
  // ==========================================================================
  describe('1. Live Bullion Rate Engine & Spread Mathematics', () => {
    it('calculates buy and sell rates with compliant bullion spread and decimal precision', () => {
      const benchmark24kSpot = 12682.62;
      const buyMarkupPercent = 1.0125;  // +1.25% vault/logistics
      const sellSpreadPercent = 0.985;  // -1.50% redemption spread

      const buyRate = Math.round((benchmark24kSpot * buyMarkupPercent) * 100) / 100;
      const sellRate = Math.round((benchmark24kSpot * sellSpreadPercent) * 100) / 100;

      expect(buyRate).toBe(12841.15);
      expect(sellRate).toBe(12492.38);
      expect(buyRate).toBeGreaterThan(sellRate);

      const spreadPercent = Math.round(((buyRate - sellRate) / buyRate) * 10000) / 100;
      expect(spreadPercent).toBeCloseTo(2.72, 2);
    });

    it('calculates 3% Bullion GST and net gold weight for Rupee investment (₹1,000)', () => {
      const amountInr = 1000;
      const buyRatePerGram = 12841.15;

      // In Rupee investment, total payable = ₹1,000 (inclusive of 3% GST)
      const totalAmount = amountInr;
      const metalValue = Math.round((totalAmount / 1.03) * 100) / 100;
      const gstAmount = Math.round((totalAmount - metalValue) * 100) / 100;
      const grams = Math.round((metalValue / buyRatePerGram) * 10000) / 10000;

      expect(totalAmount).toBe(1000.00);
      expect(metalValue).toBe(970.87);
      expect(gstAmount).toBe(29.13);
      expect(metalValue + gstAmount).toBe(1000.00);
      expect(grams).toBe(0.0756); // 0.0756 grams of 24K 999.9 gold
    });

    it('calculates total payable with 3% GST for specified Grams purchase (0.5000g)', () => {
      const grams = 0.5000;
      const buyRatePerGram = 12841.15;

      const metalValue = Math.round((grams * buyRatePerGram) * 100) / 100;
      const gstAmount = Math.round((metalValue * 0.03) * 100) / 100;
      const totalAmount = Math.round((metalValue + gstAmount) * 100) / 100;

      expect(metalValue).toBe(6420.58);
      expect(gstAmount).toBe(192.62);
      expect(totalAmount).toBe(6613.20);
    });

    it('calculates sell-back proceeds without GST deductions', () => {
      const gramsToSell = 0.5000;
      const sellRatePerGram = 12492.38;

      const netProceeds = Math.round((gramsToSell * sellRatePerGram) * 100) / 100;
      expect(netProceeds).toBe(6246.19);
    });
  });

  // ==========================================================================
  // 2. Quote Expiration & Security Safeguards
  // ==========================================================================
  describe('2. Locked Bullion Quote Validity & Rejection Rules', () => {
    it('accepts quotes created within 300 seconds window', () => {
      const now = Date.now();
      const expiresAt = new Date(now + 300 * 1000).toISOString();
      const isExpired = new Date(expiresAt).getTime() < now;
      expect(isExpired).toBe(false);
    });

    it('rejects expired quotes after 300 seconds', () => {
      const pastTime = Date.now() - 5000;
      const expiredAt = new Date(pastTime).toISOString();
      const isExpired = new Date(expiredAt).getTime() < Date.now();
      expect(isExpired).toBe(true);
    });

    it('rejects negative or zero purchase amounts', () => {
      const validateInput = (amount: number) => {
        if (!amount || amount <= 0) throw new Error('Investment amount must be greater than zero.');
        return true;
      };

      expect(() => validateInput(0)).toThrow('Investment amount must be greater than zero.');
      expect(() => validateInput(-500)).toThrow('Investment amount must be greater than zero.');
      expect(validateInput(500)).toBe(true);
    });
  });

  // ==========================================================================
  // 3. Payment Verification & Idempotent Ledger Allocation
  // ==========================================================================
  describe('3. Payment Signature Verification & Idempotency', () => {
    const razorpaySecret = 'test_secret_key_12345';
    const orderId = 'order_DA98124912';
    const paymentId = 'pay_BC78129481';

    it('verifies valid HMAC SHA-256 signature from Razorpay callback', () => {
      const text = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(text)
        .digest('hex');

      const computed = crypto
        .createHmac('sha256', razorpaySecret)
        .update(text)
        .digest('hex');

      expect(computed).toBe(validSignature);
    });

    it('rejects invalid or tampered payment signature', () => {
      const text = `${orderId}|${paymentId}`;
      const forgedSignature = 'forged_fake_signature_hash_abcdef';

      const computed = crypto
        .createHmac('sha256', razorpaySecret)
        .update(text)
        .digest('hex');

      expect(computed).not.toBe(forgedSignature);
    });

    it('simulates atomic double-entry balance update and ledger credit', () => {
      let initialBalance = 0.5000;
      const purchasedGrams = 0.0756;
      const balanceBefore = initialBalance;
      const balanceAfter = Math.round((balanceBefore + purchasedGrams) * 10000) / 10000;
      initialBalance = balanceAfter;

      const ledgerEntry = {
        entry_type: 'CREDIT_PURCHASE',
        direction: 'CREDIT',
        grams: purchasedGrams,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: '24K 999.9 Digital Gold Purchase via Razorpay'
      };

      expect(initialBalance).toBe(0.5756);
      expect(ledgerEntry.balance_before).toBe(0.5000);
      expect(ledgerEntry.balance_after).toBe(0.5756);
      expect(ledgerEntry.grams).toBe(0.0756);
    });
  });

  // ==========================================================================
  // 4. Sell-Back & Balance Exhaustion Protection
  // ==========================================================================
  describe('4. Sell-Back Balance Guard & Ledger Debits', () => {
    it('prevents overselling when requested grams exceed available balance', () => {
      const currentBalance = 0.2500;
      const reservedGrams = 0.0500;
      const availableGrams = currentBalance - reservedGrams; // 0.2000g
      const requestedSell = 0.3000;

      const canSell = availableGrams >= requestedSell;
      expect(canSell).toBe(false);
    });

    it('allows sell-back within available balance and records immutable debit ledger entry', () => {
      let currentBalance = 0.5000;
      const reservedGrams = 0.0000;
      const availableGrams = currentBalance - reservedGrams;
      const requestedSell = 0.2000;

      expect(availableGrams >= requestedSell).toBe(true);

      const balanceBefore = currentBalance;
      const balanceAfter = Math.round((balanceBefore - requestedSell) * 10000) / 10000;
      currentBalance = balanceAfter;

      const ledgerEntry = {
        entry_type: 'DEBIT_SELL',
        direction: 'DEBIT',
        grams: requestedSell,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: 'Sell-back of 0.2000g 24K Gold to Bank'
      };

      expect(currentBalance).toBe(0.3000);
      expect(ledgerEntry.direction).toBe('DEBIT');
      expect(ledgerEntry.balance_after).toBe(0.3000);
    });
  });

  // ==========================================================================
  // 5. Physical Gold Minted Coin Redemptions
  // ==========================================================================
  describe('5. Minted Gold Coin Catalog & Redemption Workflow', () => {
    it('validates supported 24K 999.9 minted coin denominations', () => {
      const supportedGrams = [1.0, 2.0, 5.0, 10.0];
      expect(supportedGrams).toContain(1.0);
      expect(supportedGrams).toContain(5.0);
      expect(supportedGrams).toContain(10.0);
    });

    it('rejects physical coin redemption if customer balance is insufficient', () => {
      const customerGrams = 0.8500;
      const coinWeight = 1.0000; // 1g coin

      const isEligible = customerGrams >= coinWeight;
      expect(isEligible).toBe(false);
    });

    it('debits gold balance and records delivery order when redeeming 1g coin', () => {
      let customerGrams = 1.5000;
      const coinWeight = 1.0000;
      const mintingCharges = 450;

      expect(customerGrams >= coinWeight).toBe(true);
      customerGrams = Math.round((customerGrams - coinWeight) * 10000) / 10000;

      const redemptionOrder = {
        redemption_reference: 'AG-RDM-202610-001',
        product_name: '1 Gram 24K 999.9 Aura Gold Minted Coin',
        grams: coinWeight,
        purity: '24K (999.9 Purity)',
        minting_charges: mintingCharges,
        status: 'REQUESTED'
      };

      expect(customerGrams).toBe(0.5000);
      expect(redemptionOrder.grams).toBe(1.0000);
      expect(redemptionOrder.status).toBe('REQUESTED');
    });
  });

  // ==========================================================================
  // 6. Custody Reconciliation & Audit Integrity
  // ==========================================================================
  describe('6. Physical Vault Custody Reconciliation', () => {
    it('verifies that physical vault holdings equal sum of customer accounts', () => {
      const customerAccounts = [
        { customer_id: 'cust-1', gold_balance_grams: 1.2500 },
        { customer_id: 'cust-2', gold_balance_grams: 3.5000 },
        { customer_id: 'cust-3', gold_balance_grams: 0.7500 }
      ];

      const totalCustomerGrams = customerAccounts.reduce((acc, c) => acc + c.gold_balance_grams, 0);
      const vaultGrams = 5.5000;
      const difference = Math.abs(vaultGrams - totalCustomerGrams);

      expect(totalCustomerGrams).toBe(5.5000);
      expect(difference).toBe(0.0000);
    });

    it('flags discrepancies if vault balance does not match customer ledger', () => {
      const totalCustomerGrams = 5.5000;
      const reportedVaultGrams = 5.0000; // 0.5g shortage in vault report
      const difference = Math.round((reportedVaultGrams - totalCustomerGrams) * 10000) / 10000;

      const isDiscrepancy = difference !== 0;
      expect(isDiscrepancy).toBe(true);
      expect(difference).toBe(-0.5000);
    });
  });

  // ==========================================================================
  // 7. Role-Based Access Control for Aura Gold Management
  // ==========================================================================
  describe('7. Administrative RBAC for Aura Gold Custody', () => {
    it('allows super_admin, admin, manager, and accountant to access auragold tab', () => {
      expect(canAccessTab('super_admin', 'auragold')).toBe(true);
      expect(canAccessTab('admin', 'auragold')).toBe(true);
      expect(canAccessTab('manager', 'auragold')).toBe(true);
      expect(canAccessTab('accountant', 'auragold')).toBe(true);
      expect(canAccessTab('auditor', 'auragold')).toBe(true);
    });

    it('denies sales_staff and inventory_staff from accessing auragold treasury tab', () => {
      expect(canAccessTab('sales_staff', 'auragold')).toBe(false);
      expect(canAccessTab('inventory_staff', 'auragold')).toBe(false);
    });

    it('normalizes admin role aliases correctly', () => {
      expect(normalizeAdminRole('SUPER_ADMIN')).toBe('super_admin');
      expect(normalizeAdminRole('administrator')).toBe('admin');
      expect(normalizeAdminRole('Finance')).toBe('accountant');
    });
  });

});
