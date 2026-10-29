/**
 * ==============================================================================
 * YAZHINI FINE JEWELS — Production Pawn Shop & Collateral Loans Engine
 * API Route Handler: /api/v1/pawn/* and /api/v1/pledges/*
 * ==============================================================================
 */

import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { supabase, queryDb, memoryStore } from '../db.ts';
import { authenticateRequest, broadcastRealtimeEvent } from './apiV1.ts';
import { createAndDispatchNotification } from '../services/notificationService.ts';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function sendCsv(res: ServerResponse, filename: string, csvContent: string) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.end(csvContent);
}

function toValidUuid(rawId: string): string {
  if (!rawId) return '00000000-0000-0000-0000-000000000001';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(rawId)) return rawId;
  const hash = crypto.createHash('md5').update(rawId).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

// Fixed-precision currency helper
const roundMoney = (v: number): number => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

// Initialize seed data if memoryStore is empty
export function initPawnSeedData() {
  if (!memoryStore.customers) memoryStore.customers = [];
  if (!memoryStore.pledges) memoryStore.pledges = [];
  if (!memoryStore.pledge_items) memoryStore.pledge_items = [];
  if (!memoryStore.part_payments) memoryStore.part_payments = [];
  if (!memoryStore.pledge_renewals) memoryStore.pledge_renewals = [];
  if (!memoryStore.pledge_returns) memoryStore.pledge_returns = [];
  if (!memoryStore.pawn_accounting_ledger) memoryStore.pawn_accounting_ledger = [];
  if (!memoryStore.collateral_vault_custody_log) memoryStore.collateral_vault_custody_log = [];

  // Seed Customers
  if (memoryStore.customers.length === 0) {
    memoryStore.customers.push(
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        user_id: 'patron-demo-001',
        full_name: 'Rajesh Sharma',
        phone: '+91 98401 23456',
        email: 'rajesh.sharma@example.com',
        kyc_status: 'VERIFIED',
        id_proof_type: 'Aadhaar Card',
        id_proof_number: 'XXXX-XXXX-4819',
        address: '14/B, Cathedral Road, Chennai 600086',
        is_blocked: false,
        created_at: '2026-01-10T09:00:00Z'
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        user_id: 'patron-demo-002',
        full_name: 'Priya Sundaram',
        phone: '+91 98840 54321',
        email: 'priya.sundaram@example.com',
        kyc_status: 'VERIFIED',
        id_proof_type: 'PAN Card',
        id_proof_number: 'ABCDE1234F',
        address: '28, Race Course, Coimbatore 641018',
        is_blocked: false,
        created_at: '2026-02-14T11:30:00Z'
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        user_id: 'patron-demo-003',
        full_name: 'Meenakshi Natarajan',
        phone: '+91 94440 98765',
        email: 'meenakshi.n@example.com',
        kyc_status: 'VERIFIED',
        id_proof_type: 'Passport',
        id_proof_number: 'Z9876543',
        address: '5, West Masi Street, Madurai 625001',
        is_blocked: false,
        created_at: '2026-03-01T14:15:00Z'
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        user_id: 'patron-demo-004',
        full_name: 'Ananya Raman',
        phone: '+91 97900 11223',
        email: 'ananya.raman@example.com',
        kyc_status: 'VERIFIED',
        id_proof_type: 'Voter ID',
        id_proof_number: 'TN/01/123/456789',
        address: '9, Gandhi Nagar, Adyar, Chennai 600020',
        is_blocked: false,
        created_at: '2026-04-12T16:00:00Z'
      }
    );
  }

  // Seed Pledges
  if (memoryStore.pledges.length === 0) {
    const p1Id = 'p0000000-0000-0000-0000-000000000001';
    const p2Id = 'p0000000-0000-0000-0000-000000000002';
    const p3Id = 'p0000000-0000-0000-0000-000000000003';
    const p4Id = 'p0000000-0000-0000-0000-000000000004';

    memoryStore.pledges.push(
      {
        id: p1Id,
        pledge_number: 'PL-2026-00101',
        customer_id: 'c0000000-0000-0000-0000-000000000001',
        customer_name: 'Rajesh Sharma',
        loan_amount: 150000,
        interest_rate: 1.5,
        interest_type: 'monthly',
        pledge_date: '2026-09-15',
        due_date: '2027-03-15',
        grace_period_days: 7,
        total_weight_grams: 32.5,
        total_items: 1,
        appraised_value: 216000,
        document_charges: 250,
        disbursement_method: 'bank_transfer',
        disbursement_reference: 'HDFC-NEFT-984210',
        maker_staff_name: 'Suresh Kumar (Appraiser)',
        checker_staff_name: 'V. Ramanathan (Manager)',
        approved_at: '2026-09-15T10:30:00Z',
        kyc_status_at_creation: 'VERIFIED',
        renewal_count: 0,
        vault_locker_no: 'Vault A - Locker 04',
        accrued_interest: 3375,
        total_principal_paid: 0,
        total_interest_paid: 0,
        last_payment_date: null,
        collateral_released: false,
        status: 'active',
        market_rate_at_pledge: 7200,
        ltv_ratio_percentage: 69.44,
        notes: '22K Hallmarked Temple Necklace in pristine preservation condition.',
        created_at: '2026-09-15T10:30:00Z'
      },
      {
        id: p2Id,
        pledge_number: 'PL-2026-00102',
        customer_id: 'c0000000-0000-0000-0000-000000000002',
        customer_name: 'Priya Sundaram',
        loan_amount: 120000,
        interest_rate: 1.5,
        interest_type: 'monthly',
        pledge_date: '2026-07-20',
        due_date: '2027-01-20',
        grace_period_days: 7,
        total_weight_grams: 24.0,
        total_items: 2,
        appraised_value: 172800,
        document_charges: 250,
        disbursement_method: 'cash',
        disbursement_reference: 'CASH-DISB-4412',
        maker_staff_name: 'Kavitha S. (Staff)',
        checker_staff_name: 'V. Ramanathan (Manager)',
        approved_at: '2026-07-20T11:00:00Z',
        kyc_status_at_creation: 'VERIFIED',
        renewal_count: 0,
        vault_locker_no: 'Vault B - Locker 12',
        accrued_interest: 1200,
        total_principal_paid: 40000,
        total_interest_paid: 3600,
        last_payment_date: '2026-09-20',
        collateral_released: false,
        status: 'partially_paid',
        market_rate_at_pledge: 7200,
        ltv_ratio_percentage: 69.44,
        notes: '22K Antique Bangles (Pair), well-preserved.',
        created_at: '2026-07-20T11:00:00Z'
      },
      {
        id: p3Id,
        pledge_number: 'PL-2026-00103',
        customer_id: 'c0000000-0000-0000-0000-000000000003',
        customer_name: 'Meenakshi Natarajan',
        loan_amount: 85000,
        interest_rate: 1.5,
        interest_type: 'monthly',
        pledge_date: '2026-03-10',
        due_date: '2026-09-10',
        grace_period_days: 7,
        total_weight_grams: 18.2,
        total_items: 1,
        appraised_value: 129600,
        document_charges: 250,
        disbursement_method: 'bank_transfer',
        disbursement_reference: 'SBI-IMPS-1192',
        maker_staff_name: 'Suresh Kumar (Appraiser)',
        checker_staff_name: 'V. Ramanathan (Manager)',
        approved_at: '2026-03-10T14:30:00Z',
        kyc_status_at_creation: 'VERIFIED',
        renewal_count: 0,
        vault_locker_no: 'Vault A - Locker 08',
        accrued_interest: 9562.5,
        total_principal_paid: 0,
        total_interest_paid: 0,
        last_payment_date: null,
        collateral_released: false,
        status: 'active',
        market_rate_at_pledge: 7200,
        ltv_ratio_percentage: 65.58,
        notes: 'Overdue contract. Client notified via automated maturity alert.',
        created_at: '2026-03-10T14:30:00Z'
      },
      {
        id: p4Id,
        pledge_number: 'PL-2026-00104',
        customer_id: 'c0000000-0000-0000-0000-000000000004',
        customer_name: 'Ananya Raman',
        loan_amount: 60000,
        interest_rate: 1.5,
        interest_type: 'monthly',
        pledge_date: '2026-04-12',
        due_date: '2026-10-12',
        grace_period_days: 7,
        total_weight_grams: 10.0,
        total_items: 1,
        appraised_value: 78500,
        document_charges: 250,
        disbursement_method: 'upi',
        disbursement_reference: 'UPI-RAZOR-4482',
        maker_staff_name: 'Kavitha S. (Staff)',
        checker_staff_name: 'V. Ramanathan (Manager)',
        approved_at: '2026-04-12T16:00:00Z',
        kyc_status_at_creation: 'VERIFIED',
        renewal_count: 0,
        vault_locker_no: 'Vault C - Locker 02',
        accrued_interest: 0,
        total_principal_paid: 60000,
        total_interest_paid: 5400,
        last_payment_date: '2026-10-10',
        collateral_released: true,
        collateral_released_at: '2026-10-10T15:00:00Z',
        collateral_released_by: 'M. Senthil (Vault Custodian)',
        status: 'closed',
        market_rate_at_pledge: 7850,
        ltv_ratio_percentage: 76.43,
        notes: 'Contract fully settled. Collateral handed over in presence of patron.',
        created_at: '2026-04-12T16:00:00Z'
      }
    );

    // Seed Pledge Items
    memoryStore.pledge_items.push(
      {
        id: 'itm-001',
        pledge_id: p1Id,
        item_description: '22K Hallmarked Temple Lakshmi Necklace',
        item_category: 'necklace',
        gross_weight_grams: 32.5,
        stone_weight_grams: 2.5,
        net_weight_grams: 30.0,
        purity: '22K',
        quantity: 1,
        item_value: 216000,
        huid_code: 'HUID-916-TN-4821',
        hallmark_certified: true,
        condition_grade: 'excellent',
        vault_tag: 'PL-2026-00101-ITM-1',
        custody_status: 'in_vault',
        created_at: '2026-09-15T10:30:00Z'
      },
      {
        id: 'itm-002',
        pledge_id: p2Id,
        item_description: '22K Solid Floral Antique Bangles (Pair)',
        item_category: 'bangle',
        gross_weight_grams: 24.0,
        stone_weight_grams: 0.0,
        net_weight_grams: 24.0,
        purity: '22K',
        quantity: 2,
        item_value: 172800,
        huid_code: 'HUID-916-CBE-9912',
        hallmark_certified: true,
        condition_grade: 'good',
        vault_tag: 'PL-2026-00102-ITM-1',
        custody_status: 'in_vault',
        created_at: '2026-07-20T11:00:00Z'
      },
      {
        id: 'itm-003',
        pledge_id: p3Id,
        item_description: '22K Traditional Ruby Hanging Jimikki Drop Earrings',
        item_category: 'earrings',
        gross_weight_grams: 18.2,
        stone_weight_grams: 0.2,
        net_weight_grams: 18.0,
        purity: '22K',
        quantity: 1,
        item_value: 129600,
        huid_code: 'HUID-916-MDU-7714',
        hallmark_certified: true,
        condition_grade: 'fair',
        vault_tag: 'PL-2026-00103-ITM-1',
        custody_status: 'in_vault',
        created_at: '2026-03-10T14:30:00Z'
      },
      {
        id: 'itm-004',
        pledge_id: p4Id,
        item_description: '24K Certified Pure Bullion Gold Coin',
        item_category: 'coins',
        gross_weight_grams: 10.0,
        stone_weight_grams: 0.0,
        net_weight_grams: 10.0,
        purity: '24K',
        quantity: 1,
        item_value: 78500,
        huid_code: 'HUID-999-CHE-0081',
        hallmark_certified: true,
        condition_grade: 'excellent',
        vault_tag: 'PL-2026-00104-ITM-1',
        custody_status: 'released',
        released_at: '2026-10-10T15:00:00Z',
        released_by: 'M. Senthil (Vault Custodian)',
        created_at: '2026-04-12T16:00:00Z'
      }
    );

    // Seed Part Payments
    memoryStore.part_payments.push({
      id: 'pay-001',
      pledge_id: p2Id,
      payment_date: '2026-09-20',
      payment_amount: 43600,
      principal_paid: 40000,
      interest_paid: 3600,
      payment_mode: 'upi',
      receipt_number: 'REC-2026-09201',
      notes: 'Part principal ₹40,000 + 2 months cleared interest ₹3,600',
      created_by: 'Kavitha S. (Cashier)',
      created_at: '2026-09-20T14:00:00Z'
    });

    // Seed Double-Entry Accounting Ledger
    memoryStore.pawn_accounting_ledger.push(
      {
        id: 'led-001',
        pledge_id: p1Id,
        entry_type: 'disbursement',
        debit_account: 'Pawn Loan Portfolio Asset (1200)',
        credit_account: 'HDFC Bank Operating (1002)',
        amount: 150000,
        payment_mode: 'bank_transfer',
        reference_no: 'DISB-PL-2026-00101',
        narration: 'Collateral loan disbursed for Pledge #PL-2026-00101 to Rajesh Sharma',
        created_by: 'Pawn System',
        created_at: '2026-09-15T10:30:00Z'
      },
      {
        id: 'led-002',
        pledge_id: p2Id,
        entry_type: 'disbursement',
        debit_account: 'Pawn Loan Portfolio Asset (1200)',
        credit_account: 'Vault Cash in Hand (1001)',
        amount: 120000,
        payment_mode: 'cash',
        reference_no: 'DISB-PL-2026-00102',
        narration: 'Collateral loan disbursed for Pledge #PL-2026-00102 to Priya Sundaram',
        created_by: 'Pawn System',
        created_at: '2026-07-20T11:00:00Z'
      },
      {
        id: 'led-003',
        pledge_id: p2Id,
        entry_type: 'interest_collection',
        debit_account: 'HDFC Bank Operating (1002)',
        credit_account: 'Pawn Interest Income (4100)',
        amount: 3600,
        payment_mode: 'upi',
        reference_no: 'REC-2026-09201',
        narration: 'Interest receipt against Pledge #PL-2026-00102',
        created_by: 'Kavitha S. (Cashier)',
        created_at: '2026-09-20T14:00:00Z'
      },
      {
        id: 'led-004',
        pledge_id: p2Id,
        entry_type: 'principal_repayment',
        debit_account: 'HDFC Bank Operating (1002)',
        credit_account: 'Pawn Loan Portfolio Asset (1200)',
        amount: 40000,
        payment_mode: 'upi',
        reference_no: 'REC-2026-09201',
        narration: 'Principal repayment against Pledge #PL-2026-00102',
        created_by: 'Kavitha S. (Cashier)',
        created_at: '2026-09-20T14:00:00Z'
      }
    );

    // Seed Vault Custody Logs
    memoryStore.collateral_vault_custody_log.push(
      {
        id: 'vlog-001',
        pledge_id: p1Id,
        action: 'intake',
        from_location: 'Store Counter Appraisal',
        to_location: 'Vault A - Locker 04',
        handled_by: 'Suresh Kumar (Appraiser)',
        verified_by: 'V. Ramanathan (Manager)',
        notes: 'Intake of 1 item (32.5g Gross / 30.0g Net 22K Necklace). Tamper-evident seal applied.',
        created_at: '2026-09-15T10:35:00Z'
      },
      {
        id: 'vlog-002',
        pledge_id: p2Id,
        action: 'intake',
        from_location: 'Store Counter Appraisal',
        to_location: 'Vault B - Locker 12',
        handled_by: 'Kavitha S. (Staff)',
        verified_by: 'V. Ramanathan (Manager)',
        notes: 'Intake of 2 items (24.0g 22K Bangles).',
        created_at: '2026-07-20T11:05:00Z'
      },
      {
        id: 'vlog-003',
        pledge_id: p3Id,
        action: 'audit_check',
        from_location: 'Vault A - Locker 08',
        to_location: 'Vault A - Locker 08',
        handled_by: 'Audit Team A',
        verified_by: 'R. Balaji (Internal Auditor)',
        notes: 'Bi-monthly physical vault audit verification passed. Seal unbroken.',
        created_at: '2026-08-30T17:00:00Z'
      },
      {
        id: 'vlog-004',
        pledge_id: p4Id,
        action: 'release',
        from_location: 'Vault C - Locker 02',
        to_location: 'Customer Handover (Ananya Raman)',
        handled_by: 'M. Senthil (Vault Custodian)',
        verified_by: 'Government ID Verified',
        notes: 'Loan settled in full. 10.0g 24K Coin released to patron.',
        created_at: '2026-10-10T15:00:00Z'
      }
    );
  }
}

// Ensure seed data initialized
initPawnSeedData();

/**
 * Robust database accessor: tries Supabase first; if Supabase returns an error or is in placeholder mode,
 * falls back seamlessly to memoryStore.
 */
async function fetchAllPledgesWithRelations(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('pledges')
      .select('*, customers(id, full_name, phone, kyc_status, id_proof_type, id_proof_number, address), pledge_items(*)');
    if (!error && data && data.length > 0) return data;
  } catch {
    // Supabase unavailable, fallback below
  }

  // MemoryStore Fallback
  initPawnSeedData();
  const pledges = [...memoryStore.pledges];
  return pledges.map(p => {
    const customer = memoryStore.customers.find((c: any) => c.id === p.customer_id) || {
      id: p.customer_id,
      full_name: p.customer_name || 'Valued Patron',
      phone: '+91 98400 00000',
      kyc_status: p.kyc_status_at_creation || 'VERIFIED'
    };
    const items = memoryStore.pledge_items.filter((i: any) => i.pledge_id === p.id);
    return {
      ...p,
      customers: customer,
      pledge_items: items
    };
  });
}

async function fetchPledgeByIdWithRelations(pledgeId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('pledges')
      .select(`
        *,
        customers(*),
        pledge_items(*),
        part_payments(*),
        pledge_returns(*),
        pledge_renewals(*),
        pawn_accounting_ledger(*)
      `)
      .eq('id', pledgeId)
      .maybeSingle();
    if (!error && data) return data;
  } catch {
    // Fallback below
  }

  // MemoryStore Fallback
  initPawnSeedData();
  const p = memoryStore.pledges.find((x: any) => x.id === pledgeId || x.pledge_number === pledgeId);
  if (!p) return null;

  const customer = memoryStore.customers.find((c: any) => c.id === p.customer_id) || {
    id: p.customer_id,
    full_name: p.customer_name || 'Valued Patron',
    phone: '+91 98400 00000',
    kyc_status: p.kyc_status_at_creation || 'VERIFIED'
  };
  const items = memoryStore.pledge_items.filter((i: any) => i.pledge_id === p.id);
  const payments = memoryStore.part_payments.filter((pay: any) => pay.pledge_id === p.id);
  const returns = memoryStore.pledge_returns.filter((r: any) => r.pledge_id === p.id);
  const renewals = memoryStore.pledge_renewals.filter((ren: any) => ren.pledge_id === p.id);
  const ledger = memoryStore.pawn_accounting_ledger.filter((l: any) => l.pledge_id === p.id);

  return {
    ...p,
    customers: customer,
    pledge_items: items,
    part_payments: payments,
    pledge_returns: returns,
    pledge_renewals: renewals,
    pawn_accounting_ledger: ledger
  };
}

export async function handlePawnRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> {
  if (!pathname.startsWith('/api/v1/pawn') && !pathname.startsWith('/api/v1/pledges') && pathname !== '/api/pledges') {
    return false;
  }

  initPawnSeedData();

  const method = req.method || 'GET';
  const auth = await authenticateRequest(req);
  const body = (req as any).body || {};
  const query = (req as any).query || {};

  // ============================================================================
  // 1. GET /api/v1/pawn/dashboard — Comprehensive Database-Backed KPI Metrics
  // ============================================================================
  if ((pathname === '/api/v1/pawn/dashboard' || pathname === '/api/v1/pawn/stats') && method === 'GET') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to view executive pawn metrics.' });
      return true;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = `${today.slice(0, 7)}-01`;

      const allPledges = await fetchAllPledgesWithRelations();
      const allPayments = memoryStore.part_payments || [];

      let activeLoansCount = 0;
      let totalPrincipalOutstanding = 0;
      let totalAccruedInterest = 0;
      let totalInterestCollected = 0;
      let loansDisbursedTodayCount = 0;
      let loansDisbursedTodayAmount = 0;
      let loansDisbursedMonthCount = 0;
      let loansDisbursedMonthAmount = 0;
      let loansDueTodayCount = 0;
      let overdueContractsCount = 0;
      let overdueContractsAmount = 0;
      let nearingMaturityCount = 0;
      let totalPledgedGoldWeight = 0;
      let totalCollateralValuation = 0;
      let redeemedContractsCount = 0;

      const paymentsByPledge: Record<string, { principalPaid: number; interestPaid: number }> = {};
      allPayments.forEach((p: any) => {
        const pid = p.pledge_id;
        if (!paymentsByPledge[pid]) paymentsByPledge[pid] = { principalPaid: 0, interestPaid: 0 };
        paymentsByPledge[pid].principalPaid += Number(p.principal_paid) || 0;
        paymentsByPledge[pid].interestPaid += Number(p.interest_paid || p.payment_amount) || 0;
        totalInterestCollected += Number(p.interest_paid) || 0;
      });

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      allPledges.forEach((p: any) => {
        const loanAmt = Number(p.loan_amount) || 0;
        const paidPrinc = paymentsByPledge[p.id]?.principalPaid || Number(p.total_principal_paid) || 0;
        const currentBalance = Math.max(0, loanAmt - paidPrinc);
        const pDate = p.pledge_date || p.created_at?.split('T')[0];
        const dDate = p.due_date || (pDate ? new Date(new Date(pDate).setMonth(new Date(pDate).getMonth() + 6)).toISOString().split('T')[0] : null);

        if (pDate === today) {
          loansDisbursedTodayCount++;
          loansDisbursedTodayAmount += loanAmt;
        }
        if (pDate && pDate >= monthStart) {
          loansDisbursedMonthCount++;
          loansDisbursedMonthAmount += loanAmt;
        }

        if (p.status === 'closed') {
          redeemedContractsCount++;
        } else if (p.status === 'active' || p.status === 'partially_paid') {
          activeLoansCount++;
          totalPrincipalOutstanding += currentBalance;
          totalPledgedGoldWeight += Number(p.total_weight_grams) || Number(p.gross_weight) || 0;
          totalCollateralValuation += Number(p.appraised_value) || (loanAmt / 0.75);

          if (pDate) {
            const daysElapsed = Math.max(0, Math.round((now.getTime() - new Date(pDate).getTime()) / (1000 * 60 * 60 * 24)));
            const rate = Number(p.interest_rate) || 1.5;
            const dailyRate = p.interest_type === 'daily' ? rate : (p.interest_type === 'annual' ? rate / 365 : rate / 30);
            const loanAccrued = roundMoney((currentBalance * dailyRate * daysElapsed) / 100);
            totalAccruedInterest += loanAccrued;
          }

          if (dDate) {
            const dueDateObj = new Date(dDate);
            dueDateObj.setHours(0, 0, 0, 0);
            const diffDays = Math.round((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (dDate === today) {
              loansDueTodayCount++;
            } else if (diffDays < 0) {
              const grace = Number(p.grace_period_days) || 7;
              if (Math.abs(diffDays) > grace) {
                overdueContractsCount++;
                overdueContractsAmount += currentBalance;
              }
            } else if (diffDays <= 7) {
              nearingMaturityCount++;
            }
          }
        }
      });

      sendJson(res, 200, {
        success: true,
        data: {
          active_pawn_loans: activeLoansCount,
          total_principal_outstanding: roundMoney(totalPrincipalOutstanding),
          total_accrued_interest: roundMoney(totalAccruedInterest),
          total_interest_collected: roundMoney(totalInterestCollected),
          loans_disbursed_today_count: loansDisbursedTodayCount,
          loans_disbursed_today_amount: roundMoney(loansDisbursedTodayAmount),
          loans_disbursed_month_count: loansDisbursedMonthCount,
          loans_disbursed_month_amount: roundMoney(loansDisbursedMonthAmount),
          loans_due_today: loansDueTodayCount,
          overdue_contracts_count: overdueContractsCount,
          overdue_contracts_amount: roundMoney(overdueContractsAmount),
          contracts_nearing_maturity: nearingMaturityCount,
          total_pledged_gold_grams: roundMoney(totalPledgedGoldWeight),
          total_collateral_valuation: roundMoney(totalCollateralValuation),
          redeemed_closed_contracts: redeemedContractsCount,
          pending_customer_kyc_reviews: (memoryStore.customer_kyc || []).filter((k: any) => k.status === 'PENDING_VERIFICATION').length,
          as_of_timestamp: new Date().toISOString()
        }
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // PHASE 1: SMART VALUATION CALCULATOR — POST /api/v1/pawn/valuate
  // ============================================================================
  if (pathname === '/api/v1/pawn/valuate' && method === 'POST') {
    try {
      const { items = [], live_rates, ltv_percentage = 75 } = body;

      const gold24k = Number(live_rates?.gold24k) || 7850;
      const gold22k = Number(live_rates?.gold22k) || 7200;
      const gold18k = Number(live_rates?.gold18k) || Math.round(gold24k * 0.75);
      const silver = Number(live_rates?.silver) || 98;

      const ratesTimestamp = live_rates?.timestamp || new Date().toISOString();
      const ageHours = (Date.now() - new Date(ratesTimestamp).getTime()) / (1000 * 60 * 60);
      const isStale = ageHours > 2.0;

      let totalGrossWeight = 0;
      let totalStoneWeight = 0;
      let totalNetWeight = 0;
      let totalAppraisedValue = 0;

      const itemsBreakdown = (items || []).map((item: any, idx: number) => {
        const gross = Math.max(0, Number(item.gross_weight_grams) || 0);
        const stone = Math.max(0, Number(item.stone_weight_grams) || 0);
        const net = Math.max(0, roundMoney(gross - stone));
        const purity = String(item.purity || '22K').toUpperCase().trim();

        let effectiveRate = gold22k;
        if (purity.includes('24K') || purity.includes('999')) effectiveRate = gold24k;
        else if (purity.includes('18K') || purity.includes('750')) effectiveRate = gold18k;
        else if (purity.includes('14K') || purity.includes('585')) effectiveRate = Math.round(gold24k * (14 / 24));
        else if (purity.includes('SILVER')) effectiveRate = silver;

        const grossVal = roundMoney(net * effectiveRate);
        const deductionPct = Math.min(25, Math.max(0, Number(item.deduction_percentage) || 0));
        const deductions = roundMoney(grossVal * (deductionPct / 100));
        const appraisedVal = roundMoney(Math.max(0, grossVal - deductions));
        const maxLoan = Math.floor(appraisedVal * (Math.min(75, Number(ltv_percentage)) / 100));

        totalGrossWeight += gross;
        totalStoneWeight += stone;
        totalNetWeight += net;
        totalAppraisedValue += appraisedVal;

        return {
          item_index: idx + 1,
          description: item.item_description || `Article #${idx + 1}`,
          category: item.category || 'necklace',
          gross_weight_grams: gross,
          stone_weight_grams: stone,
          net_weight_grams: net,
          purity,
          effective_rate_per_gram: effectiveRate,
          gross_market_value: grossVal,
          deductions,
          appraised_value: appraisedVal,
          max_eligible_loan_ltv: maxLoan
        };
      });

      const maxCollateralLoan = Math.floor(totalAppraisedValue * (Math.min(75, Number(ltv_percentage)) / 100));

      sendJson(res, 200, {
        success: true,
        valuation_summary: {
          rate_source: 'IBJA Live Feeds & Bullion Association (Chennai/Madurai/Coimbatore)',
          rates_timestamp: ratesTimestamp,
          is_stale_warning: isStale,
          stale_warning_message: isStale ? 'Market rates are over 2 hours old. Refresh live feeds before final loan origination.' : null,
          total_items: itemsBreakdown.length,
          total_gross_weight: roundMoney(totalGrossWeight),
          total_stone_weight: roundMoney(totalStoneWeight),
          total_net_weight: roundMoney(totalNetWeight),
          total_appraised_value: roundMoney(totalAppraisedValue),
          regulatory_ltv_ceiling_pct: 75,
          max_eligible_loan_amount: maxCollateralLoan,
          items_breakdown: itemsBreakdown
        }
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // PHASE 1: VALUATION OVERRIDE WITH MANDATORY AUDIT — POST /api/v1/pawn/valuation-override
  // ============================================================================
  if (pathname === '/api/v1/pawn/valuation-override' && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Manager credentials required for valuation overrides.' });
      return true;
    }

    try {
      const { pledge_id, overridden_appraised_value, override_reason } = body;
      if (!pledge_id || !overridden_appraised_value || !override_reason) {
        sendJson(res, 400, { success: false, error: 'pledge_id, overridden_appraised_value, and mandatory override_reason required.' });
        return true;
      }

      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      const prevValue = pledge.appraised_value;
      pledge.appraised_value = Number(overridden_appraised_value);
      pledge.valuation_override = {
        previous_appraised_value: prevValue,
        new_appraised_value: Number(overridden_appraised_value),
        override_reason,
        authorized_by: auth.user.email || 'Admin Manager',
        overridden_at: new Date().toISOString()
      };

      // Record in audit log
      memoryStore.audit_logs = memoryStore.audit_logs || [];
      memoryStore.audit_logs.push({
        id: crypto.randomUUID(),
        entity_type: 'pledge_valuation',
        entity_id: pledge_id,
        action: 'VALUATION_OVERRIDE',
        details: `Appraised value overridden from ₹${prevValue} to ₹${overridden_appraised_value}. Reason: ${override_reason}`,
        performed_by: auth.user.email || 'Admin',
        created_at: new Date().toISOString()
      });

      sendJson(res, 200, {
        success: true,
        message: 'Valuation override authorized and logged in compliance audit trail.',
        data: pledge
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // 2. GET /api/v1/pawn/pledges or /api/v1/pledges — Filterable Pledge Register
  // ============================================================================
  if ((pathname === '/api/v1/pawn/pledges' || pathname === '/api/v1/pledges' || pathname === '/api/pledges') && method === 'GET') {
    if (!auth.user) {
      sendJson(res, 401, { success: false, error: 'Authentication required' });
      return true;
    }

    try {
      let records = await fetchAllPledgesWithRelations();

      if (!auth.isStaff) {
        // Customer view: filter by user customer id
        const userCust = memoryStore.customers.find((c: any) => c.user_id === auth.user.id || c.email === auth.user.email);
        if (!userCust) {
          sendJson(res, 200, { success: true, count: 0, data: [] });
          return true;
        }
        records = records.filter((r: any) => r.customer_id === userCust.id);
      } else {
        if (query.status && query.status !== 'all') {
          records = records.filter((r: any) => r.status === query.status);
        }
        if (query.customer_id) {
          records = records.filter((r: any) => r.customer_id === query.customer_id);
        }
      }

      if (query.search && typeof query.search === 'string' && query.search.trim()) {
        const term = query.search.toLowerCase().trim();
        records = records.filter((r: any) => {
          const pNo = (r.pledge_number || '').toLowerCase();
          const cName = (r.customers?.full_name || r.customer_name || '').toLowerCase();
          const cPhone = (r.customers?.phone || '').toLowerCase();
          const desc = (r.pledge_items || []).map((i: any) => i.item_description).join(' ').toLowerCase();
          return pNo.includes(term) || cName.includes(term) || cPhone.includes(term) || desc.includes(term);
        });
      }

      records.sort((a: any, b: any) => (b.pledge_date || '').localeCompare(a.pledge_date || ''));

      sendJson(res, 200, { success: true, count: records.length, data: records });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // 3. GET /api/v1/pawn/pledges/:id — Detailed Pledge Contract View
  // ============================================================================
  const singlePledgeMatch = pathname.match(/^\/api\/v1\/(?:pawn\/pledges|pledges)\/([a-zA-Z0-9_-]+)$/);
  if (singlePledgeMatch && method === 'GET') {
    const pledgeId = singlePledgeMatch[1];
    try {
      const pledge = await fetchPledgeByIdWithRelations(pledgeId);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge contract not found' });
        return true;
      }

      if (!auth.isStaff && pledge.customers?.user_id !== auth.user?.id && pledge.customers?.email !== auth.user?.email) {
        sendJson(res, 403, { success: false, error: 'Access denied: You can only view your own pledge contracts.' });
        return true;
      }

      const totalPaidPrincipal = (pledge.part_payments || []).reduce((s: number, p: any) => s + (Number(p.principal_paid) || 0), 0);
      const totalPaidInterest = (pledge.part_payments || []).reduce((s: number, p: any) => s + (Number(p.interest_paid) || 0), 0);
      const remainingPrincipal = Math.max(0, Number(pledge.loan_amount) - totalPaidPrincipal);

      const daysElapsed = Math.max(0, Math.round((new Date().getTime() - new Date(pledge.pledge_date).getTime()) / (1000 * 60 * 60 * 24)));
      const rate = Number(pledge.interest_rate) || 1.5;
      const dailyRate = pledge.interest_type === 'daily' ? rate : (pledge.interest_type === 'annual' ? rate / 365 : rate / 30);
      const currentAccrued = roundMoney((remainingPrincipal * dailyRate * daysElapsed) / 100);

      const contractDetails = {
        ...pledge,
        remaining_principal: remainingPrincipal,
        total_paid_principal: totalPaidPrincipal,
        total_paid_interest: totalPaidInterest,
        days_elapsed: daysElapsed,
        current_accrued_interest: currentAccrued,
        total_payoff_amount: roundMoney(remainingPrincipal + currentAccrued)
      };

      sendJson(res, 200, { success: true, data: contractDetails });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // 4. POST /api/v1/pawn/pledges or /api/v1/pledges — Create New Pawn Loan
  // ============================================================================
  if ((pathname === '/api/v1/pawn/pledges' || pathname === '/api/v1/pledges' || pathname === '/api/pledges') && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Only authorized pawn shop staff can originate pawn loans.' });
      return true;
    }

    try {
      const {
        customer_id,
        loan_amount,
        interest_rate = 1.5,
        interest_type = 'monthly',
        due_date,
        items = [],
        document_charges = 250,
        disbursement_method = 'cash',
        disbursement_reference,
        notes,
        vault_locker_no = 'Vault A - Locker 01',
        override_reason
      } = body;

      if (!customer_id) {
        sendJson(res, 400, { success: false, error: 'Customer selection is required.' });
        return true;
      }

      const numLoan = Number(loan_amount);
      if (!Number.isFinite(numLoan) || numLoan <= 0) {
        sendJson(res, 400, { success: false, error: 'Approved loan amount must be greater than zero.' });
        return true;
      }

      // Check Customer Record & KYC
      const customer = memoryStore.customers.find((c: any) => c.id === customer_id);
      if (!customer) {
        sendJson(res, 404, { success: false, error: 'Selected customer record was not found.' });
        return true;
      }

      if (customer.is_blocked) {
        sendJson(res, 403, { success: false, error: `Customer is blocked from receiving loans: ${customer.block_reason || 'Compliance block'}` });
        return true;
      }

      // Calculate collateral weights & valuation
      const grossWeight = items.reduce((sum: number, i: any) => sum + (Number(i.gross_weight_grams) || 0), 0);
      const stoneWeight = items.reduce((sum: number, i: any) => sum + (Number(i.stone_weight_grams) || 0), 0);
      const netWeight = Math.max(0, grossWeight - stoneWeight);
      const appraisedValue = items.reduce((sum: number, i: any) => sum + (Number(i.item_value) || 0), 0) || Math.round(numLoan / 0.75);

      // Regulatory 75% LTV Check
      const maxPermissible75Ltv = Math.floor(appraisedValue * 0.75);
      if (numLoan > maxPermissible75Ltv && !override_reason) {
        sendJson(res, 400, {
          success: false,
          error: `Loan amount ₹${numLoan.toLocaleString('en-IN')} exceeds the statutory 75% LTV ceiling of ₹${maxPermissible75Ltv.toLocaleString('en-IN')}. Authorized manager override reason is required.`
        });
        return true;
      }

      const year = new Date().getFullYear();
      const pledgeNumber = `PL-${year}-${Date.now().toString().slice(-5)}`;
      const pledgeId = crypto.randomUUID();

      const computedDueDate = due_date || (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        return d.toISOString().split('T')[0];
      })();

      const pledgeRecord: any = {
        id: pledgeId,
        pledge_number: pledgeNumber,
        customer_id,
        customer_name: customer.full_name,
        loan_amount: numLoan,
        interest_rate: Number(interest_rate),
        interest_type,
        pledge_date: new Date().toISOString().split('T')[0],
        due_date: computedDueDate,
        grace_period_days: 7,
        total_weight_grams: grossWeight || 10,
        total_items: items.length || 1,
        appraised_value: appraisedValue,
        document_charges: Number(document_charges) || 250,
        disbursement_method,
        disbursement_reference: disbursement_reference || `DISB-${pledgeNumber}`,
        maker_staff_name: auth.user.email || 'Pawn Appraiser',
        checker_staff_name: auth.user.email || 'Admin Manager',
        approved_at: new Date().toISOString(),
        kyc_status_at_creation: customer.kyc_status || 'VERIFIED',
        vault_locker_no,
        accrued_interest: 0,
        total_principal_paid: 0,
        total_interest_paid: 0,
        last_payment_date: null,
        collateral_released: false,
        status: 'active',
        ltv_ratio_percentage: roundMoney((numLoan / appraisedValue) * 100),
        notes: notes || null,
        valuation_snapshot: {
          appraised_at: new Date().toISOString(),
          gross_weight_grams: grossWeight,
          stone_weight_grams: stoneWeight,
          net_weight_grams: netWeight,
          appraised_value: appraisedValue,
          ltv_percentage: roundMoney((numLoan / appraisedValue) * 100),
          override_reason: override_reason || null
        },
        created_at: new Date().toISOString()
      };

      // Insert to memoryStore
      memoryStore.pledges.unshift(pledgeRecord);

      // Insert Collateral Items
      if (items.length > 0) {
        items.forEach((i: any, idx: number) => {
          const itemRecord = {
            id: crypto.randomUUID(),
            pledge_id: pledgeId,
            item_description: i.item_description || `Pledged Article #${idx + 1}`,
            item_category: i.category || 'other',
            gross_weight_grams: Number(i.gross_weight_grams) || 10,
            stone_weight_grams: Number(i.stone_weight_grams) || 0,
            net_weight_grams: Math.max(0, (Number(i.gross_weight_grams) || 10) - (Number(i.stone_weight_grams) || 0)),
            purity: i.purity || '22K',
            quantity: Number(i.quantity) || 1,
            item_value: Number(i.item_value) || Math.round(numLoan / 0.75),
            huid_code: i.huid_code || null,
            hallmark_certified: i.hallmark_certified ?? true,
            condition_grade: i.condition_grade || 'good',
            vault_tag: `${pledgeNumber}-ITM-${idx + 1}`,
            custody_status: 'in_vault',
            created_at: new Date().toISOString()
          };
          memoryStore.pledge_items.push(itemRecord);
        });
      }

      // Balanced Double-Entry Accounting
      const journalEntry = {
        id: crypto.randomUUID(),
        pledge_id: pledgeId,
        entry_type: 'disbursement',
        debit_account: 'Pawn Loan Portfolio Asset (1200)',
        credit_account: disbursement_method === 'bank_transfer' ? 'HDFC Bank Operating (1002)' : 'Vault Cash in Hand (1001)',
        amount: numLoan,
        payment_mode: disbursement_method,
        reference_no: disbursement_reference || `DISB-${pledgeNumber}`,
        narration: `Collateral loan disbursed for Pledge #${pledgeNumber} to ${customer.full_name}`,
        created_by: auth.user.email || 'Pawn System',
        created_at: new Date().toISOString()
      };
      memoryStore.pawn_accounting_ledger.unshift(journalEntry);

      // Log Vault Custody Intake
      const vaultLog = {
        id: crypto.randomUUID(),
        pledge_id: pledgeId,
        action: 'intake',
        from_location: 'Store Counter Appraisal',
        to_location: vault_locker_no,
        handled_by: auth.user.email || 'Pawn Staff',
        notes: `Intake of ${items.length || 1} collateral jewellery items into safe custody.`,
        created_at: new Date().toISOString()
      };
      memoryStore.collateral_vault_custody_log.unshift(vaultLog);

      broadcastRealtimeEvent('pawn-loans.created', pledgeRecord);

      createAndDispatchNotification({
        recipient_id: customer_id,
        recipient_role: 'customer',
        event_type: 'pawn.pledge_created',
        category: 'pawn',
        severity: 'success',
        title: `Pawn Loan Disbursed: #${pledgeNumber}`,
        message: `Your collateral loan for ₹${numLoan.toLocaleString('en-IN')} has been approved and disbursed. Jewellery placed into insured vault custody.`,
        related_entity_type: 'pledge',
        related_entity_id: pledgeId,
        destination_route: '/dashboard?tab=pawn_loans',
        idempotency_key: `pawn-disb-${pledgeId}`
      }).catch(() => {});

      sendJson(res, 201, {
        success: true,
        message: `Pawn loan #${pledgeNumber} successfully created and disbursed.`,
        data: pledgeRecord
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // 5. POST /api/v1/pawn/repay — Collect Interest / Principal Part Payment
  // ============================================================================
  if ((pathname === '/api/v1/pawn/repay' || pathname === '/api/v1/pledges/repay') && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to process pawn repayment.' });
      return true;
    }

    try {
      const { pledge_id, payment_amount, payment_mode = 'cash', payment_type = 'combined', notes } = body;
      const numPayment = Number(payment_amount);

      if (!pledge_id || !Number.isFinite(numPayment) || numPayment <= 0) {
        sendJson(res, 400, { success: false, error: 'Valid pledge_id and positive payment_amount required.' });
        return true;
      }

      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      if (pledge.status === 'closed' || pledge.status === 'sold') {
        sendJson(res, 400, { success: false, error: `Cannot process payment on pledge with status '${pledge.status}'.` });
        return true;
      }

      const previousPayments = memoryStore.part_payments.filter((p: any) => p.pledge_id === pledge_id);
      const alreadyPaidPrincipal = previousPayments.reduce((s: number, p: any) => s + (Number(p.principal_paid) || 0), 0);
      const remainingPrincipal = Math.max(0, Number(pledge.loan_amount) - alreadyPaidPrincipal);

      let interestPaid = 0;
      let principalPaid = 0;

      if (payment_type === 'interest_only') {
        interestPaid = numPayment;
        principalPaid = 0;
      } else if (payment_type === 'principal_only') {
        principalPaid = Math.min(numPayment, remainingPrincipal);
        interestPaid = 0;
      } else {
        const daysElapsed = Math.max(0, Math.round((new Date().getTime() - new Date(pledge.pledge_date).getTime()) / (1000 * 60 * 60 * 24)));
        const rate = Number(pledge.interest_rate) || 1.5;
        const dailyRate = pledge.interest_type === 'daily' ? rate : (pledge.interest_type === 'annual' ? rate / 365 : rate / 30);
        const currentAccrued = roundMoney((remainingPrincipal * dailyRate * daysElapsed) / 100);

        interestPaid = Math.min(numPayment, currentAccrued);
        const remainder = roundMoney(numPayment - interestPaid);
        principalPaid = Math.min(remainder, remainingPrincipal);
      }

      const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
      const paymentRecord = {
        id: crypto.randomUUID(),
        pledge_id,
        payment_date: new Date().toISOString().split('T')[0],
        payment_amount: numPayment,
        principal_paid: principalPaid,
        interest_paid: interestPaid,
        payment_mode,
        receipt_number: receiptNumber,
        notes: notes || null,
        created_by: auth.user.email || 'Pawn Cashier',
        created_at: new Date().toISOString()
      };

      memoryStore.part_payments.unshift(paymentRecord);

      // Update pledge balances
      const newTotalPrincipalPaid = alreadyPaidPrincipal + principalPaid;
      pledge.total_principal_paid = newTotalPrincipalPaid;
      pledge.total_interest_paid = (pledge.total_interest_paid || 0) + interestPaid;
      pledge.last_payment_date = new Date().toISOString().split('T')[0];
      if (newTotalPrincipalPaid >= Number(pledge.loan_amount)) {
        pledge.status = 'partially_paid'; // remains active until formal redemption settlement
      } else {
        pledge.status = 'partially_paid';
      }

      // Accounting entries
      const assetAcc = payment_mode === 'bank_transfer' || payment_mode === 'upi' ? 'HDFC Bank Operating (1002)' : 'Vault Cash in Hand (1001)';
      if (interestPaid > 0) {
        memoryStore.pawn_accounting_ledger.unshift({
          id: crypto.randomUUID(),
          pledge_id,
          entry_type: 'interest_collection',
          debit_account: assetAcc,
          credit_account: 'Pawn Interest Income (4100)',
          amount: interestPaid,
          payment_mode,
          reference_no: receiptNumber,
          narration: `Interest receipt against Pledge #${pledge.pledge_number}`,
          created_by: auth.user.email || 'Pawn System',
          created_at: new Date().toISOString()
        });
      }
      if (principalPaid > 0) {
        memoryStore.pawn_accounting_ledger.unshift({
          id: crypto.randomUUID(),
          pledge_id,
          entry_type: 'principal_repayment',
          debit_account: assetAcc,
          credit_account: 'Pawn Loan Portfolio Asset (1200)',
          amount: principalPaid,
          payment_mode,
          reference_no: receiptNumber,
          narration: `Principal repayment against Pledge #${pledge.pledge_number}`,
          created_by: auth.user.email || 'Pawn System',
          created_at: new Date().toISOString()
        });
      }

      if (pledge.customer_id) {
        createAndDispatchNotification({
          recipient_id: pledge.customer_id,
          recipient_role: 'customer',
          event_type: 'pawn.payment_received',
          category: 'pawn',
          severity: 'success',
          title: `Payment Received: ₹${numPayment.toLocaleString('en-IN')}`,
          message: `Receipt #${receiptNumber} credited against loan #${pledge.pledge_number}. Remaining principal: ₹${Math.max(0, remainingPrincipal - principalPaid).toLocaleString('en-IN')}.`,
          related_entity_type: 'pledge',
          related_entity_id: pledge_id,
          destination_route: '/dashboard?tab=pawn_loans',
          idempotency_key: `pawn-pay-${paymentRecord.id}`
        }).catch(() => {});
      }

      broadcastRealtimeEvent('pawn-loans.repayment.recorded', { pledge_id, payment: paymentRecord });

      sendJson(res, 200, {
        success: true,
        message: `Payment of ₹${numPayment.toLocaleString('en-IN')} successfully recorded.`,
        data: paymentRecord
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // 6. POST /api/v1/pawn/redeem — Settle Loan Full Payoff
  // ============================================================================
  if ((pathname === '/api/v1/pawn/redeem' || pathname === '/api/v1/pledges/redeem') && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to settle and redeem pawn loan.' });
      return true;
    }

    try {
      const { pledge_id, total_amount, payment_mode = 'cash', notes } = body;
      const numTotal = Number(total_amount);

      if (!pledge_id || !Number.isFinite(numTotal) || numTotal <= 0) {
        sendJson(res, 400, { success: false, error: 'Valid pledge_id and positive total_amount required.' });
        return true;
      }

      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      if (pledge.status === 'closed') {
        sendJson(res, 400, { success: false, error: 'This pledge contract has already been settled and closed.' });
        return true;
      }

      const receiptNumber = `RED-${Date.now().toString().slice(-6)}`;
      const returnRecord = {
        id: crypto.randomUUID(),
        pledge_id,
        return_date: new Date().toISOString().split('T')[0],
        principal_amount: pledge.loan_amount,
        interest_amount: Math.max(0, numTotal - Number(pledge.loan_amount)),
        penalty_amount: 0,
        total_amount: numTotal,
        payment_mode,
        receipt_number: receiptNumber,
        notes: notes || null,
        created_by: auth.user.email || 'Pawn Cashier',
        created_at: new Date().toISOString()
      };

      memoryStore.pledge_returns.unshift(returnRecord);

      // Update pledge status to closed
      pledge.status = 'closed';
      pledge.redemption_date = new Date().toISOString().split('T')[0];
      pledge.total_principal_paid = pledge.loan_amount;

      // Accounting ledger entry
      const assetAcc = payment_mode === 'bank_transfer' || payment_mode === 'upi' ? 'HDFC Bank Operating (1002)' : 'Vault Cash in Hand (1001)';
      memoryStore.pawn_accounting_ledger.unshift({
        id: crypto.randomUUID(),
        pledge_id,
        entry_type: 'redemption',
        debit_account: assetAcc,
        credit_account: 'Pawn Loan Portfolio Asset (1200)',
        amount: Number(pledge.loan_amount),
        payment_mode,
        reference_no: receiptNumber,
        narration: `Full loan redemption for Pledge #${pledge.pledge_number}`,
        created_by: auth.user.email || 'Pawn System',
        created_at: new Date().toISOString()
      });

      broadcastRealtimeEvent('pawn-loans.redeemed', { pledge_id, returnData: returnRecord });

      createAndDispatchNotification({
        recipient_id: pledge.customer_id,
        recipient_role: 'customer',
        event_type: 'pawn.loan_settled',
        category: 'pawn',
        severity: 'success',
        title: `Pledge #${pledge.pledge_number} Settled`,
        message: `Your collateral loan has been fully settled. Please present receipt #${receiptNumber} to the vault custodian to collect your jewellery.`,
        related_entity_type: 'pledge',
        related_entity_id: pledge_id,
        destination_route: '/dashboard?tab=pawn_loans',
        idempotency_key: `pawn-settle-${pledge_id}`
      }).catch(() => {});

      sendJson(res, 200, {
        success: true,
        message: 'Pawn loan settled successfully. Ready for collateral release authorization.',
        data: returnRecord
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // 7. POST /api/v1/pawn/vault/release — Release Collateral Jewellery from Vault
  // ============================================================================
  if (pathname === '/api/v1/pawn/vault/release' && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to authorize jewellery custody release.' });
      return true;
    }

    try {
      const { pledge_id, recipient_name, id_verified = true, notes } = body;
      if (!pledge_id) {
        sendJson(res, 400, { success: false, error: 'pledge_id is required' });
        return true;
      }

      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      if (pledge.status !== 'closed') {
        sendJson(res, 400, {
          success: false,
          error: `Cannot release collateral: Loan has not been fully settled (current status: '${pledge.status}').`
        });
        return true;
      }

      if (pledge.collateral_released) {
        sendJson(res, 400, {
          success: false,
          error: `Collateral has already been released on ${pledge.collateral_released_at} by ${pledge.collateral_released_by}.`
        });
        return true;
      }

      const releaseTime = new Date().toISOString();
      const staffName = auth.user.email || 'Vault Custodian';

      pledge.collateral_released = true;
      pledge.collateral_released_at = releaseTime;
      pledge.collateral_released_by = staffName;

      // Update item statuses
      memoryStore.pledge_items
        .filter((i: any) => i.pledge_id === pledge_id)
        .forEach((i: any) => {
          i.custody_status = 'released';
          i.released_at = releaseTime;
          i.released_by = staffName;
        });

      // Custody log
      memoryStore.collateral_vault_custody_log.unshift({
        id: crypto.randomUUID(),
        pledge_id,
        action: 'release',
        from_location: pledge.vault_locker_no || 'Vault A',
        to_location: `Customer Handover (${recipient_name || pledge.customer_name})`,
        handled_by: staffName,
        verified_by: id_verified ? 'Government ID Verified' : 'Standard Handover',
        notes: notes || 'Pledged articles inspected and handed over to verified owner in pristine condition.',
        created_at: releaseTime
      });

      broadcastRealtimeEvent('pawn-loans.collateral.released', { pledge_id, released_at: releaseTime });

      createAndDispatchNotification({
        recipient_id: pledge.customer_id,
        recipient_role: 'customer',
        event_type: 'pawn.collateral_released',
        category: 'pawn',
        severity: 'success',
        title: `Collateral Released: Pledge #${pledge.pledge_number}`,
        message: `Your pledged jewellery articles have been safely returned from vault custody. Thank you for choosing YAZHINI Fine Jewels.`,
        related_entity_type: 'pledge',
        related_entity_id: pledge_id,
        destination_route: '/dashboard?tab=pawn_loans',
        idempotency_key: `pawn-rel-${pledge_id}`
      }).catch(() => {});

      sendJson(res, 200, {
        success: true,
        message: 'Collateral jewellery successfully released to patron and vault custody updated.',
        released_at: releaseTime,
        released_by: staffName
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // PHASE 3: VAULT TRANSFER, AUDIT & INCIDENT LOGGING
  // ============================================================================
  if (pathname === '/api/v1/pawn/vault/transfer' && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Vault staff permissions required.' });
      return true;
    }

    try {
      const { pledge_id, from_locker, to_locker, transfer_reason } = body;
      if (!pledge_id || !to_locker) {
        sendJson(res, 400, { success: false, error: 'pledge_id and to_locker required.' });
        return true;
      }

      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      const previousLocker = pledge.vault_locker_no;
      pledge.vault_locker_no = to_locker;

      memoryStore.collateral_vault_custody_log.unshift({
        id: crypto.randomUUID(),
        pledge_id,
        action: 'transfer',
        from_location: from_locker || previousLocker,
        to_location: to_locker,
        handled_by: auth.user.email || 'Vault Officer',
        verified_by: 'Staff Supervised',
        notes: transfer_reason || 'Inter-locker vault transfer for capacity balancing.',
        created_at: new Date().toISOString()
      });

      sendJson(res, 200, {
        success: true,
        message: `Collateral successfully transferred from ${previousLocker} to ${to_locker}.`,
        new_location: to_locker
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  if (pathname === '/api/v1/pawn/vault/audit' && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required for vault audit.' });
      return true;
    }

    try {
      const { pledge_id, audit_notes, condition_confirmed = true } = body;
      if (!pledge_id) {
        sendJson(res, 400, { success: false, error: 'pledge_id is required.' });
        return true;
      }

      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      memoryStore.collateral_vault_custody_log.unshift({
        id: crypto.randomUUID(),
        pledge_id,
        action: 'audit_check',
        from_location: pledge.vault_locker_no,
        to_location: pledge.vault_locker_no,
        handled_by: auth.user.email || 'Vault Auditor',
        verified_by: condition_confirmed ? 'Physical Seal & Weight Verified' : 'Inspection Note Added',
        notes: audit_notes || 'Routine physical vault audit check passed without discrepancy.',
        created_at: new Date().toISOString()
      });

      sendJson(res, 200, { success: true, message: 'Vault audit check recorded successfully.' });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // 8. POST /api/v1/pawn/renew — Contract Renewal / Term Restructuring
  // ============================================================================
  if (pathname === '/api/v1/pawn/renew' && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to renew pawn contract.' });
      return true;
    }

    try {
      const { pledge_id, extension_months = 6, new_interest_rate, renewal_fee = 250, notes } = body;
      if (!pledge_id) {
        sendJson(res, 400, { success: false, error: 'pledge_id is required' });
        return true;
      }

      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      if (pledge.status === 'closed' || pledge.status === 'sold') {
        sendJson(res, 400, { success: false, error: `Cannot renew pledge with status '${pledge.status}'.` });
        return true;
      }

      const prevDueDate = pledge.due_date || pledge.pledge_date;
      const baseDate = new Date(prevDueDate);
      baseDate.setMonth(baseDate.getMonth() + Number(extension_months));
      const newDueDate = baseDate.toISOString().split('T')[0];

      const renewalRecord = {
        id: crypto.randomUUID(),
        pledge_id,
        renewal_date: new Date().toISOString().split('T')[0],
        previous_due_date: prevDueDate,
        new_due_date: newDueDate,
        interest_rate: new_interest_rate ? Number(new_interest_rate) : Number(pledge.interest_rate),
        renewal_fee: Number(renewal_fee) || 0,
        notes: notes || `Contract extended by ${extension_months} months.`,
        approved_by: auth.user.email || 'Pawn Manager',
        created_at: new Date().toISOString()
      };

      memoryStore.pledge_renewals.unshift(renewalRecord);

      // Update pledge
      pledge.due_date = newDueDate;
      pledge.interest_rate = renewalRecord.interest_rate;
      pledge.renewal_count = (pledge.renewal_count || 0) + 1;
      pledge.status = 'active';

      if (Number(renewal_fee) > 0) {
        memoryStore.pawn_accounting_ledger.unshift({
          id: crypto.randomUUID(),
          pledge_id,
          entry_type: 'renewal_fee',
          debit_account: 'Vault Cash in Hand (1001)',
          credit_account: 'Contract Restructuring & Renewal Fee (4200)',
          amount: Number(renewal_fee),
          payment_mode: 'cash',
          reference_no: `REN-${renewalRecord.id.slice(0, 8)}`,
          narration: `Renewal documentation fee for Pledge #${pledge.pledge_number}`,
          created_by: auth.user.email || 'Pawn System',
          created_at: new Date().toISOString()
        });
      }

      broadcastRealtimeEvent('pawn-loans.renewed', { pledge_id, renewal: renewalRecord });

      createAndDispatchNotification({
        recipient_id: pledge.customer_id,
        recipient_role: 'customer',
        event_type: 'pawn.renewal_approved',
        category: 'pawn',
        severity: 'info',
        title: `Pawn Loan Extended: #${pledge.pledge_number}`,
        message: `Your pledge contract has been renewed until ${new Date(newDueDate).toLocaleDateString('en-IN')}.`,
        related_entity_type: 'pledge',
        related_entity_id: pledge_id,
        destination_route: '/dashboard?tab=pawn_loans',
        idempotency_key: `pawn-ren-${renewalRecord.id}`
      }).catch(() => {});

      sendJson(res, 200, {
        success: true,
        message: `Pawn contract successfully renewed until ${newDueDate}.`,
        data: renewalRecord
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // PHASE 5: AUTOMATED BACKGROUND MATURITY & OVERDUE ALERT RUNNER
  // ============================================================================
  if (pathname === '/api/v1/pawn/run-alerts' && method === 'POST') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to trigger alert runner.' });
      return true;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activePledges = memoryStore.pledges.filter((p: any) => p.status === 'active' || p.status === 'partially_paid');
      let dueSoonCount = 0;
      let overdueCount = 0;
      let skippedDedupCount = 0;

      for (const p of activePledges) {
        if (!p.due_date) continue;
        const dueDate = new Date(p.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const grace = Number(p.grace_period_days) || 7;

        if (diffDays <= 7 && diffDays >= 0) {
          // Due soon (within 7 days)
          const idempotencyKey = `pawn-due-alert-${p.id}-${today.toISOString().split('T')[0]}`;
          dueSoonCount++;
          createAndDispatchNotification({
            recipient_id: p.customer_id,
            recipient_role: 'customer',
            event_type: 'pawn.maturity_due_soon',
            category: 'pawn',
            severity: 'info',
            title: `Reminder: Pawn Loan #${p.pledge_number} Due Soon`,
            message: `Your collateral loan #${p.pledge_number} of ₹${Number(p.loan_amount).toLocaleString('en-IN')} reaches its maturity date on ${p.due_date}. Please pay monthly interest online or request a contract extension.`,
            related_entity_type: 'pledge',
            related_entity_id: p.id,
            destination_route: '/dashboard?tab=pawn_loans',
            idempotency_key: idempotencyKey
          }).catch(() => { skippedDedupCount++; });
        } else if (diffDays < 0 && Math.abs(diffDays) > grace) {
          // Overdue beyond statutory grace period
          const idempotencyKey = `pawn-overdue-alert-${p.id}-${today.toISOString().split('T')[0]}`;
          overdueCount++;
          createAndDispatchNotification({
            recipient_id: p.customer_id,
            recipient_role: 'customer',
            event_type: 'pawn.loan_overdue',
            category: 'pawn',
            severity: 'warning',
            title: `Statutory Notice: Pawn Loan #${p.pledge_number} is Overdue`,
            message: `Your pledge contract #${p.pledge_number} has passed its maturity due date. In accordance with Tamil Nadu Pawnbrokers Act standards, human review is in progress. Please clear outstanding interest to avoid regulatory escalation.`,
            related_entity_type: 'pledge',
            related_entity_id: p.id,
            destination_route: '/dashboard?tab=pawn_loans',
            idempotency_key: idempotencyKey
          }).catch(() => { skippedDedupCount++; });
        }
      }

      sendJson(res, 200, {
        success: true,
        message: 'Automated maturity and overdue alert scan completed.',
        summary: {
          active_loans_scanned: activePledges.length,
          due_soon_reminders_triggered: dueSoonCount,
          overdue_notices_triggered: overdueCount,
          deduplicated_or_skipped: skippedDedupCount,
          timestamp: new Date().toISOString()
        }
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // PHASE 4: CUSTOMER PORTAL LOAN SERVICES
  // ============================================================================
  if (pathname === '/api/v1/pawn/customer-loans' && method === 'GET') {
    if (!auth.user) {
      sendJson(res, 401, { success: false, error: 'Authentication required to view customer loans.' });
      return true;
    }

    try {
      const userCust = memoryStore.customers.find((c: any) => c.user_id === auth.user.id || c.email === auth.user.email);
      if (!userCust) {
        sendJson(res, 200, { success: true, count: 0, data: [] });
        return true;
      }

      const allPledges = await fetchAllPledgesWithRelations();
      const myPledges = allPledges.filter((p: any) => p.customer_id === userCust.id);

      const maskedLoans = myPledges.map((p: any) => {
        const totalPaidPrincipal = (p.part_payments || []).reduce((s: number, pay: any) => s + (Number(pay.principal_paid) || 0), 0);
        const remainingPrincipal = Math.max(0, Number(p.loan_amount) - totalPaidPrincipal);
        const daysElapsed = Math.max(0, Math.round((new Date().getTime() - new Date(p.pledge_date).getTime()) / (1000 * 60 * 60 * 24)));
        const rate = Number(p.interest_rate) || 1.5;
        const dailyRate = p.interest_type === 'daily' ? rate : (p.interest_type === 'annual' ? rate / 365 : rate / 30);
        const accruedInterest = roundMoney((remainingPrincipal * dailyRate * daysElapsed) / 100);

        // Mask phone for patron privacy
        const rawPhone = userCust.phone || '';
        const maskedPhone = rawPhone.length > 5 ? `${rawPhone.slice(0, 3)}****${rawPhone.slice(-3)}` : rawPhone;

        return {
          id: p.id,
          pledge_number: p.pledge_number,
          pledge_date: p.pledge_date,
          due_date: p.due_date,
          loan_amount: p.loan_amount,
          remaining_principal: remainingPrincipal,
          current_accrued_interest: accruedInterest,
          total_payoff_estimate: roundMoney(remainingPrincipal + accruedInterest),
          total_weight_grams: p.total_weight_grams,
          total_items: p.total_items,
          status: p.status,
          vault_locker_no: p.vault_locker_no,
          collateral_released: p.collateral_released,
          masked_customer: {
            full_name: userCust.full_name,
            phone: maskedPhone,
            kyc_status: userCust.kyc_status
          },
          items: p.pledge_items || [],
          payment_history: p.part_payments || []
        };
      });

      sendJson(res, 200, { success: true, count: maskedLoans.length, data: maskedLoans });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // Customer Payoff Estimate Simulator
  if (pathname === '/api/v1/pawn/customer/estimate-payoff' && method === 'POST') {
    try {
      const { pledge_id, target_date } = body;
      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      const totalPaidPrincipal = (memoryStore.part_payments || [])
        .filter((pay: any) => pay.pledge_id === pledge_id)
        .reduce((s: number, pay: any) => s + (Number(pay.principal_paid) || 0), 0);
      const remainingPrincipal = Math.max(0, Number(pledge.loan_amount) - totalPaidPrincipal);

      const target = target_date ? new Date(target_date) : new Date();
      const start = new Date(pledge.pledge_date);
      const days = Math.max(0, Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const rate = Number(pledge.interest_rate) || 1.5;
      const dailyRate = pledge.interest_type === 'daily' ? rate : (pledge.interest_type === 'annual' ? rate / 365 : rate / 30);
      const interest = roundMoney((remainingPrincipal * dailyRate * days) / 100);

      sendJson(res, 200, {
        success: true,
        estimate: {
          pledge_number: pledge.pledge_number,
          principal_outstanding: remainingPrincipal,
          interest_rate: `${pledge.interest_rate}% ${pledge.interest_type}`,
          as_of_target_date: target.toISOString().split('T')[0],
          days_elapsed: days,
          accrued_interest: interest,
          total_payoff_amount: roundMoney(remainingPrincipal + interest)
        }
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // Customer Renewal Request
  if (pathname === '/api/v1/pawn/customer/request-renewal' && method === 'POST') {
    try {
      const { pledge_id, desired_extension_months = 6, patron_notes } = body;
      const pledge = memoryStore.pledges.find((p: any) => p.id === pledge_id);
      if (!pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      createAndDispatchNotification({
        recipient_id: 'admin_all',
        recipient_role: 'admin',
        event_type: 'pawn.customer_renewal_requested',
        category: 'pawn',
        severity: 'info',
        title: `Patron Renewal Request: Pledge #${pledge.pledge_number}`,
        message: `Patron has requested a ${desired_extension_months}-month term renewal for Pledge #${pledge.pledge_number}. Notes: ${patron_notes || 'None'}.`,
        related_entity_type: 'pledge',
        related_entity_id: pledge_id,
        destination_route: '/admin?tab=transactions',
        idempotency_key: `patron-ren-req-${pledge_id}-${Date.now()}`
      }).catch(() => {});

      sendJson(res, 200, {
        success: true,
        message: 'Your term renewal request has been transmitted to our senior loan manager for verification.'
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // ============================================================================
  // PHASE 6: FINANCIAL INTELLIGENCE & EXPORT REPORTS — GET /api/v1/pawn/reports
  // ============================================================================
  if (pathname === '/api/v1/pawn/reports' && method === 'GET') {
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required for pawn reports.' });
      return true;
    }

    try {
      const reportType = query.type || 'portfolio_summary';
      const format = query.format || 'json';

      if (reportType === 'accounting_ledger') {
        const ledger = memoryStore.pawn_accounting_ledger || [];
        if (format === 'csv') {
          let csv = 'ID,Pledge ID,Entry Type,Debit Account,Credit Account,Amount (INR),Payment Mode,Reference No,Narration,Date\n';
          ledger.forEach((l: any) => {
            csv += `"${l.id}","${l.pledge_id}","${l.entry_type}","${l.debit_account}","${l.credit_account}",${l.amount},"${l.payment_mode || ''}","${l.reference_no || ''}","${(l.narration || '').replace(/"/g, '""')}","${l.created_at}"\n`;
          });
          sendCsv(res, `pawn_accounting_ledger_${Date.now()}.csv`, csv);
          return true;
        }
        sendJson(res, 200, { success: true, count: ledger.length, data: ledger });
        return true;
      }

      if (reportType === 'vault_custody') {
        const logs = memoryStore.collateral_vault_custody_log || [];
        if (format === 'csv') {
          let csv = 'ID,Pledge ID,Action,From Location,To Location,Handled By,Verified By,Notes,Date\n';
          logs.forEach((v: any) => {
            csv += `"${v.id}","${v.pledge_id}","${v.action}","${v.from_location || ''}","${v.to_location || ''}","${v.handled_by || ''}","${v.verified_by || ''}","${(v.notes || '').replace(/"/g, '""')}","${v.created_at}"\n`;
          });
          sendCsv(res, `vault_custody_register_${Date.now()}.csv`, csv);
          return true;
        }
        sendJson(res, 200, { success: true, count: logs.length, data: logs });
        return true;
      }

      if (reportType === 'collateral_valuation') {
        const items = memoryStore.pledge_items || [];
        if (format === 'csv') {
          let csv = 'Item Tag,Pledge ID,Description,Category,Purity,Gross Weight (g),Stone Weight (g),Net Weight (g),Appraised Value (INR),HUID,Custody Status\n';
          items.forEach((i: any) => {
            csv += `"${i.vault_tag || ''}","${i.pledge_id}","${(i.item_description || '').replace(/"/g, '""')}","${i.item_category || ''}","${i.purity || ''}",${i.gross_weight_grams || 0},${i.stone_weight_grams || 0},${i.net_weight_grams || 0},${i.item_value || 0},"${i.huid_code || ''}","${i.custody_status || ''}"\n`;
          });
          sendCsv(res, `collateral_valuation_inventory_${Date.now()}.csv`, csv);
          return true;
        }
        sendJson(res, 200, { success: true, count: items.length, data: items });
        return true;
      }

      // Default: portfolio_summary
      const pledges = memoryStore.pledges || [];
      if (format === 'csv') {
        let csv = 'Pledge Number,Customer Name,Loan Amount (INR),Status,Pledge Date,Due Date,Total Weight (g),Appraised Value (INR),Vault Locker,LTV (%)\n';
        pledges.forEach((p: any) => {
          csv += `"${p.pledge_number}","${p.customer_name || ''}",${p.loan_amount},"${p.status}","${p.pledge_date}","${p.due_date || ''}",${p.total_weight_grams || 0},${p.appraised_value || 0},"${p.vault_locker_no || ''}",${p.ltv_ratio_percentage || 75}\n`;
        });
        sendCsv(res, `pawn_portfolio_summary_${Date.now()}.csv`, csv);
        return true;
      }

      sendJson(res, 200, {
        success: true,
        count: pledges.length,
        data: pledges
      });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  return false;
}
