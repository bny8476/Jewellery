import { supabase } from '../lib/supabase';
import type { Pledge, PledgeFormData } from '../types/pawnshop';
import { handleApiError, logError } from '../utils/errorHandler';
import { validateRequired, validatePositiveNumber } from '../utils/validation';
import { realtimeManager } from './realtimeService';
import { authenticatedFetch } from './authenticatedApiClient';

// ============================================
// PAWN LOAN DASHBOARD STATS
// ============================================

export interface PawnDashboardMetrics {
  active_pawn_loans: number;
  total_principal_outstanding: number;
  total_accrued_interest: number;
  total_interest_collected: number;
  loans_disbursed_today_count: number;
  loans_disbursed_today_amount: number;
  loans_disbursed_month_count: number;
  loans_disbursed_month_amount: number;
  loans_due_today: number;
  overdue_contracts_count: number;
  overdue_contracts_amount: number;
  contracts_nearing_maturity: number;
  total_pledged_gold_grams: number;
  total_collateral_valuation: number;
  redeemed_closed_contracts: number;
  pending_customer_kyc_reviews: number;
  as_of_timestamp: string;
}

export const getPawnDashboardStats = async (): Promise<PawnDashboardMetrics> => {
  try {
    const res = await authenticatedFetch('/api/v1/pawn/dashboard');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
    const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
    throw new Error(json.error || `Failed to fetch pawn dashboard: HTTP ${res.status}`);
  } catch (err: any) {
    // If it is an auth error, propagate it so the caller / UI handles session or permission issues
    if (
      err?.message?.includes('Authentication') ||
      err?.message?.includes('Forbidden') ||
      err?.message?.includes('Unauthorized') ||
      err?.message?.includes('session')
    ) {
      throw err;
    }
    console.debug('Dashboard API call failed, calculating from database:', err);
  }

  // Fallback: Calculate directly from Supabase
  const { data: pledges } = await supabase.from('pledges').select('*');
  const all = pledges || [];
  const active = all.filter((p: any) => p.status === 'active' || p.status === 'partially_paid');
  const closed = all.filter((p: any) => p.status === 'closed');

  const totalOutstanding = active.reduce((sum: number, p: any) => sum + (Number(p.loan_amount) || 0) - (Number(p.total_principal_paid) || 0), 0);
  const totalWeight = active.reduce((sum: number, p: any) => sum + (Number(p.total_weight_grams) || 0), 0);
  const totalValuation = active.reduce((sum: number, p: any) => sum + (Number(p.appraised_value) || 0), 0);

  return {
    active_pawn_loans: active.length,
    total_principal_outstanding: totalOutstanding,
    total_accrued_interest: Math.round(totalOutstanding * 0.015),
    total_interest_collected: all.reduce((sum: number, p: any) => sum + (Number(p.total_interest_paid) || 0), 0),
    loans_disbursed_today_count: 0,
    loans_disbursed_today_amount: 0,
    loans_disbursed_month_count: active.length,
    loans_disbursed_month_amount: totalOutstanding,
    loans_due_today: 0,
    overdue_contracts_count: 0,
    overdue_contracts_amount: 0,
    contracts_nearing_maturity: 0,
    total_pledged_gold_grams: totalWeight,
    total_collateral_valuation: totalValuation,
    redeemed_closed_contracts: closed.length,
    pending_customer_kyc_reviews: 0,
    as_of_timestamp: new Date().toISOString()
  };
};

// ============================================
// PLEDGES
// ============================================

export const getPledges = async (status?: string, search?: string): Promise<Pledge[]> => {
  return handleApiError(async () => {
    // 1. Try REST API endpoint
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);

      const res = await authenticatedFetch(`/api/v1/pawn/pledges?${params.toString()}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
      const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
      throw new Error(json.error || `Failed to fetch pledges: HTTP ${res.status}`);
    } catch (err: any) {
      if (
        err?.message?.includes('Authentication') ||
        err?.message?.includes('Forbidden') ||
        err?.message?.includes('Unauthorized') ||
        err?.message?.includes('session')
      ) {
        throw err;
      }
      // Fall through to Supabase query for network/connectivity errors
    }

    // 2. Direct Supabase query
    let query = supabase
      .from('pledges')
      .select(`
        *,
        customer:customers(*),
        items:pledge_items(*)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      logError(error, 'getPledges');
      throw error;
    }

    let results = data || [];
    if (search) {
      const term = search.toLowerCase();
      results = results.filter((r: any) =>
        (r.pledge_number || '').toLowerCase().includes(term) ||
        (r.customer?.full_name || '').toLowerCase().includes(term) ||
        (r.customer?.phone || '').toLowerCase().includes(term)
      );
    }

    return results;
  });
};

export const getPledgeById = async (id: string): Promise<Pledge> => {
  return handleApiError(async () => {
    if (!id) throw new Error('Pledge ID is required');

    try {
      const res = await authenticatedFetch(`/api/v1/pawn/pledges/${encodeURIComponent(id)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
      const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
      throw new Error(json.error || `Failed to fetch pledge: HTTP ${res.status}`);
    } catch (err: any) {
      if (
        err?.message?.includes('Authentication') ||
        err?.message?.includes('Forbidden') ||
        err?.message?.includes('Unauthorized') ||
        err?.message?.includes('session')
      ) {
        throw err;
      }
      // Fall through to Supabase
    }

    const { data, error } = await supabase
      .from('pledges')
      .select(`
        *,
        customer:customers(*),
        items:pledge_items(*),
        part_payments(*),
        pledge_returns(*),
        pledge_renewals(*),
        pawn_accounting_ledger(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      logError(error, 'getPledgeById');
      throw error;
    }
    return data;
  });
};

export const createPledge = async (pledgeData: PledgeFormData | any): Promise<Pledge> => {
  return handleApiError(async () => {
    const { items, ...pledge } = pledgeData;

    if (!validateRequired(pledge.customer_id)) {
      throw new Error('Customer ID is required to create a pledge');
    }

    if (!validatePositiveNumber(pledge.loan_amount)) {
      throw new Error('Loan amount must be a positive number');
    }

    if (!validatePositiveNumber(pledge.interest_rate)) {
      throw new Error('Interest rate must be a positive number');
    }

    // Try REST API first for atomic multi-table transaction & accounting ledger
    try {
      const res = await authenticatedFetch('/api/v1/pawn/pledges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...pledge, items })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
      const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
      throw new Error(json.error || `Failed to create pledge: HTTP ${res.status}`);
    } catch (e: any) {
      if (
        e?.message?.includes('Authentication') ||
        e?.message?.includes('Forbidden') ||
        e?.message?.includes('Unauthorized') ||
        e?.message?.includes('session')
      ) {
        throw e;
      }
      console.debug('REST pledge create fallback:', e);
    }

    // Direct Supabase fallback
    const totalWeight = (items || []).reduce((sum: number, item: any) => sum + (Number(item.gross_weight_grams) || 0), 0);
    const totalValue = (items || []).reduce((sum: number, item: any) => sum + (Number(item.item_value) || 0), 0);

    const { data: pledgeRecord, error: pledgeError } = await supabase
      .from('pledges')
      .insert({
        ...pledge,
        total_weight_grams: totalWeight,
        total_items: items ? items.length : 1,
        appraised_value: totalValue || pledge.loan_amount / 0.75
      })
      .select()
      .single();

    if (pledgeError) {
      logError(pledgeError, 'createPledge');
      throw pledgeError;
    }

    // Create pledge items
    if (items && items.length > 0) {
      const pledgeItems = items.map((item: any) => ({
        ...item,
        pledge_id: pledgeRecord.id
      }));

      const { error: itemsError } = await supabase
        .from('pledge_items')
        .insert(pledgeItems);

      if (itemsError) {
        logError(itemsError, 'createPledge:items');
      }
    }

    return pledgeRecord;
  });
};

export const updatePledge = async (id: string, updates: Partial<Pledge>): Promise<Pledge> => {
  return handleApiError(async () => {
    if (!id) throw new Error('Pledge ID is required');

    const { data, error } = await supabase
      .from('pledges')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logError(error, 'updatePledge');
      throw error;
    }
    return data;
  });
};

// ============================================
// EXTENDED OPERATIONAL ACTIONS VIA REST API
// ============================================

export const recordPawnRepayment = async (payload: {
  pledge_id: string;
  payment_amount: number;
  payment_type?: 'principal_only' | 'interest_only' | 'combined' | 'penalty';
  payment_mode?: string;
  notes?: string;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/repay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to record repayment');
  }
  return json.data;
};

export const repayPawnLoan = recordPawnRepayment;

export const redeemPawnLoan = async (payload: {
  pledge_id: string;
  total_amount: number;
  payment_mode?: string;
  notes?: string;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to redeem loan');
  }
  return json.data;
};

export const releaseCollateral = async (payload: {
  pledge_id: string;
  recipient_name?: string;
  id_verified?: boolean;
  notes?: string;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/vault/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to release collateral');
  }
  return json;
};

export const renewPawnLoan = async (payload: {
  pledge_id: string;
  extension_months?: number;
  new_interest_rate?: number;
  renewal_fee?: number;
  notes?: string;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/renew', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to renew contract');
  }
  return json.data;
};

export const sendDueReminder = async (pledge_id: string, reminder_type: 'due_soon' | 'overdue' = 'due_soon') => {
  const res = await authenticatedFetch('/api/v1/pawn/remind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pledge_id, reminder_type })
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to dispatch reminder');
  }
  return json;
};

export const calculatePawnValuation = async (payload: {
  items: any[];
  live_rates?: { gold22k?: number; gold24k?: number; silver?: number; timestamp?: string };
  ltv_percentage?: number;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/valuate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to calculate valuation');
  }
  return json.valuation_summary;
};

export const overridePawnValuation = async (payload: {
  pledge_id: string;
  overridden_appraised_value: number;
  override_reason: string;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/valuation-override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to override valuation');
  }
  return json.data;
};

export const runAutomatedPawnAlerts = async () => {
  const res = await authenticatedFetch('/api/v1/pawn/run-alerts', {
    method: 'POST'
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to run alert runner');
  }
  return json;
};

export const transferVaultCollateral = async (payload: {
  pledge_id: string;
  from_locker?: string;
  to_locker: string;
  transfer_reason?: string;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/vault/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to transfer vault collateral');
  }
  return json;
};

export const auditVaultCustody = async (payload: {
  pledge_id: string;
  audit_notes?: string;
  condition_confirmed?: boolean;
}) => {
  const res = await authenticatedFetch('/api/v1/pawn/vault/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to record vault audit');
  }
  return json;
};

export const downloadPawnReport = async (type: string, format: 'json' | 'csv' = 'csv') => {
  const res = await authenticatedFetch(`/api/v1/pawn/reports?type=${encodeURIComponent(type)}&format=${encodeURIComponent(format)}`);
  if (!res.ok) throw new Error('Failed to download report');

  if (format === 'csv') {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pawn_report_${type}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return true;
  }
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
};

export const getCustomerLoans = async () => {
  const res = await authenticatedFetch('/api/v1/pawn/customer-loans');
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch customer loans');
  }
  return json.data;
};

export const estimateCustomerPayoff = async (pledge_id: string, target_date?: string) => {
  const res = await authenticatedFetch('/api/v1/pawn/customer/estimate-payoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pledge_id, target_date })
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to estimate payoff');
  }
  return json.estimate;
};

export const requestCustomerRenewal = async (pledge_id: string, desired_extension_months = 6, patron_notes?: string) => {
  const res = await authenticatedFetch('/api/v1/pawn/customer/request-renewal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pledge_id, desired_extension_months, patron_notes })
  });
  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to request renewal');
  }
  return json;
};
