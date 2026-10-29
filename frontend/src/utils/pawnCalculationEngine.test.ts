import { describe, it, expect } from 'vitest';
import {
  valuateCollateralItem,
  valuatePledgeCollateral,
  calculateAccruedInterest,
  allocatePawnPayment,
  generatePawnJournalEntries
} from './pawnCalculationEngine';

describe('PawnCalculationEngine — Bank-Grade Financial Engine', () => {
  const mockRates = {
    gold24k: 7200, // ₹7,200/g
    gold22k: 6600, // ₹6,600/g
    gold18k: 5400, // ₹5,400/g
    silver: 95     // ₹95/g
  };

  describe('1. Collateral Valuation & Statutory 75% LTV Cap', () => {
    it('correctly deducts stone weight from gross weight to get net precious-metal weight', () => {
      const item = {
        item_description: 'Ruby Studded Traditional Bangle',
        category: 'bangle' as const,
        gross_weight_grams: 48.5,
        stone_weight_grams: 6.5,
        purity: '22K',
        deduction_percentage: 2 // 2% melting/solder deduction
      };

      const result = valuateCollateralItem(item, mockRates);

      expect(result.gross_weight_grams).toBe(48.5);
      expect(result.stone_weight_grams).toBe(6.5);
      expect(result.net_weight_grams).toBe(42.0); // 48.5 - 6.5 = 42g
      expect(result.effective_rate_per_gram).toBe(6600); // 22K rate

      // Gross value = 42 * 6600 = 277,200
      expect(result.gross_market_value).toBe(277200);
      // Deductions = 2% of 277,200 = 5,544
      expect(result.deductions).toBe(5544);
      // Appraised value = 277,200 - 5,544 = 271,656
      expect(result.appraised_value).toBe(271656);
      // 75% LTV ceiling = floor(271656 * 0.75) = 203,742
      expect(result.max_eligible_loan_ltv75).toBe(203742);
    });

    it('correctly aggregates multiple collateral items in a single pledge', () => {
      const items = [
        {
          item_description: '22K Gold Chain',
          gross_weight_grams: 20.0,
          stone_weight_grams: 0,
          purity: '22K'
        },
        {
          item_description: '18K Solitaire Ring',
          gross_weight_grams: 10.0,
          stone_weight_grams: 2.0, // net 8g
          purity: '18K'
        }
      ];

      const totals = valuatePledgeCollateral(items, mockRates);

      expect(totals.total_gross_weight).toBe(30.0);
      expect(totals.total_stone_weight).toBe(2.0);
      expect(totals.total_net_weight).toBe(28.0);
      // Item 1: 20g * 6600 = 132,000
      // Item 2: 8g * 5400 = 43,200
      // Total Appraised = 175,200
      expect(totals.total_appraised_value).toBe(175200);
      // 75% LTV = floor(175200 * 0.75) = 131,400
      expect(totals.max_regulatory_loan_ltv).toBe(131400);
    });
  });

  describe('2. Interest Accrual & Days Calculation', () => {
    it('calculates monthly interest accurately with 30-day banking month', () => {
      // Loan ₹1,00,000 at 1.5% per month for 45 days
      const result = calculateAccruedInterest({
        principal: 100000,
        interest_rate: 1.5,
        interest_type: 'monthly',
        start_date: '2026-01-01',
        as_of_date: '2026-02-15' // 45 days
      });

      expect(result.days_elapsed).toBe(45);
      // Daily rate = 1.5 / 30 = 0.05% per day
      // 45 days = 45 * 0.05% = 2.25%
      // ₹1,00,000 * 2.25% = ₹2,250
      expect(result.accrued_interest).toBe(2250);
      expect(result.total_payoff_amount).toBe(102250);
    });

    it('identifies overdue loans beyond grace period and applies default penalty', () => {
      const result = calculateAccruedInterest({
        principal: 50000,
        interest_rate: 1.2,
        interest_type: 'monthly',
        start_date: '2025-01-01',
        due_date: '2025-07-01',
        as_of_date: '2025-08-01', // 31 days past due date (grace period 7 days)
        grace_period_days: 7,
        penalty_rate: 0.5 // 0.5% monthly penalty
      });

      expect(result.is_overdue).toBe(true);
      expect(result.days_overdue).toBe(31);
      expect(result.penalty_interest).toBeGreaterThan(0);
      expect(result.total_interest_due).toBe(result.accrued_interest + result.penalty_interest);
    });
  });

  describe('3. Payment Waterfall Allocation (Banker\'s Rule)', () => {
    it('allocates payment strictly: fees -> interest -> principal reduction', () => {
      const principal = 80000;
      const accruedInterest = 2400;
      const docFee = 150;
      const payment = 10000;

      const allocation = allocatePawnPayment(payment, principal, accruedInterest, docFee);

      expect(allocation.allocated_to_fees).toBe(150);
      expect(allocation.allocated_to_interest).toBe(2400);
      // Remainder: 10,000 - 150 - 2400 = 7,450 to principal
      expect(allocation.allocated_to_principal).toBe(7450);
      expect(allocation.new_principal_balance).toBe(72550); // 80,000 - 7,450
      expect(allocation.new_accrued_interest).toBe(0);
      expect(allocation.new_fees_balance).toBe(0);
      expect(allocation.is_fully_settled).toBe(false);
    });

    it('detects complete settlement when full principal and interest are paid', () => {
      const principal = 50000;
      const accruedInterest = 1500;
      const payment = 51500;

      const allocation = allocatePawnPayment(payment, principal, accruedInterest);

      expect(allocation.allocated_to_interest).toBe(1500);
      expect(allocation.allocated_to_principal).toBe(50000);
      expect(allocation.new_principal_balance).toBe(0);
      expect(allocation.new_accrued_interest).toBe(0);
      expect(allocation.is_fully_settled).toBe(true);
    });
  });

  describe('4. Double-Entry Accounting Journal Integrity', () => {
    it('creates balanced journal entries for disbursement', () => {
      const entries = generatePawnJournalEntries('disbursement', {
        pledge_number: 'PL-2026-001',
        customer_name: 'Sundar Pichai',
        principal_amount: 150000,
        payment_mode: 'bank_transfer'
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].debit_account).toContain('Pawn Loan Portfolio Asset');
      expect(entries[0].credit_account).toContain('HDFC Current Account');
      expect(entries[0].amount).toBe(150000);
    });

    it('creates balanced split journal entries for part repayment (interest vs principal)', () => {
      const entries = generatePawnJournalEntries('repayment', {
        pledge_number: 'PL-2026-002',
        customer_name: 'Ratan Tata',
        principal_amount: 20000,
        interest_amount: 1800,
        payment_mode: 'cash'
      });

      expect(entries).toHaveLength(2);
      expect(entries[0].entry_type).toBe('interest_collection');
      expect(entries[0].credit_account).toContain('Pawn Interest Income');
      expect(entries[0].amount).toBe(1800);

      expect(entries[1].entry_type).toBe('principal_repayment');
      expect(entries[1].credit_account).toContain('Pawn Loan Portfolio Asset');
      expect(entries[1].amount).toBe(20000);
    });
  });
});
