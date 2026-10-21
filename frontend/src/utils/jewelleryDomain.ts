/**
 * Jewellery & Pawnshop Domain Engine
 * YAZHINI FINE JEWELS & PAWN SHOP
 * 
 * Formalizes Indian statutory requirements & domain realism:
 * 1. BIS Hallmarking (HUID) 6-character format & verification
 * 2. Karatage Fineness & Net Gold Weight calculation with melting/stone deductions
 * 3. CGST Rule 46 Tax Invoice breakdown (3% GST: 1.5% CGST + 1.5% SGST or 3% IGST)
 * 4. Regulatory Loan-to-Value (LTV) max 75% gold loan appraisal
 * 5. 90-day NPA classification, statutory notice stages & borrower auction surplus settlement
 */

// ============================================================================
// 1. PURITY & FINENESS STANDARDS
// ============================================================================

export const GOLD_PURITY_FINENESS: Record<string, { fineness: number; display: string }> = {
  '24K': { fineness: 999, display: '24K (999 Fine Gold)' },
  '22K': { fineness: 916, display: '22K (916 BIS Hallmarked)' },
  '18K': { fineness: 750, display: '18K (750 Fine Gold)' },
  '14K': { fineness: 585, display: '14K (585 Fine Gold)' },
  '9K': { fineness: 375, display: '9K (375 Fine Gold)' }
};

export const SILVER_PURITY_FINENESS: Record<string, { fineness: number; display: string }> = {
  '999': { fineness: 999, display: '999 Fine Silver' },
  '925': { fineness: 925, display: '925 Sterling Silver' },
  '800': { fineness: 800, display: '800 Traditional Silver' }
};

export const getGoldFineness = (purity: string): number => {
  const normalized = purity.toUpperCase();
  for (const [key, val] of Object.entries(GOLD_PURITY_FINENESS)) {
    if (normalized.includes(key) || normalized.includes(String(val.fineness))) {
      return val.fineness;
    }
  }
  return 916; // Standard default 22K hallmarked
};

export const getSilverFineness = (purity: string): number => {
  const normalized = purity.toUpperCase();
  for (const [key, val] of Object.entries(SILVER_PURITY_FINENESS)) {
    if (normalized.includes(key) || normalized.includes(String(val.fineness))) {
      return val.fineness;
    }
  }
  return 925;
};

// ============================================================================
// 2. NET WEIGHT & MELTING / STONE DEDUCTIONS
// ============================================================================

export interface NetWeightParams {
  grossWeight: number;
  stoneWeight?: number;
  waxWeight?: number;
  enamelWeight?: number;
  meltingLossPercent?: number;
  purity?: string;
}

export interface NetWeightResult {
  grossWeight: number;
  totalDeductions: number;
  netWeight: number;
  meltingLossGrams: number;
  billableNetWeight: number;
  pureGoldGrams: number;
  fineness: number;
}

export const calculateNetGoldWeight = (params: NetWeightParams): NetWeightResult => {
  const gross = Math.max(0, Number(params.grossWeight) || 0);
  const stone = Math.max(0, Number(params.stoneWeight) || 0);
  const wax = Math.max(0, Number(params.waxWeight) || 0);
  const enamel = Math.max(0, Number(params.enamelWeight) || 0);
  const meltingLossRate = Math.max(0, Math.min(10, Number(params.meltingLossPercent) || 0));

  const totalDeductions = Math.round((stone + wax + enamel) * 1000) / 1000;
  const netWeight = Math.max(0, Math.round((gross - totalDeductions) * 1000) / 1000);
  
  const meltingLossGrams = Math.round((netWeight * (meltingLossRate / 100)) * 1000) / 1000;
  const billableNetWeight = Math.max(0, Math.round((netWeight - meltingLossGrams) * 1000) / 1000);

  const fineness = getGoldFineness(params.purity || '22K');
  const pureGoldGrams = Math.round((billableNetWeight * (fineness / 1000)) * 1000) / 1000;

  return {
    grossWeight: gross,
    totalDeductions,
    netWeight,
    meltingLossGrams,
    billableNetWeight,
    pureGoldGrams,
    fineness
  };
};

// ============================================================================
// 3. REGULATORY PAWN LOAN APPRAISAL & LTV (MAX 75% RBI NORM)
// ============================================================================

export interface PawnAppraisalParams {
  grossWeight: number;
  stoneWeight?: number;
  purity?: string;
  gold24kRate: number;
  meltingLossPercent?: number;
  maxLtvPercent?: number; // Defaults to statutory 75%
}

export interface PawnAppraisalResult {
  netWeight: number;
  pureGoldWeight: number;
  effectiveRatePerGram: number;
  appraisedMarketValue: number;
  maxEligibleLoan: number;
  ltvPercent: number;
  fineness: number;
}

export const calculatePawnAppraisal = (params: PawnAppraisalParams): PawnAppraisalResult => {
  const { grossWeight, stoneWeight = 0, purity = '22K', gold24kRate } = params;
  const maxLtv = Math.min(75, Math.max(10, params.maxLtvPercent ?? 75)); // Max 75% regulatory ceiling
  const meltingLoss = params.meltingLossPercent ?? 1.0; // 1% standard melting allowance

  const weightCalc = calculateNetGoldWeight({
    grossWeight,
    stoneWeight,
    meltingLossPercent: meltingLoss,
    purity
  });

  const effectiveRate = Math.round((gold24kRate * (weightCalc.fineness / 1000)) * 100) / 100;
  const appraisedMarketValue = Math.round(weightCalc.billableNetWeight * effectiveRate);
  const maxEligibleLoan = Math.round(appraisedMarketValue * (maxLtv / 100));

  return {
    netWeight: weightCalc.netWeight,
    pureGoldWeight: weightCalc.pureGoldGrams,
    effectiveRatePerGram: effectiveRate,
    appraisedMarketValue,
    maxEligibleLoan,
    ltvPercent: maxLtv,
    fineness: weightCalc.fineness
  };
};

// ============================================================================
// 4. CGST RULE 46 TAX INVOICE BREAKDOWN
// ============================================================================

export interface InvoiceLineItem {
  name: string;
  huid?: string;
  metalType: string;
  purity: string;
  grossWeight: number;
  netWeight: number;
  ratePerGram: number;
  makingCharge: number;
  stoneAmount?: number;
}

export interface TaxInvoiceCalculationParams {
  items: InvoiceLineItem[];
  discountAmount?: number;
  isInterState?: boolean;
  bisFeePerPiece?: number; // Statutory BIS hallmarking fee ₹45/piece
}

export interface TaxInvoiceBreakdown {
  subtotalMetalValue: number;
  totalMakingCharges: number;
  totalStoneValue: number;
  totalBisFees: number;
  grossSubtotal: number;
  discount: number;
  taxableValue: number;
  isInterState: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGst: number;
  finalInvoiceAmount: number;
  roundOff: number;
}

export const calculateCGST46Invoice = (params: TaxInvoiceCalculationParams): TaxInvoiceBreakdown => {
  const { items, discountAmount = 0, isInterState = false, bisFeePerPiece = 45 } = params;

  let subtotalMetalValue = 0;
  let totalMakingCharges = 0;
  let totalStoneValue = 0;
  let totalBisPieces = 0;

  for (const item of items) {
    const metalVal = Math.round(item.netWeight * item.ratePerGram);
    subtotalMetalValue += metalVal;
    totalMakingCharges += Number(item.makingCharge) || 0;
    totalStoneValue += Number(item.stoneAmount) || 0;
    if (item.metalType.toLowerCase() === 'gold') {
      totalBisPieces += 1;
    }
  }

  const totalBisFees = totalBisPieces * bisFeePerPiece;
  const grossSubtotal = subtotalMetalValue + totalMakingCharges + totalStoneValue + totalBisFees;
  const discount = Math.min(grossSubtotal, Math.max(0, discountAmount));
  const taxableValue = Math.max(0, grossSubtotal - discount);

  // 3% total GST (CGST 1.5% + SGST 1.5% or IGST 3%)
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = 3.0;
    igstAmount = Math.round((taxableValue * 0.03) * 100) / 100;
  } else {
    cgstRate = 1.5;
    sgstRate = 1.5;
    cgstAmount = Math.round((taxableValue * 0.015) * 100) / 100;
    sgstAmount = Math.round((taxableValue * 0.015) * 100) / 100;
  }

  const totalGst = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
  const unroundedTotal = taxableValue + totalGst;
  const finalInvoiceAmount = Math.round(unroundedTotal);
  const roundOff = Math.round((finalInvoiceAmount - unroundedTotal) * 100) / 100;

  return {
    subtotalMetalValue,
    totalMakingCharges,
    totalStoneValue,
    totalBisFees,
    grossSubtotal,
    discount,
    taxableValue,
    isInterState,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalGst,
    finalInvoiceAmount,
    roundOff
  };
};

// ============================================================================
// 5. GOLD LOAN NPA CLASSIFICATION & BORROWER AUCTION SURPLUS SETTLEMENT
// ============================================================================

export type LoanAssetQuality = 'standard' | 'sma_0' | 'sma_1' | 'sma_2' | 'npa';

export interface NpaClassificationResult {
  assetClass: LoanAssetQuality;
  overdueDays: number;
  isNpa: boolean;
  noticeStage: 'none' | 'reminder_sms' | 'first_notice' | 'final_legal_notice' | 'auction_gazette';
  auctionEligible: boolean;
  recommendedAction: string;
}

export const classifyPawnNpaStatus = (
  dueDate: string,
  asOfDate: string = new Date().toISOString().split('T')[0]
): NpaClassificationResult => {
  const dueTime = new Date(dueDate).setHours(0, 0, 0, 0);
  const asOfTime = new Date(asOfDate).setHours(0, 0, 0, 0);

  const diffMs = asOfTime - dueTime;
  const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (overdueDays === 0) {
    return {
      assetClass: 'standard',
      overdueDays: 0,
      isNpa: false,
      noticeStage: 'none',
      auctionEligible: false,
      recommendedAction: 'Account in good standing.'
    };
  }

  if (overdueDays <= 30) {
    return {
      assetClass: 'sma_0',
      overdueDays,
      isNpa: false,
      noticeStage: 'reminder_sms',
      auctionEligible: false,
      recommendedAction: 'Send polite maturity SMS and courteous call reminder.'
    };
  }

  if (overdueDays <= 60) {
    return {
      assetClass: 'sma_1',
      overdueDays,
      isNpa: false,
      noticeStage: 'first_notice',
      auctionEligible: false,
      recommendedAction: 'Issue Registered Post Notice #1 giving 15 days to regularize interest.'
    };
  }

  if (overdueDays < 90) {
    return {
      assetClass: 'sma_2',
      overdueDays,
      isNpa: false,
      noticeStage: 'final_legal_notice',
      auctionEligible: false,
      recommendedAction: 'Serve Final Legal Demand Notice warning of forthcoming public auction.'
    };
  }

  // Overdue >= 90 days: Statutory NPA
  return {
    assetClass: 'npa',
    overdueDays,
    isNpa: true,
    noticeStage: 'auction_gazette',
    auctionEligible: true,
    recommendedAction: 'Classified as NPA. Schedule public auction with approved auctioneer and publish newspaper gazette.'
  };
};

export interface AuctionSettlementParams {
  auctionProceeds: number;
  principalDue: number;
  accruedInterest: number;
  noticeCharges?: number;
  auctionExpenses?: number;
}

export interface AuctionSettlementResult {
  totalDuesRecoverable: number;
  auctionProceeds: number;
  isSurplus: boolean;
  borrowerSurplusRefund: number;
  shortfallDeficit: number;
  settlementStatus: 'surplus_to_borrower' | 'exact_recovery' | 'unrecovered_deficit';
}

/**
 * Calculates auction recovery distribution.
 * Under Indian Law (Tamil Nadu Pawn Brokers Act & RBI Gold Loan guidelines),
 * the lender CANNOT keep any auction excess. Any surplus MUST be refunded to the borrower.
 */
export const calculateAuctionSettlement = (params: AuctionSettlementParams): AuctionSettlementResult => {
  const { auctionProceeds, principalDue, accruedInterest, noticeCharges = 250, auctionExpenses = 500 } = params;

  const totalDuesRecoverable = Math.round(principalDue + accruedInterest + noticeCharges + auctionExpenses);

  if (auctionProceeds > totalDuesRecoverable) {
    const borrowerSurplusRefund = Math.round(auctionProceeds - totalDuesRecoverable);
    return {
      totalDuesRecoverable,
      auctionProceeds,
      isSurplus: true,
      borrowerSurplusRefund,
      shortfallDeficit: 0,
      settlementStatus: 'surplus_to_borrower'
    };
  }

  if (auctionProceeds < totalDuesRecoverable) {
    const shortfallDeficit = Math.round(totalDuesRecoverable - auctionProceeds);
    return {
      totalDuesRecoverable,
      auctionProceeds,
      isSurplus: false,
      borrowerSurplusRefund: 0,
      shortfallDeficit,
      settlementStatus: 'unrecovered_deficit'
    };
  }

  return {
    totalDuesRecoverable,
    auctionProceeds,
    isSurplus: false,
    borrowerSurplusRefund: 0,
    shortfallDeficit: 0,
    settlementStatus: 'exact_recovery'
  };
};
