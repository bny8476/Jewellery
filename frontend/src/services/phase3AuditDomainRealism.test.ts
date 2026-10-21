import { describe, it, expect } from 'vitest';
import {
  validateHUID,
  formatHUID,
  validateGSTIN
} from '../utils/validation';
import {
  GOLD_PURITY_FINENESS,
  SILVER_PURITY_FINENESS,
  getGoldFineness,
  getSilverFineness,
  calculateNetGoldWeight,
  calculatePawnAppraisal,
  calculateCGST46Invoice,
  classifyPawnNpaStatus,
  calculateAuctionSettlement
} from '../utils/jewelleryDomain';

describe('PHASE 3 AUDIT: Domain Realism & Indian Jewellery Operations Suite', () => {

  // ==========================================================================
  // DOM-1: BIS HALLMARK UNIQUE IDENTIFIER (HUID) COMPLIANCE
  // ==========================================================================
  describe('DOM-1: BIS Hallmarking (HUID) Validation', () => {
    it('accepts valid 6-character alphanumeric BIS HUID codes', () => {
      expect(validateHUID('AB1234')).toBe(true);
      expect(validateHUID('8K9P2W')).toBe(true);
      expect(validateHUID('XY99ZZ')).toBe(true);
    });

    it('rejects invalid HUID formats (length != 6, special characters, spaces)', () => {
      expect(validateHUID('AB123')).toBe(false);       // 5 chars
      expect(validateHUID('AB12345')).toBe(false);     // 7 chars
      expect(validateHUID('AB-123')).toBe(false);      // hyphen
      expect(validateHUID('AB 123')).toBe(false);      // space
      expect(validateHUID('!@#$%^')).toBe(false);      // symbols
    });

    it('formats and cleans HUID to uppercase standard', () => {
      expect(formatHUID('ab1234')).toBe('AB1234');
      expect(formatHUID('  8k9p2w  ')).toBe('8K9P2W');
      expect(formatHUID('ab-12-34-extra')).toBe('AB1234');
    });

    it('treats empty HUID as valid for non-hallmarked/optional silver items', () => {
      expect(validateHUID('')).toBe(true);
      expect(validateHUID(null)).toBe(true);
      expect(validateHUID(undefined)).toBe(true);
    });
  });

  // ==========================================================================
  // DOM-2: INDIAN TAX & GSTIN COMPLIANCE (CGST RULE 46)
  // ==========================================================================
  describe('DOM-2: CGST Rule 46 Tax Invoice & GSTIN Verification', () => {
    it('validates 15-character Indian GSTIN format correctly', () => {
      // 33 = Tamil Nadu state code
      expect(validateGSTIN('33AAAAA0000A1Z5')).toBe(true);
      expect(validateGSTIN('33AAACR2938K1Z5')).toBe(true);
      expect(validateGSTIN('INVALID_GSTIN')).toBe(false);
      expect(validateGSTIN('123456789012345')).toBe(false);
    });

    it('calculates intra-state CGST (1.5%) + SGST (1.5%) with BIS hallmarking fees', () => {
      const invoice = calculateCGST46Invoice({
        items: [
          {
            name: '22K Gold Antique Kada',
            huid: 'AB1234',
            metalType: 'Gold',
            purity: '22K',
            grossWeight: 25.5,
            netWeight: 25.0,
            ratePerGram: 7350,
            makingCharge: 12500,
            stoneAmount: 0
          }
        ],
        isInterState: false,
        bisFeePerPiece: 45
      });

      // Metal value = 25 * 7350 = 1,83,750
      expect(invoice.subtotalMetalValue).toBe(183750);
      expect(invoice.totalMakingCharges).toBe(12500);
      expect(invoice.totalBisFees).toBe(45);
      
      const expectedGross = 183750 + 12500 + 45; // 1,96,295
      expect(invoice.grossSubtotal).toBe(expectedGross);
      expect(invoice.taxableValue).toBe(expectedGross);

      // Intra-state: 1.5% CGST, 1.5% SGST, 0% IGST
      expect(invoice.cgstRate).toBe(1.5);
      expect(invoice.sgstRate).toBe(1.5);
      expect(invoice.igstRate).toBe(0);
      expect(invoice.cgstAmount).toBe(Math.round(expectedGross * 0.015 * 100) / 100);
      expect(invoice.sgstAmount).toBe(Math.round(expectedGross * 0.015 * 100) / 100);
      expect(invoice.totalGst).toBe(invoice.cgstAmount + invoice.sgstAmount);
      expect(invoice.finalInvoiceAmount).toBe(Math.round(expectedGross + invoice.totalGst));
    });

    it('calculates inter-state IGST (3.0%) for out-of-state shipments', () => {
      const invoice = calculateCGST46Invoice({
        items: [
          {
            name: 'Diamond Solitaire Ring 18K',
            huid: '8K9P2W',
            metalType: 'Gold',
            purity: '18K',
            grossWeight: 4.8,
            netWeight: 4.2,
            ratePerGram: 6015,
            makingCharge: 6500,
            stoneAmount: 85000
          }
        ],
        isInterState: true
      });

      expect(invoice.isInterState).toBe(true);
      expect(invoice.cgstRate).toBe(0);
      expect(invoice.sgstRate).toBe(0);
      expect(invoice.igstRate).toBe(3.0);
      expect(invoice.igstAmount).toBe(Math.round(invoice.taxableValue * 0.03 * 100) / 100);
    });
  });

  // ==========================================================================
  // DOM-3: KARATAGE PURITY, NET WEIGHT & MELTING LOSS
  // ==========================================================================
  describe('DOM-3: Karatage Fineness & Net Gold Weight Appraisal', () => {
    it('maps official gold fineness standards correctly', () => {
      expect(getGoldFineness('24K (999)')).toBe(999);
      expect(getGoldFineness('22K')).toBe(916);
      expect(getGoldFineness('18K')).toBe(750);
      expect(getGoldFineness('14K')).toBe(585);
      expect(getGoldFineness('9K')).toBe(375);
    });

    it('accurately deducts stones, wax, and enamel from gross weight', () => {
      const result = calculateNetGoldWeight({
        grossWeight: 50.0,
        stoneWeight: 3.5,
        waxWeight: 1.2,
        enamelWeight: 0.3,
        meltingLossPercent: 1.0,
        purity: '22K'
      });

      // Total deductions = 3.5 + 1.2 + 0.3 = 5.0g
      expect(result.totalDeductions).toBe(5.0);
      expect(result.netWeight).toBe(45.0);
      
      // Melting loss 1% of 45 = 0.45g
      expect(result.meltingLossGrams).toBe(0.45);
      expect(result.billableNetWeight).toBe(44.55);

      // Pure gold content (91.6% of 44.55g)
      expect(result.pureGoldGrams).toBe(Math.round(44.55 * 0.916 * 1000) / 1000);
    });

    it('enforces regulatory 75% maximum Loan-to-Value (LTV) on gold loans', () => {
      const appraisal = calculatePawnAppraisal({
        grossWeight: 100.0,
        stoneWeight: 0,
        purity: '22K',
        gold24kRate: 7850,
        meltingLossPercent: 1.0,
        maxLtvPercent: 75
      });

      // Net weight after 1% melting allowance = 99.0g
      expect(appraisal.netWeight).toBe(100);
      expect(appraisal.ltvPercent).toBe(75);

      // Max loan cannot exceed 75% of appraised market value
      expect(appraisal.maxEligibleLoan).toBeLessThanOrEqual(Math.round(appraisal.appraisedMarketValue * 0.75));
      expect(appraisal.maxEligibleLoan).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // DOM-4 & DOM-5: GOLD LOAN NPA RULES & AUCTION SETTLEMENT
  // ==========================================================================
  describe('DOM-4 & DOM-5: Gold Loan NPA Classification & Borrower Surplus Settlement', () => {
    it('classifies loans within maturity as standard / performing', () => {
      const res = classifyPawnNpaStatus('2026-11-01', '2026-10-21');
      expect(res.assetClass).toBe('standard');
      expect(res.overdueDays).toBe(0);
      expect(res.isNpa).toBe(false);
      expect(res.auctionEligible).toBe(false);
    });

    it('marks loans 1-30 days overdue as SMA-0 reminder stage', () => {
      const res = classifyPawnNpaStatus('2026-10-01', '2026-10-21');
      expect(res.assetClass).toBe('sma_0');
      expect(res.overdueDays).toBe(20);
      expect(res.isNpa).toBe(false);
      expect(res.noticeStage).toBe('reminder_sms');
    });

    it('marks loans 31-60 days overdue as SMA-1 notice #1 stage', () => {
      const res = classifyPawnNpaStatus('2026-09-01', '2026-10-21');
      expect(res.assetClass).toBe('sma_1');
      expect(res.overdueDays).toBe(50);
      expect(res.noticeStage).toBe('first_notice');
    });

    it('classifies loans >= 90 days overdue as statutory NPA and auction eligible', () => {
      const res = classifyPawnNpaStatus('2026-06-01', '2026-10-21');
      expect(res.assetClass).toBe('npa');
      expect(res.overdueDays).toBeGreaterThanOrEqual(90);
      expect(res.isNpa).toBe(true);
      expect(res.auctionEligible).toBe(true);
      expect(res.noticeStage).toBe('auction_gazette');
    });

    it('mandates refund of auction surplus to borrower under Indian Pawn Broking law', () => {
      // Loan debt: Principal ₹1,00,000 + Accrued Interest ₹12,000 + Notices ₹250 + Expenses ₹500 = ₹1,12,750
      // Gold auction proceeds: ₹1,50,000
      const settlement = calculateAuctionSettlement({
        auctionProceeds: 150000,
        principalDue: 100000,
        accruedInterest: 12000,
        noticeCharges: 250,
        auctionExpenses: 500
      });

      expect(settlement.totalDuesRecoverable).toBe(112750);
      expect(settlement.isSurplus).toBe(true);
      expect(settlement.borrowerSurplusRefund).toBe(37250); // Exactly ₹1,50,000 - ₹1,12,750
      expect(settlement.shortfallDeficit).toBe(0);
      expect(settlement.settlementStatus).toBe('surplus_to_borrower');
    });

    it('calculates shortfall when auction proceeds do not cover total debt', () => {
      const settlement = calculateAuctionSettlement({
        auctionProceeds: 80000,
        principalDue: 90000,
        accruedInterest: 10000,
        noticeCharges: 250,
        auctionExpenses: 500
      });

      expect(settlement.isSurplus).toBe(false);
      expect(settlement.borrowerSurplusRefund).toBe(0);
      expect(settlement.shortfallDeficit).toBe(20750); // ₹1,00,750 - ₹80,000
      expect(settlement.settlementStatus).toBe('unrecovered_deficit');
    });
  });
});
