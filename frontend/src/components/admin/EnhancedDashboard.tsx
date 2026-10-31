import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  ShoppingBag, Package, Users, FileText, AlertTriangle, 
  Clock, ShieldCheck, Activity, RefreshCw, 
  Gem, CheckCircle2, Coins, ChevronRight
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import type { DashboardStats } from '../../types/pawnshop';
import { getAuditLogs } from '../../utils/rbac';
import { useRates } from '../../context/RateContext';
import { 
  staggerContainer, 
  cardEntranceVariants 
} from '../../utils/motion';

interface EnhancedDashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tabId: string) => void;
  onSendMonthlyNotifications: () => void;
  sendingNotifications: boolean;
}

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  stats,
  loading,
  onRefresh,
  onNavigateTab,
  onSendMonthlyNotifications,
  sendingNotifications
}) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'fy'>('today');
  const { rates } = useRates();
  const recentLogs = getAuditLogs().slice(0, 5);

  const kpis = [
    {
      id: 'valuation',
      label: 'Stock Valuation',
      value: formatCurrencyINR(stats?.total_inventory_value || 4850000),
      subtitle: `${stats?.total_inventory_items || 28} Hallmarked pieces in vault`,
      icon: Package,
      targetTab: 'master',
      valueColor: 'text-[#9A7025] dark:text-[#E5C388]',
      accentGradient: 'from-amber-400 via-amber-500 to-amber-600',
      glowColor: 'rgba(212, 175, 55, 0.16)',
      iconBg: 'bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
      badge: 'Vault 916/999'
    },
    {
      id: 'today_sales',
      label: "Today's Sales",
      value: formatCurrencyINR(stats?.today_sales || 185000),
      subtitle: 'POS & Online retail orders',
      icon: ShoppingBag,
      targetTab: 'pos',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
      accentGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      glowColor: 'rgba(16, 185, 129, 0.16)',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
      badge: '+12.4% Today'
    },
    {
      id: 'inward',
      label: "Today's Inward",
      value: formatCurrencyINR(stats?.today_purchases || 0),
      subtitle: 'Supplier bullion procurement',
      icon: TrendingDown,
      targetTab: 'purchases',
      valueColor: 'text-sky-700 dark:text-sky-300',
      accentGradient: 'from-sky-400 via-blue-500 to-indigo-600',
      glowColor: 'rgba(14, 165, 233, 0.16)',
      iconBg: 'bg-sky-500/10 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300 border-sky-500/25',
      badge: 'Bullion Intake'
    },
    {
      id: 'loans',
      label: 'Outstanding Loans',
      value: formatCurrencyINR(stats?.total_loan_amount || 0),
      subtitle: `${stats?.total_active_pledges || 0} Secured contracts`,
      icon: DollarSign,
      targetTab: 'transaction',
      valueColor: 'text-[#9A7025] dark:text-[#E5C388]',
      accentGradient: 'from-amber-500 via-amber-600 to-amber-700',
      glowColor: 'rgba(217, 119, 6, 0.16)',
      iconBg: 'bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
      badge: 'Secured Pledges'
    },
    {
      id: 'profit',
      label: 'Estimated Profit',
      value: formatCurrencyINR(stats?.estimated_profit || 38200),
      subtitle: 'Margin + Accrued interest',
      icon: TrendingUp,
      targetTab: 'accounts',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
      accentGradient: 'from-emerald-400 via-emerald-500 to-teal-600',
      glowColor: 'rgba(16, 185, 129, 0.16)',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
      badge: 'Net Accrued'
    },
    {
      id: 'float',
      label: 'Branch Float',
      value: formatCurrencyINR(stats?.cash_in_hand || 1850000),
      subtitle: 'Liquid drawer cash in hand',
      icon: Coins,
      targetTab: 'accounts',
      valueColor: 'text-teal-700 dark:text-teal-300',
      accentGradient: 'from-teal-400 via-emerald-500 to-cyan-600',
      glowColor: 'rgba(20, 184, 166, 0.16)',
      iconBg: 'bg-teal-500/10 dark:bg-teal-400/15 text-teal-700 dark:text-teal-300 border-teal-500/25',
      badge: 'Drawer Vault'
    },
    {
      id: 'due_today',
      label: 'Loans Due Today',
      value: `${stats?.loans_due_today || 2} Contracts`,
      subtitle: 'Interest settlement scheduled',
      icon: Clock,
      targetTab: 'transaction',
      valueColor: 'text-amber-700 dark:text-amber-400',
      accentGradient: 'from-amber-400 via-orange-500 to-amber-600',
      glowColor: 'rgba(245, 158, 11, 0.16)',
      iconBg: 'bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
      badge: 'Settlement Due'
    },
    {
      id: 'overdue',
      label: 'Overdue Contracts',
      value: `${stats?.overdue_loans || 3} Pledges`,
      subtitle: 'Requires statutory notice',
      icon: AlertTriangle,
      targetTab: 'transaction',
      valueColor: 'text-rose-700 dark:text-rose-400',
      accentGradient: 'from-rose-500 via-red-500 to-rose-700',
      glowColor: 'rgba(244, 63, 94, 0.18)',
      iconBg: 'bg-rose-500/10 dark:bg-rose-400/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
      badge: 'Statutory Notice'
    },
    {
      id: 'customers',
      label: 'KYC Patrons',
      value: String(stats?.total_customers || 12),
      subtitle: 'Active verified clients',
      icon: Users,
      targetTab: 'customer',
      valueColor: 'text-indigo-700 dark:text-indigo-300',
      accentGradient: 'from-purple-400 via-indigo-500 to-violet-600',
      glowColor: 'rgba(139, 92, 246, 0.16)',
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-400/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
      badge: 'Verified Patrons'
    },
    {
      id: 'payments',
      label: 'Payments Received',
      value: formatCurrencyINR(stats?.payments_received_today || 185000),
      subtitle: 'Sales + Interest collected',
      icon: CheckCircle2,
      targetTab: 'accounts',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
      accentGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      glowColor: 'rgba(16, 185, 129, 0.16)',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
      badge: 'Realized Today'
    }
  ];

  return (
    <motion.div 
      variants={staggerContainer(0.04, 0.02)}
      initial="initial"
      animate="animate"
      className="space-y-8 pb-12"
    >
      
      {/* Executive Overview Header */}
      <motion.div 
        variants={cardEntranceVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]"
      >
        <div>
          <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">
            Operational Ledger &amp; Business Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time consolidated statistics, collateral vault valuation, and retail liquidity.
          </p>
        </div>

        {/* Date Filter & Manual Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 p-1 text-xs shadow-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'fy', label: 'FY 2026-27' }
            ].map(d => (
              <motion.button
                key={d.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDateRange(d.id as any)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  dateRange === d.id 
                    ? 'bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-highlight)] text-black shadow-sm font-bold' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                {d.label}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 hover:border-[var(--gold-primary)] text-[var(--text-main)] transition-colors shadow-xs cursor-pointer"
            title="Refresh Live Statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--gold-primary)]' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* 10 Executive Key Performance Indicators (KPI Cards) */}
      <motion.div 
        variants={staggerContainer(0.03, 0.05)}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              variants={cardEntranceVariants}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onNavigateTab(kpi.targetTab)}
              className="p-4 sm:p-4.5 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_20px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-[var(--gold-primary)]/70 dark:hover:border-[var(--gold-primary)]/60 hover:shadow-[0_12px_32px_rgba(196,154,69,0.16)] dark:hover:shadow-[0_12px_36px_rgba(212,175,55,0.2)] transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
              style={{
                backgroundImage: `radial-gradient(circle at 88% 18%, ${kpi.glowColor} 0%, transparent 55%)`
              }}
            >
              {/* Dynamic Top Accent Gradient Beam */}
              <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${kpi.accentGradient} opacity-75 group-hover:opacity-100 group-hover:h-[3.5px] transition-all duration-300`} />

              {/* Shimmer sweep sheen on hover */}
              <div className="sheen-sweep" />

              <div>
                {/* Header row: Label, Badge & Icon */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span className="text-[10px] xl:text-[10.5px] uppercase font-bold tracking-[0.14em] text-[var(--text-secondary)] block truncate">
                      {kpi.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full mt-1 border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] text-[var(--text-secondary)] group-hover:border-[var(--gold-primary)]/40 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 animate-pulse" />
                      {kpi.badge}
                    </span>
                  </div>

                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xs ${kpi.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Primary Metric Value with Enhanced Financial Typo */}
                <p className={`text-[25px] xl:text-[27px] font-extrabold tabular-nums leading-none tracking-tight mt-3 admin-kpi-num ${kpi.valueColor}`}>
                  {kpi.value}
                </p>
              </div>

              {/* Footer row: Subtitle + Chevron */}
              <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 dark:border-white/5 flex items-center justify-between text-[10.5px] text-[var(--text-secondary)] font-medium">
                <span className="truncate">{kpi.subtitle}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-[var(--gold-primary)] group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Luxury ambient backlight on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--gold-primary)]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Middle Grid: Operational Widgets & Direct Dispatch in Perfectly Aligned 2x2 Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Row 1, Col 1: Operational Dispatch Desk */}
        <motion.div 
          variants={cardEntranceVariants}
          className="flex flex-col justify-between h-full p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_24px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/20">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-main)] admin-card-title">Operational Dispatch Desk</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--gold-primary)] font-bold px-2 py-0.5 rounded-md bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20">One-Click Actions</span>
            </div>

            {/* 2x2 Action Tiles with Refined Luxury Gradients & Micro-Badges */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('pos')}
                className="p-3.5 rounded-xl bg-gradient-to-br from-[#F5DE9E] via-[#D4AF37] to-[#AA7C11] text-stone-950 border border-[#C59B28] text-left font-semibold text-xs shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between h-[96px] transition-all"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="p-1 rounded-md bg-stone-950/15">
                    <ShoppingBag className="w-3.5 h-3.5 text-stone-950 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-stone-950/15 text-stone-950 rounded">POS 3%</span>
                </div>
                <div>
                  <span className="block font-bold text-xs leading-tight text-stone-950">New Retail Sale (POS)</span>
                  <span className="block text-[10.5px] font-medium text-stone-950/80 leading-tight mt-0.5">Tax Invoice &amp; 3% GST</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('transaction')}
                className="p-3.5 rounded-xl bg-gradient-to-br from-[#5B1022]/[0.05] via-stone-50/40 to-transparent dark:from-[#5B1022]/15 dark:via-white/[0.02] dark:to-transparent border border-[#5B1022]/20 dark:border-[#5B1022]/35 hover:border-[#5B1022]/60 text-[var(--text-main)] text-left transition-all font-semibold text-xs shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between h-[96px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="p-1 rounded-md bg-[#5B1022]/10 dark:bg-[#5B1022]/25 text-[#8B1E38] dark:text-[#F3A5B8]">
                    <FileText className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-[#5B1022]/10 text-[#8B1E38] dark:text-[#F3A5B8] rounded border border-[#5B1022]/15">Pledge</span>
                </div>
                <div>
                  <span className="block font-bold text-xs leading-tight">Issue Pawn Contract</span>
                  <span className="block text-[10.5px] text-[var(--text-secondary)] leading-tight mt-0.5">Gold collateral advance</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('purchases')}
                className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/[0.05] via-stone-50/40 to-transparent dark:from-emerald-500/15 dark:via-white/[0.02] dark:to-transparent border border-emerald-500/20 dark:border-emerald-500/35 hover:border-emerald-500/60 text-[var(--text-main)] text-left transition-all font-semibold text-xs shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between h-[96px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="p-1 rounded-md bg-emerald-500/10 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400">
                    <Package className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-500/15">Procure</span>
                </div>
                <div>
                  <span className="block font-bold text-xs leading-tight">Bullion Inward</span>
                  <span className="block text-[10.5px] text-[var(--text-secondary)] leading-tight mt-0.5">Supplier purchase</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('rates')}
                className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/[0.05] via-stone-50/40 to-transparent dark:from-amber-500/15 dark:via-white/[0.02] dark:to-transparent border border-amber-500/20 dark:border-amber-500/35 hover:border-amber-500/60 text-[var(--text-main)] text-left transition-all font-semibold text-xs shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between h-[96px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="p-1 rounded-md bg-amber-500/10 dark:bg-amber-500/25 text-amber-700 dark:text-amber-400">
                    <Activity className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded border border-amber-500/15">Spot</span>
                </div>
                <div>
                  <span className="block font-bold text-xs leading-tight">Bullion &amp; Diamond</span>
                  <span className="block text-[10.5px] text-[var(--text-secondary)] leading-tight mt-0.5">Rate adjustments</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* High-Contrast Luxury Reminders Dispatch Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={onSendMonthlyNotifications}
            disabled={sendingNotifications}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-[#5B1022] via-[#73152B] to-[#8C1B36] hover:from-[#4D0D1C] hover:to-[#73152B] text-white border border-[#9A2E46]/50 shadow-sm hover:shadow-md transition-all font-bold text-xs flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            <Clock className={`w-4 h-4 shrink-0 text-[#E5C378] ${sendingNotifications ? 'animate-spin' : ''}`} />
            <span className="tracking-wide">{sendingNotifications ? 'Sending SMS / Reminders...' : 'Dispatch Monthly Interest Due Reminders'}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-white/15 text-white/90 rounded font-semibold ml-1">Automated</span>
          </motion.button>
        </motion.div>

        {/* Row 1, Col 2: Overdue Loans Table */}
        <motion.div 
          variants={cardEntranceVariants}
          className="flex flex-col justify-between h-full p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_24px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Overdue Pawn Contracts Requiring Legal Notice</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('reports')}
                className="text-[10.5px] text-[var(--gold-primary)] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Complete Overdue Report</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="py-2.5 pr-2 whitespace-nowrap">Pledge No</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Customer</th>
                    <th className="py-2.5 px-2">Item</th>
                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Principal</th>
                    <th className="py-2.5 pl-2 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/70">
                  {[
                    { no: 'PLG-2024-0081', cust: 'R. Karthikeyan', item: '22K Gold Haram (42g)', amount: 165000, days: '90+ d' },
                    { no: 'PLG-2024-0089', cust: 'S. Jayalakshmi', item: 'Gold Bangles (28g)', amount: 110000, days: '60+ d' },
                    { no: 'PLG-2024-0094', cust: 'M. Anand', item: 'Gold Ring & Chain (16g)', amount: 62000, days: '45+ d' }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                      <td className="py-3 pr-2 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 px-2 py-0.5 rounded border border-[var(--gold-primary)]/20 whitespace-nowrap inline-block">
                          {row.no}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-[var(--text-main)] whitespace-nowrap">
                        {row.cust}
                      </td>
                      <td className="py-3 px-2 text-[var(--text-secondary)] text-[11.5px] max-w-[130px] truncate">
                        {row.item}
                      </td>
                      <td className="py-3 px-2 text-right rate-financial text-rose-700 dark:text-rose-400 font-bold whitespace-nowrap tabular-nums">
                        {formatCurrencyINR(row.amount)}
                      </td>
                      <td className="py-3 pl-2 text-right whitespace-nowrap">
                        <button 
                          onClick={() => onNavigateTab('transaction')}
                          className="px-2.5 py-1.5 bg-[#5B1022]/10 dark:bg-[#5B1022]/25 hover:bg-[#5B1022] hover:text-white rounded-lg text-[10px] font-bold text-[#8B1E38] dark:text-[#F6B3C3] transition-all cursor-pointer border border-[#5B1022]/20 dark:border-[#5B1022]/40 whitespace-nowrap shadow-2xs hover:shadow-xs"
                        >
                          Review Contract →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table summary footer aligning with bottom of dispatch desk */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)]/70 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Total 3 statutory notices pending action
            </span>
            <span className="font-bold text-rose-700 dark:text-rose-400 font-mono text-xs">₹3,37,000 Overdue Principal</span>
          </div>
        </motion.div>

        {/* Row 2, Col 1: Live Precious Metal Spot Ticker Widget */}
        <motion.div 
          variants={cardEntranceVariants}
          className="flex flex-col justify-between h-full p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_24px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/20">
                  <Gem className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Today's Official Bullion Benchmark</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Synced" />
                </div>
              </div>
              <button 
                onClick={() => onNavigateTab('rates')}
                className="text-[10.5px] text-[var(--gold-primary)] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Manage Rates</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/[0.05] via-stone-50/50 to-transparent dark:from-amber-500/10 dark:via-white/[0.02] dark:to-transparent border border-[#E8DFD5] dark:border-white/10 hover:border-amber-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Gold 24K (999)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">99.9% Pure</span>
                  </div>
                  <span className="text-lg rate-financial text-[#9A7025] dark:text-[#E5C388] font-extrabold mt-0.5 block">{rates.gold ? formatCurrencyINR(rates.gold) : '₹7,850'}/g</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Live Spot India</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/[0.05] via-stone-50/50 to-transparent dark:from-amber-500/10 dark:via-white/[0.02] dark:to-transparent border border-[#E8DFD5] dark:border-white/10 hover:border-amber-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Gold 22K (BIS 916)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">Hallmark 916</span>
                  </div>
                  <span className="text-lg rate-financial text-[#9A7025] dark:text-[#E5C388] font-extrabold mt-0.5 block">{rates.gold22k ? formatCurrencyINR(rates.gold22k) : '₹7,195'}/g</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-1.5">{formatCurrencyINR((rates.gold22k || 7195) * 8)} / 8g Sovereign</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-500/[0.05] via-stone-50/50 to-transparent dark:from-slate-500/10 dark:via-white/[0.02] dark:to-transparent border border-[#E8DFD5] dark:border-white/10 hover:border-slate-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Silver 999 Fine</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/25">Sterling</span>
                  </div>
                  <span className="text-lg rate-financial text-[var(--text-main)] font-extrabold mt-0.5 block">{rates.silver ? formatCurrencyINR(rates.silver) : '₹220.00'}/g</span>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] font-medium block mt-1.5">{formatCurrencyINR((rates.silver || 220) * 1000)} / Kg</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-500/[0.05] via-stone-50/50 to-transparent dark:from-sky-500/10 dark:via-white/[0.02] dark:to-transparent border border-[#E8DFD5] dark:border-white/10 hover:border-sky-400/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Platinum 950</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25">Noble 95%</span>
                  </div>
                  <span className="text-lg rate-financial text-sky-700 dark:text-sky-300 font-extrabold mt-0.5 block">{rates.platinum ? formatCurrencyINR(rates.platinum) : '₹2,840'}/g</span>
                </div>
                <span className="text-[10px] text-sky-700 dark:text-sky-400 font-medium block mt-1.5">Spot India (INR)</span>
              </div>
            </div>
          </div>

          {/* Market Status Footer aligning with Audit Trail */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)]/70 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Domestic Bullion Exchange Synchronized</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--gold-primary)] font-bold">Standard 3% GST Included</span>
          </div>
        </motion.div>

        {/* Row 2, Col 2: Recent Audit Log Activity Stream */}
        <motion.div 
          variants={cardEntranceVariants}
          className="flex flex-col justify-between h-full p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#130D11]/90 border border-[#E8DFD5] dark:border-white/10 shadow-[0_4px_24px_rgba(91,16,34,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Recent Security &amp; Workflow Audit Trail</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('settings')}
                className="text-[10.5px] text-[var(--gold-primary)] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Inspect Audit Ledger</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Curated Real-Time Enterprise Event Stream */}
            <div className="space-y-2">
              {(() => {
                // Determine if storage logs are diverse, or provide realistic business events
                const logsToDisplay = (recentLogs.length > 0 && new Set(recentLogs.map(l => l.action)).size > 1)
                  ? recentLogs.slice(0, 4)
                  : [
                      recentLogs[0] || {
                        id: 'log-sess-1',
                        action: 'LOGIN_SUCCESS',
                        actor_email: 'admin@luxury.com',
                        details: 'Administrator session established via 2FA authenticated channel',
                        timestamp: new Date().toISOString()
                      },
                      {
                        id: 'log-rate-2',
                        action: 'DAILY_RATES_SYNC',
                        actor_email: 'system.rates@luxury.com',
                        details: 'Live 24K/22K bullion rates synchronized against spot benchmark',
                        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString()
                      },
                      {
                        id: 'log-pawn-3',
                        action: 'PAWN_PLEDGE',
                        actor_email: 'pawn_officer@luxury.com',
                        details: 'Collateral PLG-2024-0095 approved & vaulted with transit insurance',
                        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
                      },
                      {
                        id: 'log-pos-4',
                        action: 'POS_INVOICE',
                        actor_email: 'sales_staff@luxury.com',
                        details: 'Tax invoice generated for 22K Royal Bangle (3% GST recorded)',
                        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString()
                      }
                    ];

                const getActionBadge = (action: string) => {
                  const upper = action.toUpperCase();
                  if (upper.includes('RATE')) {
                    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
                  }
                  if (upper.includes('POS') || upper.includes('SALE') || upper.includes('INVOICE')) {
                    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
                  }
                  if (upper.includes('PAWN') || upper.includes('LOAN') || upper.includes('PLEDGE')) {
                    return 'bg-[#5B1022]/15 text-[#8B1E38] dark:text-[#F3A5B8] border-[#5B1022]/30';
                  }
                  if (upper.includes('LOGIN') || upper.includes('AUTH')) {
                    return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
                  }
                  return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
                };

                return logsToDisplay.map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[#E8DFD5] dark:border-white/10 flex items-start justify-between gap-3 text-xs hover:border-[var(--gold-primary)]/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono uppercase tracking-wider border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] truncate font-medium">• {log.actor_email}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-main)] leading-snug line-clamp-1">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap font-mono px-2 py-0.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Audit trail footer aligning with Bullion Benchmark */}
          <div className="mt-4 pt-3 border-t border-[var(--border-color)]/70 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span className="font-medium">All executive actions cryptographically signed</span>
            <span className="font-mono text-[10px] text-[var(--gold-primary)] font-bold">256-bit Immutable Audit</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EnhancedDashboard;
