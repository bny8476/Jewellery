import { supabase } from '../lib/supabase';
import type {
    DetailReportRow,
    DayBookRow,
    InterestPendingRow,
    InterestCollectionRow,
    CustomerPledgeReportRow,
    PledgeReturnRow,
    PledgeSaleRow
} from '../types/pawnshop';

export type DateRange = {
    start_date: string;
    end_date: string;
};

// 1. Day Book / Detail Report (Cash Flow)
export const getDayBookReport = async (range: DateRange): Promise<DayBookRow[]> => {
    // Fetch transactions in range
    const { data: transactions, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .gte('transaction_date', range.start_date)
        .lte('transaction_date', range.end_date)
        .order('transaction_date', { ascending: true });

    if (error) throw error;

    let balance = 0; // Should be opening balance

    return (transactions || []).map(tx => {
        const credit = tx.transaction_type === 'cash_in' ? tx.amount : 0;
        const debit = tx.transaction_type === 'cash_out' ? tx.amount : 0;
        balance += (credit - debit);

        return {
            date: tx.transaction_date,
            particulars: tx.description || tx.category || tx.reference_type,
            credit: credit,
            debit: debit,
            balance: balance
        };
    });
};

// 2. Interest Pending Report
export const getInterestPendingReport = async (_range: DateRange): Promise<InterestPendingRow[]> => {
    // Fetch active pledges
    const { data: pledges, error } = await supabase
        .from('pledges')
        .select(`
            pledge_number,
            pledge_date,
            loan_amount,
            interest_rate,
            customer:customers(full_name, phone),
            items:pledge_items(net_weight_grams)
        `)
        .eq('status', 'active'); // Only active pledges have pending interest

    if (error) throw error;

    const report = (pledges || []).map((p: any) => {
        const pledgeDate = new Date(p.pledge_date);
        const today = new Date();
        // Calculate months diff
        let months = (today.getFullYear() - pledgeDate.getFullYear()) * 12 + (today.getMonth() - pledgeDate.getMonth());
        // Adjust for days if needed, but simple month diff for now
        if (months < 1) months = 0;

        // Simple Interest Calc: P * N * R / 100 
        const interestAmount = (p.loan_amount * months * p.interest_rate) / 100;
        const totalNetWeight = p.items?.reduce((sum: number, item: any) => sum + item.net_weight_grams, 0) || 0;

        return {
            bill_no: p.pledge_number,
            date: p.pledge_date,
            customer_name: p.customer?.full_name,
            mobile: p.customer?.phone,
            interest_rate: p.interest_rate,
            months_due: months,
            net_weight: totalNetWeight.toFixed(2),
            loan_amount: p.loan_amount,
            interest_amount: interestAmount.toFixed(2),
            total_due: (p.loan_amount + interestAmount).toFixed(2)
        };
    });

    return report;
};

// 3. Interest Collection Report
export const getInterestCollectionReport = async (range: DateRange): Promise<InterestCollectionRow[]> => {
    // Fetch Part Payments with interest
    const { data: payments, error } = await supabase
        .from('part_payments')
        .select(`
            payment_date,
            interest_paid,
            pledge:pledges(pledge_number, customer:customers(full_name))
        `)
        .gt('interest_paid', 0)
        .gte('payment_date', range.start_date)
        .lte('payment_date', range.end_date);

    if (error) throw error;

    // Fetch Full Redemptions (Returns) with interest
    const { data: returns, error: returnError } = await supabase
        .from('pledge_returns')
        .select(`
            return_date,
            interest_amount,
            pledge:pledges(pledge_number, customer:customers(full_name))
        `)
        .gt('interest_amount', 0)
        .gte('return_date', range.start_date)
        .lte('return_date', range.end_date);

    if (returnError) throw returnError;

    // Merge
    const allCollections = [
        ...(payments || []).map((p: any) => ({
            bill_no: p.pledge.pledge_number,
            date: p.payment_date,
            customer_name: p.pledge.customer.full_name,
            interest_collected: p.interest_paid,
            type: 'Part Payment' as const
        })),
        ...(returns || []).map((r: any) => ({
            bill_no: r.pledge.pledge_number,
            date: r.return_date,
            customer_name: r.pledge.customer.full_name,
            interest_collected: r.interest_amount,
            type: 'Final Settlement' as const
        }))
    ];

    return allCollections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getDetailReport = async (range: DateRange): Promise<DetailReportRow[]> => {
    const { data: pledges, error } = await supabase
        .from('pledges')
        .select(`
            id,
            pledge_number,
            pledge_date,
            loan_amount,
            interest_rate,
            status,
            customer:customers (
                full_name,
                phone
            ),
            part_payments (
                principal_paid,
                interest_paid
            )
        `)
        .gte('pledge_date', range.start_date)
        .lte('pledge_date', range.end_date)
        .order('pledge_date', { ascending: false });

    if (error) throw error;

    return (pledges as any[]).map(pledge => {
        const totalPrincipalPaid = pledge.part_payments?.reduce((sum: number, p: any) => sum + (p.principal_paid || 0), 0) || 0;
        const totalInterestPaid = pledge.part_payments?.reduce((sum: number, p: any) => sum + (p.interest_paid || 0), 0) || 0;

        const interestAmount = totalInterestPaid;

        return {
            pledge_number: pledge.pledge_number,
            pledge_date: pledge.pledge_date,
            customer_name: pledge.customer?.full_name || 'Unknown',
            customer_phone: pledge.customer?.phone || '',
            loan_amount: pledge.loan_amount,
            interest_amount: interestAmount,
            total_paid: totalPrincipalPaid + totalInterestPaid,
            outstanding: pledge.loan_amount - totalPrincipalPaid,
            status: pledge.status
        };
    });
};

// 4. Customer Pledge Report (with sub-types)
export const getCustomerPledgeReport = async (range: DateRange, type: string = 'new_pledge'): Promise<CustomerPledgeReportRow[] | PledgeReturnRow[] | PledgeSaleRow[]> => {
    let query = supabase
        .from('pledges')
        .select(`
            pledge_number,
            pledge_date,
            loan_amount,
            status,
            customer:customers(full_name, phone),
            items:pledge_items(net_weight_grams)
        `);

    // Filter based on type
    if (type === 'new_pledge') {
        // Created within range
        query = query.gte('pledge_date', range.start_date).lte('pledge_date', range.end_date);
    } else if (type === 'pledge_return') {
        return getPledgeReturnReport(range);
    } else if (type === 'in_bank') {
        query = query.eq('status', 'bank_pledged').gte('pledge_date', range.start_date).lte('pledge_date', range.end_date);
    } else if (type === 'non_return') {
        // Active or overdue
        query = query.in('status', ['active', 'overdue']).lte('pledge_date', range.end_date);
    } else if (type === 'pledge_sales') {
        // Sales
        return getPledgeSalesReport(range);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((p: any) => ({
        bill_no: p.pledge_number,
        date: p.pledge_date,
        customer_name: p.customer?.full_name,
        mobile: p.customer?.phone,
        net_weight: p.items?.reduce((sum: number, item: any) => sum + item.net_weight_grams, 0).toFixed(2),
        amount: p.loan_amount,
        status: p.status,
        type: type === 'new_pledge' ? 'New' : (type === 'in_bank' ? 'In Bank' : 'Active')
    }));
};

const getPledgeReturnReport = async (range: DateRange) => {
    const { data, error } = await supabase
        .from('pledge_returns')
        .select(`
            return_date,
            final_amount_paid,
            pledge:pledges(pledge_number, loan_amount, customer:customers(full_name, phone), items:pledge_items(net_weight_grams))
        `)
        .gte('return_date', range.start_date)
        .lte('return_date', range.end_date);

    if (error) throw error;

    return (data || []).map((r: any) => ({
        bill_no: r.pledge?.pledge_number,
        return_date: r.return_date,
        customer_name: r.pledge?.customer?.full_name,
        mobile: r.pledge?.customer?.phone,
        net_weight: r.pledge?.items?.reduce((sum: number, item: any) => sum + item.net_weight_grams, 0).toFixed(2),
        loan_amount: r.pledge?.loan_amount,
        received_amount: r.final_amount_paid,
        status: 'Returned'
    }));
};

// Placeholder for Bank Pledge Report
export const getBankPledgeReport = async (range: DateRange): Promise<any[]> => {
    const { data, error } = await supabase
        .from('bank_pledges')
        .select(`
            *,
            pledge:pledges (
                pledge_number,
                loan_amount
            ),
            bank:bank_master (
                bank_name
            )
        `)
        .gte('sent_date', range.start_date)
        .lte('sent_date', range.end_date);

    if (error) throw error;
    return data || [];
};

// Placeholder for Sales Report
export const getPledgeSalesReport = async (range: DateRange): Promise<any[]> => {
    const { data, error } = await supabase
        .from('pledge_sales')
        .select(`
            *,
            pledge:pledges (
                pledge_number,
                loan_amount
            )
        `)
        .gte('sale_date', range.start_date)
        .lte('sale_date', range.end_date);

    if (error) throw error;
    return data || [];
};
