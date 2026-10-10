import { supabase } from '../lib/supabase';
import type {
    AdditionalPledge, PartPayment, PledgeReturn, PledgeSale,
    BankPledge, BankPledgeReceive, CashTransaction, DashboardStats, CancelledTransaction
} from '../types/pawnshop';
import { handleApiError, logError } from '../utils/errorHandler';
import { validateRequired, validatePositiveNumber } from '../utils/validation';

// ============================================
// PART PAYMENTS
// ============================================

export const createPartPayment = async (payment: Partial<PartPayment>): Promise<PartPayment> => {
    return handleApiError(async () => {
        if (!validateRequired(payment.pledge_id)) {
            throw new Error('Pledge ID is required');
        }
        if (!validatePositiveNumber(payment.payment_amount)) {
            throw new Error('Payment amount must be a positive number');
        }

        const { data, error } = await supabase
            .from('part_payments')
            .insert(payment)
            .select()
            .single();

        if (error) {
            logError(error, 'createPartPayment');
            throw error;
        }

        // Update pledge status
        const { error: updateError } = await supabase
            .from('pledges')
            .update({ status: 'partially_paid' })
            .eq('id', payment.pledge_id);

        if (updateError) {
            logError(updateError, 'createPartPayment - update status');
        }

        return data;
    });
};

export const getPartPayments = async (pledgeId: string): Promise<PartPayment[]> => {
    return handleApiError(async () => {
        if (!pledgeId) {
            throw new Error('Pledge ID is required');
        }

        const { data, error } = await supabase
            .from('part_payments')
            .select('*')
            .eq('pledge_id', pledgeId)
            .order('payment_date', { ascending: false });

        if (error) {
            logError(error, 'getPartPayments');
            throw error;
        }
        return data || [];
    });
};

// ============================================
// PLEDGE RETURNS
// ============================================

export const createPledgeReturn = async (returnData: Partial<PledgeReturn>): Promise<PledgeReturn> => {
    return handleApiError(async () => {
        if (!validateRequired(returnData.pledge_id)) {
            throw new Error('Pledge ID is required');
        }
        if (!validatePositiveNumber(returnData.total_amount)) {
            throw new Error('Total return amount must be a positive number');
        }

        const { data, error } = await supabase
            .from('pledge_returns')
            .insert(returnData)
            .select()
            .single();

        if (error) {
            logError(error, 'createPledgeReturn');
            throw error;
        }

        // Update pledge status to closed
        const { error: updateError } = await supabase
            .from('pledges')
            .update({ status: 'closed' })
            .eq('id', returnData.pledge_id);

        if (updateError) {
            logError(updateError, 'createPledgeReturn - update status');
        }

        return data;
    });
};

// ============================================
// ADDITIONAL PLEDGES
// ============================================

export const createAdditionalPledge = async (additional: Partial<AdditionalPledge>): Promise<AdditionalPledge> => {
    return handleApiError(async () => {
        if (!validateRequired(additional.original_pledge_id)) {
            throw new Error('Original pledge ID is required');
        }
        if (!validatePositiveNumber(additional.additional_weight_grams)) {
            throw new Error('Additional weight must be a positive number');
        }
        if (!validatePositiveNumber(additional.additional_amount)) {
            throw new Error('Additional amount must be a positive number');
        }

        const { data, error } = await supabase
            .from('additional_pledges')
            .insert(additional)
            .select()
            .single();

        if (error) {
            logError(error, 'createAdditionalPledge');
            throw error;
        }

        // Update original pledge totals
        const { data: originalPledge, error: fetchError } = await supabase
            .from('pledges')
            .select('total_weight_grams, appraised_value')
            .eq('id', additional.original_pledge_id)
            .single();

        if (fetchError) {
            logError(fetchError, 'createAdditionalPledge - fetch original');
        } else if (originalPledge) {
            const { error: updateError } = await supabase
                .from('pledges')
                .update({
                    total_weight_grams: (originalPledge.total_weight_grams || 0) + (additional.additional_weight_grams || 0),
                    appraised_value: (originalPledge.appraised_value || 0) + (additional.additional_amount || 0)
                })
                .eq('id', additional.original_pledge_id);

            if (updateError) {
                logError(updateError, 'createAdditionalPledge - update totals');
            }
        }

        return data;
    });
};

export const getAdditionalPledges = async (pledgeId: string): Promise<AdditionalPledge[]> => {
    return handleApiError(async () => {
        if (!pledgeId) {
            throw new Error('Pledge ID is required');
        }

        const { data, error } = await supabase
            .from('additional_pledges')
            .select('*')
            .eq('original_pledge_id', pledgeId)
            .order('additional_date', { ascending: false });

        if (error) {
            logError(error, 'getAdditionalPledges');
            throw error;
        }
        return data || [];
    });
};

// ============================================
// PLEDGE SALES
// ============================================

export const createPledgeSale = async (sale: Partial<PledgeSale>): Promise<PledgeSale> => {
    return handleApiError(async () => {
        if (!validateRequired(sale.pledge_id)) {
            throw new Error('Pledge ID is required');
        }
        if (!validatePositiveNumber(sale.sale_amount)) {
            throw new Error('Sale amount must be a positive number');
        }

        const { data, error } = await supabase
            .from('pledge_sales')
            .insert(sale)
            .select()
            .single();

        if (error) {
            logError(error, 'createPledgeSale');
            throw error;
        }

        // Update pledge status to sold
        const { error: updateError } = await supabase
            .from('pledges')
            .update({ status: 'sold' })
            .eq('id', sale.pledge_id);

        if (updateError) {
            logError(updateError, 'createPledgeSale - update status');
        }

        return data;
    });
};

export const getPledgeSales = async (pledgeId?: string): Promise<PledgeSale[]> => {
    return handleApiError(async () => {
        let query = supabase
            .from('pledge_sales')
            .select('*')
            .order('sale_date', { ascending: false });

        if (pledgeId) {
            query = query.eq('pledge_id', pledgeId);
        }

        const { data, error } = await query;

        if (error) {
            logError(error, 'getPledgeSales');
            throw error;
        }
        return data || [];
    });
};

// ============================================
// CANCELLED TRANSACTIONS
// ============================================

export const cancelTransaction = async (cancelData: Partial<CancelledTransaction>): Promise<CancelledTransaction> => {
    return handleApiError(async () => {
        if (!cancelData.transaction_type || !cancelData.transaction_id || !cancelData.reason) {
            throw new Error('Transaction type, transaction ID, and reason are required');
        }

        const { data, error } = await supabase
            .from('cancelled_transactions')
            .insert(cancelData)
            .select()
            .single();

        if (error) {
            logError(error, 'cancelTransaction');
            throw error;
        }

        return data;
    });
};

export const getCancelledTransactions = async (transactionType?: string): Promise<CancelledTransaction[]> => {
    return handleApiError(async () => {
        let query = supabase
            .from('cancelled_transactions')
            .select('*')
            .order('cancellation_date', { ascending: false });

        if (transactionType) {
            query = query.eq('transaction_type', transactionType);
        }

        const { data, error } = await query;

        if (error) {
            logError(error, 'getCancelledTransactions');
            throw error;
        }
        return data || [];
    });
};

// ============================================
// BANK PLEDGES
// ============================================

export const getBankPledges = async (): Promise<BankPledge[]> => {
    return handleApiError(async () => {
        const { data, error } = await supabase
            .from('bank_pledges')
            .select(`
                *,
                pledge:pledges(*, customer:customers(*)),
                bank:bank_master(*)
            `)
            .order('sent_date', { ascending: false });

        if (error) {
            logError(error, 'getBankPledges');
            throw error;
        }
        return data || [];
    });
};

export const createBankPledge = async (bankPledge: Partial<BankPledge>): Promise<BankPledge> => {
    return handleApiError(async () => {
        if (!bankPledge.pledge_id || !bankPledge.bank_id || !bankPledge.amount_received) {
            throw new Error('Pledge ID, Bank ID, and Received Amount are required');
        }

        // 1. Create bank pledge record
        const { data, error } = await supabase
            .from('bank_pledges')
            .insert(bankPledge)
            .select()
            .single();

        if (error) {
            logError(error, 'createBankPledge');
            throw error;
        }

        // 2. Update the original pledge status to 'bank_pledged'
        const { error: pledgeError } = await supabase
            .from('pledges')
            .update({ status: 'bank_pledged' })
            .eq('id', bankPledge.pledge_id);

        if (pledgeError) {
            logError(pledgeError, 'updatePledgeStatus');
            // consider rollback logic here if critical
        }

        return data;
    });
};

export const createBankPledgeReceive = async (receiveData: Partial<BankPledgeReceive>): Promise<BankPledgeReceive> => {
    return handleApiError(async () => {
        if (!receiveData.bank_pledge_id || !receiveData.amount_paid) {
            throw new Error('Bank Pledge ID and Amount Paid are required');
        }

        // 1. Create receive record
        const { data, error } = await supabase
            .from('bank_pledge_receives')
            .insert(receiveData)
            .select()
            .single();

        if (error) {
            logError(error, 'createBankPledgeReceive');
            throw error;
        }

        // 2. Update bank pledge status to 'received' or 'settled'
        // For simplicity, we'll mark as 'settled' effectively returning it from bank
        const { error: updateError } = await supabase
            .from('bank_pledges')
            .update({ status: 'settled' }) // or 'received' depending on workflow
            .eq('id', receiveData.bank_pledge_id);

        if (updateError) {
            logError(updateError, 'updateBankPledgeStatus');
        }

        // 3. Update original pledge status back to active? Or stays bank_pledged until fully closed?
        // Usually, when received from bank, it becomes available in shop again (active)
        // Let's find the original pledge ID first
        const { data: bankPledge } = await supabase
            .from('bank_pledges')
            .select('pledge_id')
            .eq('id', receiveData.bank_pledge_id)
            .single();

        if (bankPledge) {
            const { error: pledgeStatusError } = await supabase
                .from('pledges')
                .update({ status: 'active' }) // Back in shop
                .eq('id', bankPledge.pledge_id);
            if (pledgeStatusError) logError(pledgeStatusError, 'resetPledgeStatus');
        }

        return data;
    });
};

// ============================================
// CASH TRANSACTIONS
// ============================================

export const getCashTransactions = async (): Promise<CashTransaction[]> => {
    return handleApiError(async () => {
        const { data, error } = await supabase
            .from('cash_transactions')
            .select('*')
            .order('transaction_date', { ascending: false });

        if (error) {
            logError(error, 'getCashTransactions');
            throw error;
        }
        return data || [];
    });
};

export const createCashTransaction = async (transaction: Partial<CashTransaction>): Promise<CashTransaction> => {
    return handleApiError(async () => {
        const { data, error } = await supabase
            .from('cash_transactions')
            .insert(transaction)
            .select()
            .single();

        if (error) {
            logError(error, 'createCashTransaction');
            throw error;
        }
        return data;
    });
};


// ============================================
// DASHBOARD STATS
// ============================================

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const today = new Date().toISOString().split('T')[0];

    // Initialize with defaults
    let totalActivePledges = 0;
    let totalLoanAmount = 0;
    let totalCustomers = 0;
    let todayPledges = 0;
    let todayReturns = 0;
    const cashInHand = 0;
    const gold = 0;
    const silver = 0;

    // Get active pledges count and total amount
    try {
        const { data: activePledges, error } = await supabase
            .from('pledges')
            .select('loan_amount')
            .in('status', ['active', 'partially_paid']);

        if (!error) {
            totalActivePledges = activePledges?.length || 0;
            totalLoanAmount = activePledges?.reduce((sum, p) => sum + (p.loan_amount || 0), 0) || 0;
        }
    } catch (error) { logError(error, 'stats'); }

    // Get total customers
    try {
        const { count, error } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        if (!error) totalCustomers = count || 0;
    } catch (error) { logError(error, 'stats'); }

    // Get today's pledges
    try {
        const { count, error } = await supabase
            .from('pledges')
            .select('*', { count: 'exact', head: true })
            .eq('pledge_date', today);
        if (!error) todayPledges = count || 0;
    } catch (error) { logError(error, 'stats'); }

    // Get today's returns
    try {
        const { count, error } = await supabase
            .from('pledge_returns')
            .select('*', { count: 'exact', head: true })
            .eq('return_date', today);
        if (!error) todayReturns = count || 0;
    } catch (error) { logError(error, 'stats'); }

    return {
        total_active_pledges: totalActivePledges,
        total_loan_amount: totalLoanAmount,
        total_customers: totalCustomers,
        today_pledges: todayPledges,
        today_returns: todayReturns,
        cash_in_hand: cashInHand,
        gold_rate: gold,
        silver_rate: silver
    };
};
