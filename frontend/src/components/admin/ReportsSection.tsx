import React, { useState, useMemo } from 'react';
import { 
  BarChart3, FileText, Download, Loader2, DollarSign, 
  TrendingUp, Calendar, Clock, CheckCircle2, Search,
  Landmark, ShoppingBag
} from 'lucide-react';
import {
  getDayBookReport,
  getCustomerPledgeReport,
  getBankPledgeReport,
  getPledgeSalesReport,
  getInterestPendingReport,
  getInterestCollectionReport
} from '../../services/reportService';
import { toast } from '../../utils/toast';

export const ReportsSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [subTab, setSubTab] = useState<'new_pledge' | 'pledge_return' | 'in_bank' | 'non_return' | 'pledge_sales'>('new_pledge');
  const [activePreset, setActivePreset] = useState<'today' | 'week' | 'month' | 'last_month' | 'fy' | 'custom'>('month');

  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateRange, setDateRange] = useState({
    start_date: firstDay.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0]
  });

  const reports = [
    { 
      id: 'day_book', 
      name: 'Detail Report (Day Book)', 
      description: 'Daily cash inflows, operational outflows & vault ledger reconciliation', 
      icon: FileText,
      categoryBadge: 'Cash & Vault',
      badgeStyle: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
      accentGradient: 'from-amber-400 via-amber-500 to-amber-600',
      glowColor: 'rgba(212, 175, 55, 0.14)',
      iconBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
      features: ['Daily Ledger', 'Inflows / Outflows', 'Closing Float']
    },
    { 
      id: 'interest_pending', 
      name: 'Interest Pending', 
      description: 'Accrued due interest on active pawn pledges and aged contracts', 
      icon: TrendingUp,
      categoryBadge: 'Receivables Yield',
      badgeStyle: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
      accentGradient: 'from-rose-400 via-rose-500 to-red-600',
      glowColor: 'rgba(244, 63, 94, 0.14)',
      iconBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
      features: ['Months Due', 'Simple Interest', 'Collateral Weight']
    },
    { 
      id: 'interest_collection', 
      name: 'Interest Collection', 
      description: 'Audit history of realized interest collected from part-payments & redemptions', 
      icon: DollarSign,
      categoryBadge: 'Realized Revenue',
      badgeStyle: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
      accentGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      glowColor: 'rgba(16, 185, 129, 0.14)',
      iconBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
      features: ['Part Payments', 'Redemptions', 'Revenue Realized']
    },
    { 
      id: 'bank_pledge', 
      name: 'Bank Pledge Report', 
      description: 'Vault collateral items currently pledged or re-hypothecated with partner banks', 
      icon: Landmark,
      categoryBadge: 'Bank Custody',
      badgeStyle: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
      accentGradient: 'from-sky-400 via-blue-500 to-indigo-600',
      glowColor: 'rgba(14, 165, 233, 0.14)',
      iconBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
      features: ['Re-Hypothecation', 'Bank Net Weight', 'Disbursed Capital']
    },
    { 
      id: 'customer_pledge', 
      name: 'Customer History', 
      description: 'Comprehensive borrower-wise pledge lifecycle, repayments & returns', 
      icon: BarChart3,
      categoryBadge: 'Patron Portfolio',
      badgeStyle: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/25',
      accentGradient: 'from-indigo-400 via-purple-500 to-fuchsia-600',
      glowColor: 'rgba(99, 102, 241, 0.14)',
      iconBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
      features: ['New Pledges', 'Returns', 'Delinquency Filter']
    },
    { 
      id: 'pledge_sales', 
      name: 'Unredeemed Sales', 
      description: 'Defaulted collateral liquidations, auction notices & salvage sales', 
      icon: ShoppingBag,
      categoryBadge: 'Auction & Salvage',
      badgeStyle: 'text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/25',
      accentGradient: 'from-amber-500 via-orange-500 to-yellow-600',
      glowColor: 'rgba(245, 158, 11, 0.14)',
      iconBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25',
      features: ['Matured Defaults', 'Auction Value', 'Recovery Rate']
    },
  ];

  // Quick Date Range Helpers
  const setQuickRange = (preset: 'today' | 'week' | 'month' | 'last_month' | 'fy') => {
    setActivePreset(preset);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      start = now;
      end = now;
    } else if (preset === 'week') {
      start.setDate(now.getDate() - 7);
      end = now;
    } else if (preset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    } else if (preset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'fy') {
      // Indian Financial Year: April 1 to March 31
      const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(currentYear, 3, 1);
      end = now;
    }

    setDateRange({
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    });
  };

  const handleViewReport = async (reportId: string, overrideSubTab?: string) => {
    setLoading(true);
    setActiveReport(reportId);
    if (!overrideSubTab) setReportData([]);

    try {
      let data: any[] = [];
      const currentSubTab = overrideSubTab || subTab;

      switch (reportId) {
        case 'day_book':
          data = await getDayBookReport(dateRange);
          break;
        case 'interest_pending':
          data = await getInterestPendingReport(dateRange);
          break;
        case 'interest_collection':
          data = await getInterestCollectionReport(dateRange);
          break;
        case 'customer_pledge':
          data = await getCustomerPledgeReport(dateRange, currentSubTab);
          break;
        case 'bank_pledge':
          data = await getBankPledgeReport(dateRange);
          break;
        case 'pledge_sales':
          data = await getPledgeSalesReport(dateRange);
          break;
      }
      setReportData(data);
      if (data.length === 0) {
        toast.info('No records found for the selected period');
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleSubTabChange = (newTab: any) => {
    setSubTab(newTab);
    handleViewReport('customer_pledge', newTab);
  };

  const handleExport = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map((row: any) => headers.map(fieldName => {
        const value = row[fieldName];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeReport}_report_${dateRange.start_date}_to_${dateRange.end_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter report data in real-time
  const filteredReportData = useMemo(() => {
    if (!tableSearch.trim()) return reportData;
    const q = tableSearch.toLowerCase();
    return reportData.filter((row: any) => 
      Object.values(row).some((val: any) => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      )
    );
  }, [reportData, tableSearch]);

  // Dynamic duration count for selected date range
  const daysCount = useMemo(() => {
    if (!dateRange.start_date || !dateRange.end_date) return null;
    const start = new Date(dateRange.start_date);
    const end = new Date(dateRange.end_date);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  }, [dateRange.start_date, dateRange.end_date]);

  const activeReportObj = reports.find(r => r.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[26px] font-bold text-[var(--text-main)] tracking-tight admin-page-heading">
              Financial &amp; Operations Reports
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)] animate-pulse" />
              Audited Ledger Engine
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Comprehensive audit reports for customer pledges, day-book ledgers, inventory, and loan portfolios
          </p>
        </div>
      </div>

      {/* Date Range Selector with Aligned Controls & Active Presets */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-[#130D11]/90 rounded-2xl border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-5">
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
        
        {/* Header: Title on Left, Dynamic Active Window Status on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-main)] tracking-wide uppercase">
                Audit Date Range Window
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Select filtering period for ledger transactions &amp; financial records
              </p>
            </div>
          </div>

          {/* Active Window Status Badge */}
          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[var(--text-main)]">
              {daysCount ? `${daysCount} Days Window` : 'Custom Range'}
            </span>
            <span className="text-xs text-[var(--gold-primary)] font-mono font-semibold border-l border-[var(--border-color)]/80 pl-2">
              {dateRange.start_date} → {dateRange.end_date}
            </span>
          </div>
        </div>

        {/* Perfectly Aligned Controls Row: From Date (3 cols), To Date (3 cols), Quick Presets (6 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5 mt-4 pt-4 border-t border-[var(--border-color)]/60 items-end">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, start_date: e.target.value }));
                setActivePreset('custom');
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-semibold focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)]/30 shadow-2xs h-[38px] transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, end_date: e.target.value }));
                setActivePreset('custom');
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-semibold focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)]/30 shadow-2xs h-[38px] transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">
                Quick Presets
              </label>
              {activePreset === 'custom' && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Custom Interval
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-color)]/80 h-[38px]">
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'fy', label: 'Current FY' },
              ].map(preset => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setQuickRange(preset.id as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[var(--gold-primary)] text-black shadow-xs font-extrabold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 6 High-End Report Domain Cards with Strict Baseline Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((report) => {
          const Icon = report.icon;
          const isActive = activeReport === report.id;

          return (
            <div 
              key={report.id} 
              className={`relative overflow-hidden p-5 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border transition-all duration-300 group flex flex-col justify-between shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] ${
                isActive 
                  ? 'border-[var(--gold-primary)] ring-2 ring-[var(--gold-primary)]/30 shadow-[0_8px_32px_rgba(196,154,69,0.2)]' 
                  : 'border-[#E8DFD5] dark:border-white/10 hover:border-[var(--gold-primary)]/60 hover:shadow-[0_8px_24px_rgba(41,35,43,0.06)]'
              }`}
              style={{
                backgroundImage: `radial-gradient(circle at 90% 15%, ${report.glowColor} 0%, transparent 60%)`
              }}
            >
              {/* Top Accent Gradient Line */}
              <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${report.accentGradient} opacity-80 group-hover:opacity-100 group-hover:h-[3.5px] transition-all`} />

              <div>
                {/* Header row: Badge, Icon */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-[9.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${report.badgeStyle}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {report.categoryBadge}
                  </span>

                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xs ${report.iconBg}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Title & Description with consistent min-heights for baseline alignment */}
                <div className="min-h-[26px] flex items-center mb-1">
                  <h3 className="text-[15px] font-bold text-[var(--text-main)] group-hover:text-[var(--gold-primary)] transition-colors leading-tight">
                    {report.name}
                  </h3>
                </div>
                
                <div className="min-h-[36px] flex items-start">
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Feature Tags with consistent min-height */}
                <div className="min-h-[26px] flex items-center flex-wrap gap-1.5 my-3.5">
                  {report.features.map(f => (
                    <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button - Fully elevated & luxury styled */}
              <button
                onClick={() => handleViewReport(report.id)}
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-xs ${
                  isActive 
                    ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[#AA8237] text-black font-extrabold shadow-md ring-2 ring-[var(--gold-primary)]/40' 
                    : 'bg-[var(--bg-elevated)] hover:bg-[var(--gold-primary)] text-[var(--text-main)] hover:text-black border border-[var(--border-color)] hover:border-transparent hover:shadow-md'
                } disabled:opacity-50`}
              >
                {loading && activeReport === report.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-current" />
                ) : isActive ? (
                  <CheckCircle2 className="h-4 w-4 text-black" />
                ) : (
                  <BarChart3 className="h-4 w-4 text-[var(--gold-primary)] group-hover:text-black transition-colors" />
                )}
                <span>
                  {loading && activeReport === report.id 
                    ? 'Generating Audit...' 
                    : isActive 
                      ? 'Viewing Audit Report' 
                      : 'Run Analytics Report'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Sub-tabs Segmented Control for Customer History */}
      {activeReport === 'customer_pledge' && (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-2 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Patron Lifecycle Filter
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">Select contract state to query</span>
          </div>
          <div className="flex space-x-1.5 overflow-x-auto p-1 bg-[var(--bg-elevated)] rounded-xl">
            {[
              { id: 'new_pledge', label: 'New Pledges' },
              { id: 'pledge_return', label: 'Returned Pledges' },
              { id: 'in_bank', label: 'In Bank Custody' },
              { id: 'non_return', label: 'Non Return Defaults' },
              { id: 'pledge_sales', label: 'Liquidated Sales' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSubTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  subTab === tab.id
                    ? 'bg-[var(--gold-primary)] text-black font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Table & Export Suite */}
      {activeReport && reportData.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span>{activeReportObj?.name}</span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    {filteredReportData.length} of {reportData.length} records
                  </span>
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Generated for window {dateRange.start_date} to {dateRange.end_date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* In-table search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter records..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] border border-[var(--border-color)] focus:border-[var(--gold-primary)] focus:outline-none"
                />
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-color)] text-xs">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[10.5px] font-bold border-b border-[var(--border-color)]">
                <tr>
                  {Object.keys(reportData[0]).map((header) => (
                    <th key={header} className="px-6 py-3.5 text-left whitespace-nowrap">
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/70 bg-[var(--bg-card)]">
                {filteredReportData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--bg-elevated)]/60 transition-colors">
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="px-6 py-3.5 whitespace-nowrap text-xs text-[var(--text-main)] font-mono">
                        {typeof val === 'number' && JSON.stringify(val).includes('.')
                          ? val.toFixed(2)
                          : String(val ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-3 bg-[var(--bg-elevated)]/60 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Showing {filteredReportData.length} records</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Audit Verified
            </span>
          </div>
        </div>
      )}

      {/* Empty State when report executed but 0 records */}
      {activeReport && !loading && reportData.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mx-auto mb-3">
            <Clock className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-main)]">
            No audit records found
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            No records matched the selected query window ({dateRange.start_date} to {dateRange.end_date}). Try widening your date range.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsSection;

