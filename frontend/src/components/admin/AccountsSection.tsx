import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, TrendingDown, Clock, Search, RefreshCw, 
  Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  Filter, CheckCircle2
} from 'lucide-react';
import CashTransactionForm from './CashTransactionForm';
import { formatCurrencyINR } from '../../utils/formatters';

interface CashTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  category: string;
  description?: string;
  transaction_date: string;
  payment_mode?: string;
  payment_method?: string;
  reference_type?: string;
  reference_id?: string;
  created_at?: string;
}

export const AccountsSection: React.FC = () => {
  const [showForm, setShowForm] = useState<'cash_in' | 'cash_out' | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
  }, [showForm]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if transaction is an inflow
  const isInflow = (type: string) => {
    const t = (type || '').toLowerCase();
    return t === 'cash_in' || t === 'receipt' || t === 'credit' || t === 'inward';
  };

  // Format snake_case category to readable title
  const formatCategory = (cat: string) => {
    if (!cat) return 'General';
    return cat
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Payment mode resolution
  const getPaymentMode = (tx: CashTransaction) => {
    return (tx.payment_mode || tx.payment_method || 'cash').toUpperCase();
  };

  // Calculate Executive Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let countIn = 0;
    let countOut = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (isInflow(tx.transaction_type)) {
        totalIn += amt;
        countIn++;
      } else {
        totalOut += amt;
        countOut++;
      }
    });

    const netFloat = totalIn - totalOut;

    return {
      totalIn,
      totalOut,
      netFloat,
      countIn,
      countOut,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = 
        typeFilter === 'all' 
          ? true 
          : typeFilter === 'in' 
            ? isInflow(tx.transaction_type)
            : !isInflow(tx.transaction_type);

      const mode = getPaymentMode(tx).toLowerCase();
      const matchesMode = 
        modeFilter === 'all' 
          ? true 
          : mode.includes(modeFilter.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesQuery = 
        !query ||
        (tx.category && tx.category.toLowerCase().includes(query)) ||
        (tx.description && tx.description.toLowerCase().includes(query)) ||
        (tx.transaction_date && tx.transaction_date.includes(query)) ||
        (tx.amount && tx.amount.toString().includes(query)) ||
        (tx.reference_id && tx.reference_id.toLowerCase().includes(query));

      return matchesType && matchesMode && matchesQuery;
    });
  }, [transactions, typeFilter, modeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[26px] font-bold text-[var(--text-main)] tracking-tight admin-page-heading">
              Accounts &amp; Cash Management
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Vault Float
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track daily cash-in inflows, cash-out operational expenses, and audit ledger transactions with precision
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchTransactions()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-all shadow-xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--gold-primary)]' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm('cash_in')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ Cash In</span>
          </button>
          <button
            onClick={() => setShowForm('cash_out')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>– Cash Out</span>
          </button>
        </div>
      </div>

      {!showForm ? (
        <>
          {/* Executive Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Net Vault Float */}
            <div 
              className="relative overflow-hidden p-5 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-amber-500/60 transition-all duration-300 group flex flex-col justify-between"
              style={{ backgroundImage: 'radial-gradient(circle at 88% 18%, rgba(212, 175, 55, 0.14) 0%, transparent 60%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-80 group-hover:opacity-100 group-hover:h-[3.5px] transition-all" />
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-[0.14em] text-[var(--text-secondary)] block truncate">
                      Net Vault Cash Float
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full mt-1 border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      Reconciled Vault
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Wallet className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className={`text-[28px] font-extrabold tabular-nums tracking-tight admin-kpi-num mt-2 ${
                  summaryMetrics.netFloat >= 0 ? 'text-[#9A7025] dark:text-[#E5C388]' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatCurrencyINR(summaryMetrics.netFloat)}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 dark:border-white/5 text-[10.5px] text-[var(--text-secondary)] font-medium flex items-center justify-between">
                <span>Inflows minus Outflows</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Audited</span>
              </div>
            </div>

            {/* Card 2: Total Inward Receipts */}
            <div 
              className="relative overflow-hidden p-5 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-emerald-500/60 transition-all duration-300 group flex flex-col justify-between"
              style={{ backgroundImage: 'radial-gradient(circle at 88% 18%, rgba(16, 185, 129, 0.14) 0%, transparent 60%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 opacity-80 group-hover:opacity-100 group-hover:h-[3.5px] transition-all" />
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-[0.14em] text-[var(--text-secondary)] block truncate">
                      Cumulative Cash In
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      +{summaryMetrics.countIn} Inflows
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <div className="text-[28px] font-extrabold tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400 admin-kpi-num mt-2">
                  {formatCurrencyINR(summaryMetrics.totalIn)}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 dark:border-white/5 text-[10.5px] text-[var(--text-secondary)] font-medium flex items-center justify-between">
                <span>Sales, Deposits &amp; Interests</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Receipts</span>
              </div>
            </div>

            {/* Card 3: Total Outward Disbursements */}
            <div 
              className="relative overflow-hidden p-5 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-rose-500/60 transition-all duration-300 group flex flex-col justify-between"
              style={{ backgroundImage: 'radial-gradient(circle at 88% 18%, rgba(244, 63, 94, 0.14) 0%, transparent 60%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-rose-400 via-rose-500 to-red-600 opacity-80 group-hover:opacity-100 group-hover:h-[3.5px] transition-all" />
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-[0.14em] text-[var(--text-secondary)] block truncate">
                      Cumulative Cash Out
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full mt-1 border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      -{summaryMetrics.countOut} Vouchers
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                  </div>
                </div>
                <div className="text-[28px] font-extrabold tabular-nums tracking-tight text-rose-700 dark:text-rose-400 admin-kpi-num mt-2">
                  {formatCurrencyINR(summaryMetrics.totalOut)}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 dark:border-white/5 text-[10.5px] text-[var(--text-secondary)] font-medium flex items-center justify-between">
                <span>Expenses, Advances &amp; Loans</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">Disbursed</span>
              </div>
            </div>

            {/* Card 4: Audit & Ledger Count */}
            <div 
              className="relative overflow-hidden p-5 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-indigo-500/60 transition-all duration-300 group flex flex-col justify-between"
              style={{ backgroundImage: 'radial-gradient(circle at 88% 18%, rgba(99, 102, 241, 0.14) 0%, transparent 60%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 opacity-80 group-hover:opacity-100 group-hover:h-[3.5px] transition-all" />
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-[0.14em] text-[var(--text-secondary)] block truncate">
                      Audit Trail Records
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full mt-1 border border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      100% Immutable
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  </div>
                </div>
                <div className="text-[28px] font-extrabold tabular-nums tracking-tight text-indigo-700 dark:text-indigo-400 admin-kpi-num mt-2">
                  {summaryMetrics.totalCount} <span className="text-xs font-semibold text-[var(--text-secondary)]">entries</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 dark:border-white/5 text-[10.5px] text-[var(--text-secondary)] font-medium flex items-center justify-between">
                <span>Multi-Mode Reconciliation</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Verified</span>
              </div>
            </div>
          </div>

          {/* Interactive Inflow & Outflow Action Desks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cash Inward Desk */}
            <div 
              className="relative overflow-hidden p-6 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-emerald-500/50 transition-all duration-300 group flex flex-col justify-between"
              style={{ backgroundImage: 'radial-gradient(circle at 92% 15%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
              
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs transition-transform duration-300 group-hover:scale-105">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        Cash Inward Desk
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          Inflow
                        </span>
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Record cash received from jewelry sales, customer deposits, and loan interest
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick tags */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15 font-medium">
                    + Retail POS Sales
                  </span>
                  <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15 font-medium">
                    + Customer Deposits
                  </span>
                  <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15 font-medium">
                    + Pledge Interest
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-color)]/60 dark:border-white/5 mt-2 flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  {summaryMetrics.countIn} vouchers logged
                </span>
                <button
                  onClick={() => setShowForm('cash_in')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>+ Record Cash Inward</span>
                </button>
              </div>
            </div>

            {/* Cash Outward Desk */}
            <div 
              className="relative overflow-hidden p-6 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-rose-500/50 transition-all duration-300 group flex flex-col justify-between"
              style={{ backgroundImage: 'radial-gradient(circle at 92% 15%, rgba(244, 63, 94, 0.12) 0%, transparent 60%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-400 via-rose-500 to-red-600" />
              
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs transition-transform duration-300 group-hover:scale-105">
                      <TrendingDown className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        Cash Outward Desk
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          Outflow
                        </span>
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Record operational withdrawals, supplier payouts, loan disbursements &amp; salaries
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick tags */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-rose-500/5 text-rose-700 dark:text-rose-300 border border-rose-500/15 font-medium">
                    – Loan Disbursements
                  </span>
                  <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-rose-500/5 text-rose-700 dark:text-rose-300 border border-rose-500/15 font-medium">
                    – Store Expenses
                  </span>
                  <span className="text-[10.5px] px-2.5 py-1 rounded-lg bg-rose-500/5 text-rose-700 dark:text-rose-300 border border-rose-500/15 font-medium">
                    – Staff Salaries
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-color)]/60 dark:border-white/5 mt-2 flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  {summaryMetrics.countOut} vouchers logged
                </span>
                <button
                  onClick={() => setShowForm('cash_out')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>– Record Cash Outward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions Ledger & Filter Suite */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            {/* Ledger Header Bar with Search & Filters */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                      Recent Transactions Ledger
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {filteredTransactions.length} of {transactions.length} Records
                      </span>
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Double-entry cash records and vault disbursement audit
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[240px] sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by category, memo or amount..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] border border-[var(--border-color)] focus:border-[var(--gold-primary)] focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]/60">
                <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] p-1 rounded-xl">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      typeFilter === 'all'
                        ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    All Types ({transactions.length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('in')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      typeFilter === 'in'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-emerald-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Cash In (+{summaryMetrics.countIn})
                  </button>
                  <button
                    onClick={() => setTypeFilter('out')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      typeFilter === 'out'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-rose-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Cash Out (-{summaryMetrics.countOut})
                  </button>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Mode:
                  </span>
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] text-xs font-medium focus:outline-none focus:border-[var(--gold-primary)]"
                  >
                    <option value="all">All Modes</option>
                    <option value="cash">Cash Only</option>
                    <option value="upi">UPI / QR</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card POS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border-color)]">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[10.5px] font-bold">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Date &amp; Voucher</th>
                    <th className="px-6 py-3.5 text-left">Type</th>
                    <th className="px-6 py-3.5 text-left">Category &amp; Memo</th>
                    <th className="px-6 py-3.5 text-left">Payment Mode</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                    <th className="px-6 py-3.5 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/70 bg-[var(--bg-card)]">
                  {filteredTransactions.map((tx) => {
                    const isTxInflow = isInflow(tx.transaction_type);
                    const mode = getPaymentMode(tx);

                    return (
                      <tr 
                        key={tx.id} 
                        className="hover:bg-[var(--bg-elevated)]/60 transition-colors group"
                      >
                        {/* Date & Voucher */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-semibold text-[var(--text-main)] tabular-nums">
                            {tx.transaction_date}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                            {tx.reference_id ? `#${tx.reference_id}` : `#TX-${tx.id.slice(-6).toUpperCase()}`}
                          </div>
                        </td>

                        {/* Transaction Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border shadow-2xs ${
                            isTxInflow
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isTxInflow ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {isTxInflow ? 'Cash In' : 'Cash Out'}
                          </span>
                        </td>

                        {/* Category & Memo */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-[var(--text-main)]">
                            {formatCategory(tx.category)}
                          </div>
                          {tx.description && (
                            <div className="text-[11px] text-[var(--text-secondary)] truncate max-w-xs mt-0.5" title={tx.description}>
                              {tx.description}
                            </div>
                          )}
                        </td>

                        {/* Payment Mode */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${
                            mode === 'UPI' 
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
                              : mode === 'CASH'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                : mode.includes('BANK')
                                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                                  : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
                          }`}>
                            {mode}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-extrabold tabular-nums admin-kpi-num ${
                          isTxInflow ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                        }`}>
                          {isTxInflow ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </td>

                        {/* Audit Status */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mb-3">
                            <Search className="w-5 h-5 opacity-60" />
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-main)]">
                            No transactions found
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                            {searchQuery || typeFilter !== 'all' || modeFilter !== 'all'
                              ? 'Try adjusting your search query or filters to find what you need.'
                              : 'No cash transactions have been recorded in the ledger yet.'}
                          </p>
                          {(searchQuery || typeFilter !== 'all' || modeFilter !== 'all') && (
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setTypeFilter('all');
                                setModeFilter('all');
                              }}
                              className="mt-3 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors"
                            >
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredTransactions.length > 0 && (
              <div className="px-6 py-3 bg-[var(--bg-elevated)]/60 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Showing {filteredTransactions.length} records</span>
                <span className="font-medium text-[var(--text-main)]">
                  Net Ledger: <span className={`font-bold tabular-nums ${summaryMetrics.netFloat >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrencyINR(summaryMetrics.netFloat)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <CashTransactionForm
          type={showForm}
          onSuccess={() => {
            setShowForm(null);
            fetchTransactions();
          }}
          onCancel={() => setShowForm(null)}
        />
      )}
    </div>
  );
};

export default AccountsSection;

