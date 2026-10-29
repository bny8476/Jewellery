/**
 * ==============================================================================
 * YAZHINI FINE JEWELS — Pawn Financial Calculation & Valuation Engine
 * Module: pawnCalculationEngine.ts
 *
 * Implements bank-grade precision monetary arithmetic, RBI regulatory 75% LTV,
 * interest accruals across monthly/annual/daily conventions, payment waterfalls,
 * and overdue maturity tracking.
 * ==============================================================================
 */

export type InterestType = 'monthly' | 'annual' | 'daily';

export interface CollateralItemValuationInput {
  item_description: string;
  category?: 'chain' | 'necklace' | 'ring' | 'bangle' | 'bracelet' | 'earrings' | 'coins' | 'other';
  gross_weight_grams: number;
  stone_weight_grams?: number;
  purity: '24K' | '22K' | '18K' | '14K' | '999_silver' | string;
  deduction_percentage?: number;
  condition_grade?: 'excellent' | 'good' | 'fair' | 'antique';
}

export interface MetalRatesSnapshot {
  gold24k: number;      // ₹/g 24K pure gold
  gold22k: number;      // ₹/g 22K jewellery gold
  gold18k?: number;     // ₹/g 18K diamond jewellery gold
  silver?: number;       // ₹/g 999 pure silver
  timestamp?: string;
  isStale?: boolean;
}

export interface CollateralItemValuationResult {
  item_description: string;
  gross_weight_grams: number;
  stone_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  effective_rate_per_gram: number;
  gross_market_value: number;
  deductions: number;
  appraised_value: number;
  max_eligible_loan_ltv75: number;
}

export interface TotalCollateralValuationResult {
  total_gross_weight: number;
  total_stone_weight: number;
  total_net_weight: number;
  total_appraised_value: number;
  max_regulatory_loan_ltv: number; // 75% LTV
  items_breakdown: CollateralItemValuationResult[];
}

export interface InterestAccrualParams {
  principal: number;
  interest_rate: number; // % e.g. 1.5% monthly or 18% annual
  interest_type: InterestType;
  start_date: string | Date;
  as_of_date?: string | Date;
  due_date?: string | Date;
  grace_period_days?: number;
  penalty_rate?: number; // % per month or year for overdue
}

export interface AccrualResult {
  days_elapsed: number;
  days_overdue: number;
  is_overdue: boolean;
  is_due_soon: boolean;
  accrued_interest: number;
  penalty_interest: number;
  total_interest_due: number;
  total_payoff_amount: number;
}

export interface PaymentWaterfallAllocation {
  payment_amount: number;
  allocated_to_fees: number;
  allocated_to_penalty: number;
  allocated_to_interest: number;
  allocated_to_principal: number;
  remaining_unallocated: number;
  new_principal_balance: number;
  new_accrued_interest: number;
  new_fees_balance: number;
  is_fully_settled: boolean;
}

/**
 * Standard fixed-precision 2-decimal monetary rounding
 */
export const roundCurrency = (amount: number): number => {
  if (!Number.isFinite(amount) || amount === 0) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates calendar day difference between two dates (excluding time drift)
 */
export const calculateDaysElapsed = (startDateInput: string | Date, endDateInput: string | Date): number => {
  const start = new Date(startDateInput);
  const end = new Date(endDateInput);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Resolves standard purity multipliers relative to 24K gold benchmark
 */
export const getPurityFactor = (purity: string): number => {
  const normalized = purity.toUpperCase().trim();
  if (normalized.includes('24K') || normalized.includes('999') || normalized.includes('99.9')) return 1.0;
  if (normalized.includes('22K') || normalized.includes('916')) return 22 / 24; // ~0.91666
  if (normalized.includes('18K') || normalized.includes('750')) return 18 / 24; // 0.75
  if (normalized.includes('14K') || normalized.includes('585')) return 14 / 24; // ~0.5833
  return 22 / 24; // default conservative standard
};

/**
 * Resolves effective gold/silver market rate per gram for a given purity
 */
export const getEffectiveRatePerGram = (purity: string, rates: MetalRatesSnapshot): number => {
  const normalized = purity.toUpperCase().trim();

  if (normalized.includes('SILVER')) {
    return rates.silver || Math.round(rates.gold24k * 0.012); // fallback realistic silver rate
  }

  if (normalized.includes('22K') || normalized.includes('916')) {
    return rates.gold22k || Math.round(rates.gold24k * (22 / 24));
  }

  if (normalized.includes('18K') || normalized.includes('750')) {
    return rates.gold18k || Math.round(rates.gold24k * (18 / 24));
  }

  if (normalized.includes('14K') || normalized.includes('585')) {
    return Math.round(rates.gold24k * (14 / 24));
  }

  return rates.gold24k;
};

/**
 * Valuate a single pledged jewelry item based on live rates, gross/stone weights, and deductions
 */
export const valuateCollateralItem = (
  item: CollateralItemValuationInput,
  rates: MetalRatesSnapshot
): CollateralItemValuationResult => {
  const gross = Math.max(0, Number(item.gross_weight_grams) || 0);
  const stone = Math.max(0, Number(item.stone_weight_grams) || 0);
  const netWeight = Math.max(0, roundCurrency(gross - stone));

  const effectiveRate = getEffectiveRatePerGram(item.purity, rates);
  const grossValue = roundCurrency(netWeight * effectiveRate);

  // Deductions (e.g., solder loss, polish wear 1-3%)
  const deductionPct = Math.min(20, Math.max(0, Number(item.deduction_percentage) || 0));
  const deductions = roundCurrency(grossValue * (deductionPct / 100));
  const appraisedValue = roundCurrency(Math.max(0, grossValue - deductions));

  // RBI statutory maximum 75% LTV ceiling for gold collateral
  const maxLoan75 = Math.floor(appraisedValue * 0.75);

  return {
    item_description: item.item_description,
    gross_weight_grams: gross,
    stone_weight_grams: stone,
    net_weight_grams: netWeight,
    purity: item.purity,
    effective_rate_per_gram: effectiveRate,
    gross_market_value: grossValue,
    deductions,
    appraised_value: appraisedValue,
    max_eligible_loan_ltv75: maxLoan75
  };
};

/**
 * Multi-item collateral valuation accumulator
 */
export const valuatePledgeCollateral = (
  items: CollateralItemValuationInput[],
  rates: MetalRatesSnapshot
): TotalCollateralValuationResult => {
  const breakdowns = items.map(i => valuateCollateralItem(i, rates));

  const totalGross = roundCurrency(breakdowns.reduce((sum, b) => sum + b.gross_weight_grams, 0));
  const totalStone = roundCurrency(breakdowns.reduce((sum, b) => sum + b.stone_weight_grams, 0));
  const totalNet = roundCurrency(breakdowns.reduce((sum, b) => sum + b.net_weight_grams, 0));
  const totalAppraised = roundCurrency(breakdowns.reduce((sum, b) => sum + b.appraised_value, 0));
  const maxLoan = Math.floor(totalAppraised * 0.75);

  return {
    total_gross_weight: totalGross,
    total_stone_weight: totalStone,
    total_net_weight: totalNet,
    total_appraised_value: totalAppraised,
    max_regulatory_loan_ltv: maxLoan,
    items_breakdown: breakdowns
  };
};

/**
 * Accrued interest & overdue penalty calculation engine
 */
export const calculateAccruedInterest = (params: InterestAccrualParams): AccrualResult => {
  const principal = Math.max(0, Number(params.principal) || 0);
  const rate = Math.max(0, Number(params.interest_rate) || 0);
  const asOf = params.as_of_date ? new Date(params.as_of_date) : new Date();
  const start = new Date(params.start_date);
  const graceDays = params.grace_period_days !== undefined ? params.grace_period_days : 7;

  if (principal === 0 || rate === 0) {
    return {
      days_elapsed: 0,
      days_overdue: 0,
      is_overdue: false,
      is_due_soon: false,
      accrued_interest: 0,
      penalty_interest: 0,
      total_interest_due: 0,
      total_payoff_amount: principal
    };
  }

  const daysElapsed = calculateDaysElapsed(start, asOf);

  let interestAmount = 0;
  if (params.interest_type === 'monthly') {
    // 30-day banking month convention: rate % per month
    const dailyRate = rate / 30;
    interestAmount = (principal * dailyRate * daysElapsed) / 100;
  } else if (params.interest_type === 'daily') {
    interestAmount = (principal * rate * daysElapsed) / 100;
  } else {
    // Annual
    const dailyRate = rate / 365;
    interestAmount = (principal * dailyRate * daysElapsed) / 100;
  }

  interestAmount = roundCurrency(interestAmount);

  // Overdue calculation
  let daysOverdue = 0;
  let isOverdue = false;
  let isDueSoon = false;
  let penaltyAmount = 0;

  if (params.due_date) {
    const due = new Date(params.due_date);
    due.setHours(0, 0, 0, 0);
    const today = new Date(asOf);
    today.setHours(0, 0, 0, 0);

    const diffFromDue = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffFromDue > graceDays) {
      isOverdue = true;
      daysOverdue = diffFromDue;

      // Optional default penalty (e.g. 0.5% per month overdue)
      const penaltyRate = params.penalty_rate || 0.5;
      const penaltyDailyRate = penaltyRate / 30;
      penaltyAmount = roundCurrency((principal * penaltyDailyRate * daysOverdue) / 100);
    } else if (diffFromDue >= -7 && diffFromDue <= 0) {
      isDueSoon = true;
    }
  }

  const totalInterestDue = roundCurrency(interestAmount + penaltyAmount);
  const totalPayoff = roundCurrency(principal + totalInterestDue);

  return {
    days_elapsed: daysElapsed,
    days_overdue: daysOverdue,
    is_overdue: isOverdue,
    is_due_soon: isDueSoon,
    accrued_interest: interestAmount,
    penalty_interest: penaltyAmount,
    total_interest_due: totalInterestDue,
    total_payoff_amount: totalPayoff
  };
};

/**
 * Standard Banking Payment Waterfall Allocation
 * Order of allocation:
 * 1. Unpaid Fees / Charges
 * 2. Overdue Penalties
 * 3. Accrued Interest
 * 4. Principal Repayment
 */
export const allocatePawnPayment = (
  paymentAmount: number,
  currentPrincipal: number,
  accruedInterest: number,
  accruedFees: number = 0,
  overduePenalty: number = 0
): PaymentWaterfallAllocation => {
  let remaining = roundCurrency(Math.max(0, paymentAmount));

  // 1. Allocate to fees
  const allocFees = Math.min(remaining, Math.max(0, accruedFees));
  remaining = roundCurrency(remaining - allocFees);
  const newFees = roundCurrency(accruedFees - allocFees);

  // 2. Allocate to penalty
  const allocPenalty = Math.min(remaining, Math.max(0, overduePenalty));
  remaining = roundCurrency(remaining - allocPenalty);

  // 3. Allocate to accrued interest
  const allocInterest = Math.min(remaining, Math.max(0, accruedInterest));
  remaining = roundCurrency(remaining - allocInterest);
  const newInterest = roundCurrency(accruedInterest - allocInterest);

  // 4. Remainder reduces principal
  const allocPrincipal = Math.min(remaining, Math.max(0, currentPrincipal));
  remaining = roundCurrency(remaining - allocPrincipal);
  const newPrincipal = roundCurrency(currentPrincipal - allocPrincipal);

  const isFullySettled = newPrincipal === 0 && newInterest === 0 && newFees === 0;

  return {
    payment_amount: paymentAmount,
    allocated_to_fees: allocFees,
    allocated_to_penalty: allocPenalty,
    allocated_to_interest: allocInterest,
    allocated_to_principal: allocPrincipal,
    remaining_unallocated: remaining, // Any surplus overpayment returned or held in patron credit
    new_principal_balance: newPrincipal,
    new_accrued_interest: newInterest,
    new_fees_balance: newFees,
    is_fully_settled: isFullySettled
  };
};

/**
 * Generates balanced Double-Entry Accounting journal entries for a pawn event
 */
export interface JournalEntryRecord {
  entry_type: 'disbursement' | 'interest_collection' | 'principal_repayment' | 'renewal_fee' | 'redemption' | 'reversal';
  debit_account: string;
  credit_account: string;
  amount: number;
  narration: string;
}

export const generatePawnJournalEntries = (
  eventType: 'disbursement' | 'repayment' | 'redemption' | 'renewal',
  details: {
    pledge_number: string;
    customer_name: string;
    principal_amount: number;
    interest_amount?: number;
    fees_amount?: number;
    payment_mode?: string;
  }
): JournalEntryRecord[] => {
  const entries: JournalEntryRecord[] = [];
  const paymentAssetAccount = details.payment_mode === 'bank_transfer' || details.payment_mode === 'upi'
    ? 'HDFC Current Account (1002)'
    : 'Cash in Vault / Register (1001)';

  switch (eventType) {
    case 'disbursement':
      // Debit: Pawn Loan Collateral Asset (1200)
      // Credit: Cash/Bank (1001/1002)
      entries.push({
        entry_type: 'disbursement',
        debit_account: 'Pawn Loan Portfolio Asset (1200)',
        credit_account: paymentAssetAccount,
        amount: details.principal_amount,
        narration: `Disbursement for Pledge #${details.pledge_number} to ${details.customer_name}`
      });
      break;

    case 'repayment':
      if (details.interest_amount && details.interest_amount > 0) {
        entries.push({
          entry_type: 'interest_collection',
          debit_account: paymentAssetAccount,
          credit_account: 'Pawn Interest Income (4100)',
          amount: details.interest_amount,
          narration: `Interest receipt against Pledge #${details.pledge_number}`
        });
      }
      if (details.principal_amount && details.principal_amount > 0) {
        entries.push({
          entry_type: 'principal_repayment',
          debit_account: paymentAssetAccount,
          credit_account: 'Pawn Loan Portfolio Asset (1200)',
          amount: details.principal_amount,
          narration: `Principal part repayment for Pledge #${details.pledge_number}`
        });
      }
      break;

    case 'redemption':
      if (details.interest_amount && details.interest_amount > 0) {
        entries.push({
          entry_type: 'interest_collection',
          debit_account: paymentAssetAccount,
          credit_account: 'Pawn Interest Income (4100)',
          amount: details.interest_amount,
          narration: `Final interest settlement on redemption of Pledge #${details.pledge_number}`
        });
      }
      entries.push({
        entry_type: 'redemption',
        debit_account: paymentAssetAccount,
        credit_account: 'Pawn Loan Portfolio Asset (1200)',
        amount: details.principal_amount,
        narration: `Full loan payoff & collateral redemption for Pledge #${details.pledge_number}`
      });
      break;

    case 'renewal':
      if (details.fees_amount && details.fees_amount > 0) {
        entries.push({
          entry_type: 'renewal_fee',
          debit_account: paymentAssetAccount,
          credit_account: 'Contract Restructuring & Renewal Fee (4200)',
          amount: details.fees_amount,
          narration: `Renewal documentation fee for Pledge #${details.pledge_number}`
        });
      }
      break;
  }

  return entries;
};
