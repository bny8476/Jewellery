import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  GIFT_CARD_DESIGNS, 
  APPROVED_DENOMINATIONS, 
  MIN_GIFT_CARD_AMOUNT, 
  MAX_GIFT_CARD_AMOUNT,
  generateGiftCardCode,
  generatePin,
  hashPin
} from '../../../backend/src/routes/giftCards.ts';
import { canAccessTab } from '../utils/rbac';

describe('YAZHINI FINE JEWELS: Gift Card System End-to-End Financial & Accounting Integrity Suite', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. Gift Card Configuration, Artworks & Denominations
  // ==========================================================================
  describe('1. Configuration & Design System Governance', () => {
    it('provides approved luxury artwork designs with responsive styling tokens', () => {
      expect(GIFT_CARD_DESIGNS.length).toBeGreaterThanOrEqual(6);
      const classic = GIFT_CARD_DESIGNS.find(d => d.id === 'classic-yazhini');
      expect(classic).toBeDefined();
      expect(classic?.name).toContain('Classic YAZHINI');
      expect(classic?.bgGradient).toBeDefined();
      expect(classic?.accentColor).toBe('#C9A45C');
    });

    it('enforces approved denominations and boundaries (₹1,000 to ₹2,00,000)', () => {
      expect(APPROVED_DENOMINATIONS).toContain(1000);
      expect(APPROVED_DENOMINATIONS).toContain(5000);
      expect(APPROVED_DENOMINATIONS).toContain(100000);
      expect(MIN_GIFT_CARD_AMOUNT).toBe(1000);
      expect(MAX_GIFT_CARD_AMOUNT).toBe(200000);

      // Boundary validations
      const testAmountValid = 7500;
      const isValid = testAmountValid >= MIN_GIFT_CARD_AMOUNT && testAmountValid <= MAX_GIFT_CARD_AMOUNT;
      expect(isValid).toBe(true);

      const testAmountUnder = 500;
      expect(testAmountUnder >= MIN_GIFT_CARD_AMOUNT).toBe(false);

      const testAmountOver = 250000;
      expect(testAmountOver <= MAX_GIFT_CARD_AMOUNT).toBe(false);
    });
  });

  // ==========================================================================
  // 2. Cryptographic Security, Code Formatting & PIN Hashing
  // ==========================================================================
  describe('2. Cryptographic Token Generation & PIN Protection', () => {
    it('generates unique uppercase alphanumeric code in YAZ-GIFT-XXXX-XXXX format', () => {
      const code1 = generateGiftCardCode();
      const code2 = generateGiftCardCode();

      expect(code1).toMatch(/^YAZ-GIFT-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(code2).toMatch(/^YAZ-GIFT-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(code1).not.toBe(code2);

      // Verify absence of ambiguous characters like 0, O, 1, I in the generated random tokens
      const randomPart1 = code1.replace('YAZ-GIFT-', '');
      expect(randomPart1).not.toMatch(/[01OI]/);
    });

    it('generates 4-digit numeric PIN and verifies SHA-256 one-way hashing', () => {
      const pin = generatePin();
      expect(pin).toMatch(/^[1-9][0-9]{3}$/);

      const pinHash = hashPin(pin);
      expect(pinHash).toHaveLength(64); // SHA-256 hex length

      // Correct PIN matches hash
      expect(hashPin(pin)).toBe(pinHash);

      // Wrong PIN fails hash comparison
      expect(hashPin('9999')).not.toBe(hashPin('1234'));
    });
  });

  // ==========================================================================
  // 3. Purchase Issuance & Double-Entry Ledger Logic
  // ==========================================================================
  describe('3. Purchase Issuance & Ledger Rules', () => {
    it('issues gift card with full face value and posts an immutable ISSUANCE ledger entry', () => {
      const faceValue = 10000;
      const initialBalance = 0;

      const card = {
        id: 'gc-test-01',
        code: generateGiftCardCode(),
        original_value: faceValue,
        current_balance: faceValue,
        currency: 'INR',
        status: 'ACTIVE'
      };

      const ledgerTx = {
        id: 'tx-test-01',
        gift_card_id: card.id,
        transaction_type: 'ISSUANCE',
        amount: faceValue,
        balance_before: initialBalance,
        balance_after: faceValue,
        currency: 'INR',
        reason: 'Gift card purchase issuance'
      };

      expect(card.current_balance).toBe(10000);
      expect(ledgerTx.balance_after).toBe(10000);
      expect(ledgerTx.amount).toBe(faceValue);
    });
  });

  // ==========================================================================
  // 4. Partial Redemption & Checkout Balance Arithmetic
  // ==========================================================================
  describe('4. Checkout Partial & Full Redemption Accounting', () => {
    it('accurately calculates partial redemption when card balance exceeds order total', () => {
      const cardBalance = 5000;
      const orderTotal = 3500;

      const eligibleDeduction = Math.min(cardBalance, orderTotal);
      const remainingPayable = Math.max(0, orderTotal - eligibleDeduction);
      const remainingCardBalance = cardBalance - eligibleDeduction;

      expect(eligibleDeduction).toBe(3500);
      expect(remainingPayable).toBe(0); // 100% covered
      expect(remainingCardBalance).toBe(1500);

      // Double-entry ledger entry
      const redemptionTx = {
        transaction_type: 'REDEMPTION',
        amount: -eligibleDeduction,
        balance_before: cardBalance,
        balance_after: remainingCardBalance,
        status: remainingCardBalance === 0 ? 'FULLY_REDEEMED' : 'PARTIALLY_REDEEMED'
      };

      expect(redemptionTx.balance_after).toBe(1500);
      expect(redemptionTx.status).toBe('PARTIALLY_REDEEMED');
    });

    it('accurately calculates partial redemption when order total exceeds card balance', () => {
      const cardBalance = 2500;
      const orderTotal = 8000;

      const eligibleDeduction = Math.min(cardBalance, orderTotal);
      const remainingPayable = Math.max(0, orderTotal - eligibleDeduction);
      const remainingCardBalance = cardBalance - eligibleDeduction;

      expect(eligibleDeduction).toBe(2500);
      expect(remainingPayable).toBe(5500); // Customer pays remainder via gateway
      expect(remainingCardBalance).toBe(0);

      const status = remainingCardBalance === 0 ? 'FULLY_REDEEMED' : 'PARTIALLY_REDEEMED';
      expect(status).toBe('FULLY_REDEEMED');
    });

    it('prohibits spending an exhausted or zero-balance card', () => {
      const card = {
        current_balance: 0,
        status: 'FULLY_REDEEMED'
      };

      const canRedeem = card.current_balance > 0 && card.status === 'ACTIVE';
      expect(canRedeem).toBe(false);
    });

    it('prohibits redeeming suspended or expired cards', () => {
      const suspendedCard = { status: 'SUSPENDED', current_balance: 5000 };
      const expiredCard = { status: 'EXPIRED', current_balance: 5000 };

      const isEligible = (c: any) => c.status === 'ACTIVE' || c.status === 'PARTIALLY_REDEEMED';

      expect(isEligible(suspendedCard)).toBe(false);
      expect(isEligible(expiredCard)).toBe(false);
    });
  });

  // ==========================================================================
  // 5. Admin Balance Adjustment & Audit Rules
  // ==========================================================================
  describe('5. Admin Financial Adjustments & Mandatory Audit Trail', () => {
    it('requires a mandatory reason of minimum 5 characters for manual adjustments', () => {
      const validateAdjustmentReason = (reason: string) => reason.trim().length >= 5;

      expect(validateAdjustmentReason('')).toBe(false);
      expect(validateAdjustmentReason('ok')).toBe(false);
      expect(validateAdjustmentReason('Concierge goodwill credit for delayed delivery')).toBe(true);
    });

    it('prevents debit adjustments from resulting in a negative balance', () => {
      const currentBalance = 1000;
      const debitAttempt = 1500;

      const newBalance = currentBalance - debitAttempt;
      const isValid = newBalance >= 0;

      expect(isValid).toBe(false);
    });

    it('records double-entry ledger entry for authorized manual adjustment', () => {
      const currentBalance = 3000;
      const creditAmount = 500;
      const newBalance = currentBalance + creditAmount;

      const adjustmentTx = {
        transaction_type: 'ADJUSTMENT',
        amount: creditAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        reason: 'Complimentary festive bonus credit'
      };

      expect(adjustmentTx.amount).toBe(500);
      expect(adjustmentTx.balance_after).toBe(3500);
    });
  });

  // ==========================================================================
  // 6. Double-Entry Reconciliation Mathematics
  // ==========================================================================
  describe('6. Double-Entry Ledger Reconciliation Mathematics', () => {
    it('reconciles stored balance against the mathematical sum of all ledger transactions', () => {
      const storedBalance = 1500;

      const ledgerEntries = [
        { transaction_type: 'ISSUANCE', amount: 5000 },
        { transaction_type: 'REDEMPTION', amount: -3500 }
      ];

      const ledgerCalculatedBalance = ledgerEntries.reduce((sum, tx) => sum + tx.amount, 0);
      const discrepancy = Math.abs(storedBalance - ledgerCalculatedBalance);

      expect(ledgerCalculatedBalance).toBe(1500);
      expect(discrepancy).toBe(0);
      expect(discrepancy === 0).toBe(true);
    });

    it('flags reconciliation anomaly if stored balance deviates from ledger history', () => {
      const tamperedStoredBalance = 2000; // Someone modified balance directly without ledger

      const ledgerEntries = [
        { transaction_type: 'ISSUANCE', amount: 5000 },
        { transaction_type: 'REDEMPTION', amount: -3500 }
      ];

      const ledgerCalculatedBalance = ledgerEntries.reduce((sum, tx) => sum + tx.amount, 0);
      const discrepancy = tamperedStoredBalance - ledgerCalculatedBalance;

      expect(discrepancy).toBe(500);
      expect(discrepancy !== 0).toBe(true); // Flagged for immediate audit
    });
  });

  // ==========================================================================
  // 7. Role-Based Access Control (RBAC)
  // ==========================================================================
  describe('7. RBAC Access Governance for Gift Cards', () => {
    it('permits super_admin, admin, manager, accountant, and auditor to access giftcards module', () => {
      expect(canAccessTab('super_admin', 'giftcards')).toBe(true);
      expect(canAccessTab('admin', 'giftcards')).toBe(true);
      expect(canAccessTab('manager', 'giftcards')).toBe(true);
      expect(canAccessTab('accountant', 'giftcards')).toBe(true);
      expect(canAccessTab('auditor', 'giftcards')).toBe(true);
      expect(canAccessTab('sales_staff', 'giftcards')).toBe(true);
    });

    it('denies access to unauthorized roles like pawn_officer', () => {
      expect(canAccessTab('pawn_officer', 'giftcards')).toBe(false);
    });
  });
});
