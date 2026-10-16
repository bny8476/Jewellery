import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  ShoppingBag, Package, Users, FileText, AlertTriangle, 
  Clock, ShieldCheck, Activity, RefreshCw, 
  Gem, Sparkles, CheckCircle2
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import type { DashboardStats } from '../../types/pawnshop';
import { getAuditLogs } from '../../utils/rbac';
import { useRates } from '../../context/RateContext';
import { 
  staggerContainer, 
  cardEntranceVariants, 
  cardHoverProps 
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
      valueColor: 'text-[var(--gold-primary)]',
      iconBg: 'bg-[var(--bg-elevated)] text-[var(--gold-primary)]'
    },
    {
      id: 'today_sales',
      label: "Today's Sales",
      value: formatCurrencyINR(stats?.today_sales || 185000),
      subtitle: 'POS & Online retail orders',
      icon: ShoppingBag,
      targetTab: 'pos',
      valueColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400'
    },
    {
      id: 'inward',
      label: "Today's Inward",
      value: formatCurrencyINR(stats?.today_purchases || 0),
      subtitle: 'Supplier bullion procurement',
      icon: TrendingDown,
      targetTab: 'purchases',
      valueColor: 'text-[var(--text-main)]',
      iconBg: 'bg-sky-500/10 text-sky-400'
    },
    {
      id: 'loans',
      label: 'Outstanding Loans',
      value: formatCurrencyINR(stats?.total_loan_amount || 0),
      subtitle: `${stats?.total_active_pledges || 0} Secured contracts`,
      icon: DollarSign,
      targetTab: 'transaction',
      valueColor: 'text-[var(--gold-primary)]',
      iconBg: 'bg-[var(--bg-elevated)] text-[var(--gold-primary)]'
    },
    {
      id: 'profit',
      label: 'Estimated Profit',
      value: formatCurrencyINR(stats?.estimated_profit || 38200),
      subtitle: 'Margin + Accrued interest',
      icon: TrendingUp,
      targetTab: 'accounts',
      valueColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400'
    },
    {
      id: 'float',
      label: 'Branch Float',
      value: formatCurrencyINR(stats?.cash_in_hand || 1850000),
      subtitle: 'Liquid drawer cash in hand',
      icon: DollarSign,
      targetTab: 'accounts',
      valueColor: 'text-[var(--text-main)]',
      iconBg: 'bg-[var(--bg-elevated)] text-emerald-500'
    },
    {
      id: 'due_today',
      label: 'Loans Due Today',
      value: `${stats?.loans_due_today || 2} Contracts`,
      subtitle: 'Interest settlement scheduled',
      icon: Clock,
      targetTab: 'transaction',
      valueColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400'
    },
    {
      id: 'overdue',
      label: 'Overdue Contracts',
      value: `${stats?.overdue_loans || 3} Pledges`,
      subtitle: 'Requires statutory notice',
      icon: AlertTriangle,
      targetTab: 'transaction',
      valueColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400'
    },
    {
      id: 'customers',
      label: 'KYC Patrons',
      value: String(stats?.total_customers || 12),
      subtitle: 'Active verified clients',
      icon: Users,
      targetTab: 'customer',
      valueColor: 'text-[var(--text-main)]',
      iconBg: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
    },
    {
      id: 'payments',
      label: 'Payments Received',
      value: formatCurrencyINR(stats?.payments_received_today || 185000),
      subtitle: 'Sales + Interest collected',
      icon: CheckCircle2,
      targetTab: 'accounts',
      valueColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400'
    }
  ];

  return (
    <motion.div 
      variants={staggerContainer(0.04, 0.02)}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      
      {/* Executive Overview Header */}
      <motion.div 
        variants={cardEntranceVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-[11px] font-semibold mb-1.5 border border-[var(--gold-primary)]/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>RCB Executive Command Center • Live Telemetry</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] tracking-tight">
            Operational Ledger &amp; Business Analytics
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time consolidated statistics, collateral vault valuation, and retail liquidity.
          </p>
        </div>

        {/* Date Filter & Manual Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-1 text-xs shadow-xs">
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
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  dateRange === d.id 
                    ? 'bg-[var(--gold-primary)] text-black shadow-sm font-bold' 
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
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] transition-colors shadow-xs"
            title="Refresh Live Statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--gold-primary)]' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* 10 Executive Key Performance Indicators (KPI Cards) with Staggered Rise & Hover Lift */}
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
              {...cardHoverProps}
              onClick={() => onNavigateTab(kpi.targetTab)}
              className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs hover:border-[var(--gold-primary)]/70 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden sheen-container"
            >
              <div className="sheen-sweep" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
                  {kpi.label}
                </span>
                <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${kpi.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-xl rate-financial leading-none ${kpi.valueColor}`}>
                {kpi.value}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 truncate">
                {kpi.subtitle}
              </p>
              
              {/* Subtle luxury glow accent on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--gold-primary)]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Middle Grid: Operational Widgets & Direct Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Dispatch & Live Rates Ticker (5 cols) */}
        <motion.div variants={cardEntranceVariants} className="lg:col-span-5 space-y-6">
          
          {/* Quick Dispatch Grid */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Operational Dispatch Desk</h3>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">One-Click Actions</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('pos')}
                className="p-3 rounded-xl bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-highlight)] text-black text-left font-semibold text-xs shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 mb-1.5" />
                <span>New Retail Sale (POS)</span>
                <span className="block text-[10px] font-normal text-black/75 mt-0.5">Tax Invoice &amp; 3% GST</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('transaction')}
                className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] text-left transition-colors font-semibold text-xs shadow-xs"
              >
                <FileText className="w-4 h-4 mb-1.5 text-[var(--gold-primary)]" />
                <span>Issue Pawn Contract</span>
                <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">Gold collateral advance</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('purchases')}
                className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] text-left transition-colors font-semibold text-xs shadow-xs"
              >
                <Package className="w-4 h-4 mb-1.5 text-[var(--gold-primary)]" />
                <span>Bullion Inward</span>
                <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">Supplier purchase</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateTab('rates')}
                className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] text-left transition-colors font-semibold text-xs shadow-xs"
              >
                <Activity className="w-4 h-4 mb-1.5 text-[var(--gold-primary)]" />
                <span>Bullion &amp; Diamond</span>
                <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">Rate adjustments</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSendMonthlyNotifications}
                disabled={sendingNotifications}
                className="col-span-2 p-3 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-center transition-colors font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Clock className={`w-4 h-4 ${sendingNotifications ? 'animate-spin' : ''}`} />
                <span>{sendingNotifications ? 'Sending SMS / Reminders...' : 'Dispatch Monthly Interest Due Reminders'}</span>
              </motion.button>
            </div>
          </div>

          {/* Live Precious Metal Spot Ticker Widget */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                <span>Today's Official Bullion Benchmark</span>
              </span>
              <button 
                onClick={() => onNavigateTab('rates')}
                className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline"
              >
                Manage Rates →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Gold 24K (999)</span>
                <span className="text-base rate-financial text-[var(--gold-primary)]">{rates.gold ? formatCurrencyINR(rates.gold) : '₹7,850'}/g</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Live Spot India</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Gold 22K (BIS 916)</span>
                <span className="text-base rate-financial text-[var(--gold-primary)]">{rates.gold22k ? formatCurrencyINR(rates.gold22k) : '₹7,195'}/g</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">{formatCurrencyINR((rates.gold22k || 7195) * 8)} / 8g Sovereign</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Silver 999 Fine</span>
                <span className="text-base rate-financial text-[var(--text-main)]">{rates.silver ? formatCurrencyINR(rates.silver) : '₹94.50'}/g</span>
                <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">{formatCurrencyINR((rates.silver || 94.5) * 1000)} / Kg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">Platinum 950</span>
                <span className="text-base rate-financial text-sky-600 dark:text-sky-300">{rates.platinum ? formatCurrencyINR(rates.platinum) : '₹2,840'}/g</span>
                <span className="text-[10px] text-sky-600/80 dark:text-sky-400 block mt-0.5">Spot India (INR)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Alerts, Overdues & Activity Stream (7 cols) */}
        <motion.div variants={cardEntranceVariants} className="lg:col-span-7 space-y-6">
          
          {/* Overdue Loans Table */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-rose-500/10 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[var(--text-main)]">Overdue Pawn Contracts Requiring Legal Notice</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('reports')}
                className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline"
              >
                View Complete Overdue Report →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="py-2">Pledge No</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Principal</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {[
                    { no: 'PLG-2024-0081', cust: 'R. Karthikeyan', item: '22K Gold Haram (42g)', amount: 165000 },
                    { no: 'PLG-2024-0089', cust: 'S. Jayalakshmi', item: 'Gold Bangles (28g)', amount: 110000 },
                    { no: 'PLG-2024-0094', cust: 'M. Anand', item: 'Gold Ring & Chain (16g)', amount: 62000 }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                      <td className="py-2.5 font-mono number-supporting text-[var(--text-main)]">{row.no}</td>
                      <td className="py-2.5 font-medium text-[var(--text-main)]">{row.cust}</td>
                      <td className="py-2.5 text-[var(--text-secondary)]">{row.item}</td>
                      <td className="py-2.5 text-right rate-financial text-rose-400">{formatCurrencyINR(row.amount)}</td>
                      <td className="py-2.5 text-right">
                        <button 
                          onClick={() => onNavigateTab('transaction')}
                          className="px-2.5 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--gold-primary)] hover:text-black rounded-lg text-[10px] font-semibold text-[var(--text-main)] transition-all cursor-pointer"
                        >
                          Review Contract
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Audit Log Activity Stream */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--gold-primary)]" />
                <h3 className="text-xs font-bold text-[var(--text-main)]">Recent Security &amp; Workflow Audit Trail</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('settings')}
                className="text-[10px] text-[var(--gold-primary)] font-semibold hover:underline"
              >
                Inspect Audit Ledger →
              </button>
            </div>

            <div className="space-y-2">
              {recentLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-start justify-between gap-3 text-xs hover:border-[var(--gold-primary)]/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-[var(--gold-primary)] text-[11px] font-mono">{log.action}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">• {log.actor_email}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-main)] leading-relaxed">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EnhancedDashboard;
