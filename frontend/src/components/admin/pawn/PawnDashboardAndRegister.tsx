import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Search,
  Plus,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Receipt,
  Bell,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Download,
  Lock,
  ChevronDown
} from 'lucide-react';
import { formatCurrencyINR, formatDate } from '../../../utils/formatters';
import {
  getPawnDashboardStats,
  getPledges,
  sendDueReminder,
  runAutomatedPawnAlerts,
  downloadPawnReport,
  type PawnDashboardMetrics
} from '../../../services/pledgeService';
import { PledgeContractDetailModal } from './PledgeContractDetailModal';
import { PawnRepaymentModal } from './PawnRepaymentModal';
import { PawnRedemptionModal } from './PawnRedemptionModal';
import { PawnRenewalModal } from './PawnRenewalModal';
import { SmartValuationModal } from './SmartValuationModal';
import { VaultTransferAuditModal } from './VaultTransferAuditModal';
import { toast } from '../../../utils/toast';

interface PawnDashboardAndRegisterProps {
  onNewPawnLoan?: () => void;
  onSelectPledge?: (pledge: any) => void;
}

export const PawnDashboardAndRegister: React.FC<PawnDashboardAndRegisterProps> = ({
  onNewPawnLoan,
  onSelectPledge
}) => {
  const [stats, setStats] = useState<PawnDashboardMetrics | null>(null);
  const [pledges, setPledges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningAlerts, setRunningAlerts] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'due_date'>('date_desc');

  // Active Modals
  const [detailPledge, setDetailPledge] = useState<any | null>(null);
  const [repayPledge, setRepayPledge] = useState<any | null>(null);
  const [redeemPledge, setRedeemPledge] = useState<any | null>(null);
  const [renewPledge, setRenewPledge] = useState<any | null>(null);
  const [vaultPledge, setVaultPledge] = useState<any | null>(null);
  const [showValuationModal, setShowValuationModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, pledgesData] = await Promise.all([
        getPawnDashboardStats(),
        getPledges(statusFilter, searchTerm)
      ]);
      setStats(statsData);
      setPledges(pledgesData);
    } catch (err: any) {
      console.error('Failed to load pawn data:', err);
      toast.error('Failed to load pawn registry data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered & Sorted Pledges
  const filteredPledges = useMemo(() => {
    let result = [...pledges];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(p => {
        const pNo = (p.pledge_number || p.pledge_no || '').toLowerCase();
        const cName = (p.customer?.full_name || p.customer_name || '').toLowerCase();
        const cPhone = (p.customer?.phone || '').toLowerCase();
        const desc = (p.item_description || '').toLowerCase();
        return pNo.includes(term) || cName.includes(term) || cPhone.includes(term) || desc.includes(term);
      });
    }

    if (branchFilter !== 'all') {
      result = result.filter(p => (p.branch_id || p.company_id || '').toLowerCase().includes(branchFilter.toLowerCase()));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'amount_desc') return (Number(b.loan_amount) || 0) - (Number(a.loan_amount) || 0);
      if (sortBy === 'due_date') return new Date(a.due_date || a.pledge_date).getTime() - new Date(b.due_date || b.pledge_date).getTime();
      if (sortBy === 'date_asc') return new Date(a.pledge_date).getTime() - new Date(b.pledge_date).getTime();
      return new Date(b.pledge_date).getTime() - new Date(a.pledge_date).getTime();
    });

    return result;
  }, [pledges, searchTerm, branchFilter, sortBy]);

  const handleQuickReminder = async (pledge: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await sendDueReminder(pledge.id, pledge.days_overdue > 0 ? 'overdue' : 'due_soon');
      toast.success(`Reminder sent to ${pledge.customer?.full_name || 'Customer'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch reminder');
    }
  };

  const handleRunAlerts = async () => {
    try {
      setRunningAlerts(true);
      const res = await runAutomatedPawnAlerts();
      toast.success(res.message || 'Automated maturity and overdue alert scan completed.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Alert scan failed');
    } finally {
      setRunningAlerts(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      setExportMenuOpen(false);
      await downloadPawnReport(type, 'csv');
      toast.success(`Exported ${type.replace('_', ' ')} report to CSV`);
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Pawn Loans &amp; Collateral Register
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              RBI 75% LTV Compliant
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5">
            Realtime database-backed pawn contracts, jewellery valuations, interim interest collection, and vault custody tracking.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Smart Valuation Modal Trigger */}
          <button
            onClick={() => setShowValuationModal(true)}
            type="button"
            className="p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-900 text-stone-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Appraise Gold</span>
          </button>

          {/* Automated Alert Scanner */}
          <button
            onClick={handleRunAlerts}
            disabled={runningAlerts}
            type="button"
            className="p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-900 text-stone-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Scan all active loans for upcoming dues and overdue notices"
          >
            <Bell className={`w-3.5 h-3.5 text-amber-500 ${runningAlerts ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{runningAlerts ? 'Scanning...' : 'Scan Alerts'}</span>
          </button>

          {/* Export Reports Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              type="button"
              className="p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-900 text-stone-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Reports</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-[#121212] border border-stone-200 dark:border-neutral-800 rounded-xl shadow-xl z-30 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleExport('portfolio_summary')}
                  className="w-full text-left px-3 py-2 hover:bg-stone-50 dark:hover:bg-neutral-900 text-stone-700 dark:text-neutral-200 cursor-pointer flex items-center justify-between"
                >
                  <span>Portfolio Summary</span>
                  <span className="text-[10px] text-stone-400 uppercase">CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('accounting_ledger')}
                  className="w-full text-left px-3 py-2 hover:bg-stone-50 dark:hover:bg-neutral-900 text-stone-700 dark:text-neutral-200 cursor-pointer flex items-center justify-between"
                >
                  <span>Accounting Journal Ledger</span>
                  <span className="text-[10px] text-stone-400 uppercase">CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('vault_custody')}
                  className="w-full text-left px-3 py-2 hover:bg-stone-50 dark:hover:bg-neutral-900 text-stone-700 dark:text-neutral-200 cursor-pointer flex items-center justify-between"
                >
                  <span>Vault Custody History</span>
                  <span className="text-[10px] text-stone-400 uppercase">CSV</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            type="button"
            className="p-2.5 rounded-xl border border-stone-200 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-900 text-stone-600 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onNewPawnLoan}
            type="button"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Pawn Loan</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Loans</span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1">
            {stats?.active_pawn_loans ?? '—'}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            Gross Wt: <strong className="text-stone-700 dark:text-stone-300">{stats?.total_pledged_gold_grams ?? 0}g</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Principal Outstanding</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stats ? formatCurrencyINR(stats.total_principal_outstanding) : '—'}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            Collateral Val: {stats ? formatCurrencyINR(stats.total_collateral_valuation) : '—'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Accrued Interest</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-500 mt-1">
            {stats ? formatCurrencyINR(stats.total_accrued_interest) : '—'}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            Collected: {stats ? formatCurrencyINR(stats.total_interest_collected) : '—'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Disbursed This Month</span>
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1">
            {stats ? formatCurrencyINR(stats.loans_disbursed_month_amount) : '—'}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            Today: {stats?.loans_disbursed_today_count ?? 0} loans ({formatCurrencyINR(stats?.loans_disbursed_today_amount || 0)})
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Overdue Contracts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {stats?.overdue_contracts_count ?? 0}
          </p>
          <p className="text-[10px] text-rose-500/80 mt-0.5">
            Exposure: {stats ? formatCurrencyINR(stats.overdue_contracts_amount) : '—'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-neutral-800 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Settled &amp; Released</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1">
            {stats?.redeemed_closed_contracts ?? '—'}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">Closed in full settlement</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-neutral-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by pledge #, customer, phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-black text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-stone-50 dark:bg-black/60 rounded-xl border border-stone-200 dark:border-neutral-800 text-xs">
          {[
            { id: 'all', label: 'All Contracts' },
            { id: 'active', label: 'Active' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'closed', label: 'Closed / Redeemed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-xs ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-black shadow-xs font-bold'
                  : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-black text-xs text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Vault Locations</option>
            <option value="vault_a">Vault A (T. Nagar Flagship)</option>
            <option value="vault_b">Vault B (Anna Nagar Branch)</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-black text-xs text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="date_desc">Latest Pledges</option>
            <option value="amount_desc">Highest Principal</option>
            <option value="due_date">Maturity Date (Soonest)</option>
            <option value="date_asc">Oldest Pledges</option>
          </select>
        </div>
      </div>

      {/* Main Contracts Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-[#0D0D0D] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-100 dark:border-neutral-800 bg-stone-50/70 dark:bg-black/40 text-[10px] uppercase font-bold text-stone-400 dark:text-neutral-500 tracking-wider">
                <th className="py-3.5 px-4">Pledge Contract</th>
                <th className="py-3.5 px-4">Patron &amp; KYC</th>
                <th className="py-3.5 px-4">Collateral Details</th>
                <th className="py-3.5 px-4">Principal / Balance</th>
                <th className="py-3.5 px-4">Rate &amp; Terms</th>
                <th className="py-3.5 px-4">Maturity / Status</th>
                <th className="py-3.5 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading pawn loans registry...
                  </td>
                </tr>
              ) : filteredPledges.length > 0 ? (
                filteredPledges.map(pledge => {
                  const customer = pledge.customer || pledge.customers || {};
                  const isClosed = pledge.status === 'closed';
                  const totalPaid = (pledge.part_payments || []).reduce((s: number, p: any) => s + (Number(p.principal_paid) || 0), 0);
                  const balance = Math.max(0, Number(pledge.loan_amount) - totalPaid);

                  return (
                    <tr
                      key={pledge.id}
                      onClick={() => {
                        setDetailPledge(pledge);
                        onSelectPledge?.(pledge);
                      }}
                      className="hover:bg-stone-50/80 dark:hover:bg-neutral-900/40 transition-colors cursor-pointer group"
                    >
                      {/* Contract # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-500 font-bold">#</span>
                          <span>{pledge.pledge_number || pledge.pledge_no || pledge.id.slice(0, 8)}</span>
                        </div>
                        <span className="text-[10px] font-normal text-stone-400 block mt-0.5">
                          {formatDate(pledge.pledge_date || pledge.created_at)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-stone-900 dark:text-stone-100">
                          {customer.full_name || pledge.customer_name || 'Counter Patron'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-stone-400">{customer.phone || 'No phone'}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              customer.kyc_status === 'verified'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {customer.kyc_status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Collateral */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[180px]">
                          {pledge.item_description || `${pledge.total_items || 1} Jewellery Articles`}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Wt: <strong className="text-stone-700 dark:text-stone-300">{pledge.total_weight_grams} g</strong> •{' '}
                          {pledge.vault_locker_no || 'Vault A'}
                        </p>
                      </td>

                      {/* Principal / Balance */}
                      <td className="py-3.5 px-4 font-mono">
                        <p className="font-bold text-stone-900 dark:text-stone-100">
                          {formatCurrencyINR(pledge.loan_amount)}
                        </p>
                        <p className="text-[10px] text-amber-500 font-semibold mt-0.5">
                          Bal: {formatCurrencyINR(balance)}
                        </p>
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-semibold text-stone-800 dark:text-stone-200">
                          {pledge.interest_rate}% <span className="text-[10px] text-stone-400">/{pledge.interest_type || 'mo'}</span>
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Scheme: {pledge.scheme_name || 'Standard'}
                        </p>
                      </td>

                      {/* Maturity / Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isClosed
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isClosed ? 'Redeemed' : pledge.status}
                          </span>
                          {pledge.collateral_released && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[9px] font-bold">
                              Released
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5 font-mono">
                          Due: {formatDate(pledge.due_date || pledge.pledge_date)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {!isClosed ? (
                            <>
                              <button
                                onClick={() => setRepayPledge(pledge)}
                                type="button"
                                title="Collect Payment"
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-amber-500 hover:border-amber-500 hover:text-black text-stone-600 dark:text-neutral-300 transition-colors cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRedeemPledge(pledge)}
                                type="button"
                                title="Redeem & Settle"
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white text-stone-600 dark:text-neutral-300 transition-colors cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRenewPledge(pledge)}
                                type="button"
                                title="Renew Contract"
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-stone-600 dark:text-neutral-300 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setVaultPledge(pledge)}
                                type="button"
                                title="Vault Custody & Locker Transfer"
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-amber-500 hover:border-amber-500 hover:text-black text-stone-600 dark:text-neutral-300 transition-colors cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={e => handleQuickReminder(pledge, e)}
                                type="button"
                                title="Send Due Reminder"
                                className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-500 transition-colors cursor-pointer"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-semibold px-2 py-1 bg-stone-100 dark:bg-neutral-900 rounded-lg">
                              Contract Closed
                            </span>
                          )}
                          <button
                            onClick={() => setDetailPledge(pledge)}
                            type="button"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-stone-400">
                    <Scale className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold text-stone-700 dark:text-stone-300">No Pawn Loans Found</p>
                    <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                      No active or past pledge contracts match the selected search and filter criteria.
                    </p>
                    <button
                      onClick={onNewPawnLoan}
                      type="button"
                      className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Issue First Pawn Loan
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail Modal */}
      {detailPledge && (
        <PledgeContractDetailModal
          pledge={detailPledge}
          isOpen={Boolean(detailPledge)}
          onClose={() => setDetailPledge(null)}
          onOpenRepay={p => setRepayPledge(p)}
          onOpenRedeem={p => setRedeemPledge(p)}
          onOpenRenew={p => setRenewPledge(p)}
          onRefresh={loadData}
        />
      )}

      {/* Operation Modals */}
      {repayPledge && (
        <PawnRepaymentModal
          pledge={repayPledge}
          isOpen={Boolean(repayPledge)}
          onClose={() => setRepayPledge(null)}
          onSuccess={loadData}
        />
      )}

      {redeemPledge && (
        <PawnRedemptionModal
          pledge={redeemPledge}
          isOpen={Boolean(redeemPledge)}
          onClose={() => setRedeemPledge(null)}
          onSuccess={loadData}
        />
      )}

      {renewPledge && (
        <PawnRenewalModal
          pledge={renewPledge}
          isOpen={Boolean(renewPledge)}
          onClose={() => setRenewPledge(null)}
          onSuccess={loadData}
        />
      )}

      {/* Smart Valuation Modal */}
      <SmartValuationModal
        isOpen={showValuationModal}
        onClose={() => setShowValuationModal(false)}
        onApplyToNewLoan={() => {
          setShowValuationModal(false);
          if (onNewPawnLoan) onNewPawnLoan();
        }}
      />

      {/* Vault Transfer & Audit Modal */}
      {vaultPledge && (
        <VaultTransferAuditModal
          pledge={vaultPledge}
          isOpen={Boolean(vaultPledge)}
          onClose={() => setVaultPledge(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
