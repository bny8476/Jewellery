import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, UserCheck, Repeat, Clock, 
  Coins, AlertTriangle, ShieldAlert, Crown, Cake
} from 'lucide-react';
import type { CustomerStats, CustomerFilterOptions } from '../../../types/pawnshop';
import { staggerContainer, cardEntranceVariants } from '../../../utils/motion';

interface CustomerDashboardStatsProps {
  stats: CustomerStats | null;
  activeFilter: string;
  onSelectFilter: (filterKey: string, options: Partial<CustomerFilterOptions>) => void;
  loading?: boolean;
}

export const CustomerDashboardStats: React.FC<CustomerDashboardStatsProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
  loading = false
}) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5">
            <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded mb-2"></div>
            <div className="h-6 w-12 bg-[var(--bg-elevated)] rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: 'all',
      title: 'Total Directory',
      value: stats.total_customers,
      subtitle: 'Registered patrons',
      icon: Users,
      color: 'text-amber-500',
      accentGradient: 'from-amber-400 via-amber-500 to-amber-600',
      glowColor: 'rgba(212,175,55,0.16)',
      options: { category: 'all', kyc_status: 'all', loan_status: 'all', has_balance: false, is_repeat: false }
    },
    {
      key: 'new_this_month',
      title: 'New This Month',
      value: stats.new_this_month,
      subtitle: 'Joined in current cycle',
      icon: UserPlus,
      color: 'text-emerald-500',
      accentGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
      glowColor: 'rgba(16,185,129,0.16)',
      options: { category: 'all' }
    },
    {
      key: 'active',
      title: 'Active Patrons',
      value: stats.active_customers,
      subtitle: 'Good standing accounts',
      icon: UserCheck,
      color: 'text-blue-500',
      accentGradient: 'from-blue-400 via-indigo-500 to-sky-600',
      glowColor: 'rgba(59,130,246,0.16)',
      options: { category: 'all' }
    },
    {
      key: 'repeat',
      title: 'Repeat Buyers',
      value: stats.repeat_customers,
      subtitle: 'High retention clients',
      icon: Repeat,
      color: 'text-purple-500',
      accentGradient: 'from-purple-400 via-fuchsia-500 to-purple-600',
      glowColor: 'rgba(168,85,247,0.16)',
      options: { is_repeat: true }
    },
    {
      key: 'pending_payment',
      title: 'Pending Invoices',
      value: stats.pending_payment_customers,
      subtitle: 'Receivables due',
      icon: Clock,
      color: 'text-amber-500',
      accentGradient: 'from-amber-400 via-amber-500 to-orange-500',
      glowColor: 'rgba(251,191,36,0.16)',
      options: { has_balance: true }
    },
    {
      key: 'active_pawn',
      title: 'Pawn Borrowers',
      value: stats.active_pawn_customers,
      subtitle: 'Active collateral loans',
      icon: Coins,
      color: 'text-amber-600',
      accentGradient: 'from-amber-500 via-amber-600 to-amber-700',
      glowColor: 'rgba(217,119,6,0.16)',
      options: { loan_status: 'active_loans' }
    },
    {
      key: 'overdue_loan',
      title: 'Overdue Loans',
      value: stats.overdue_loan_customers,
      subtitle: 'Matured or delinquent',
      icon: AlertTriangle,
      color: 'text-rose-500',
      accentGradient: 'from-rose-400 via-rose-500 to-red-600',
      glowColor: 'rgba(244,63,94,0.16)',
      options: { loan_status: 'overdue_loans' }
    },
    {
      key: 'pending_kyc',
      title: 'Awaiting KYC',
      value: stats.pending_kyc_customers,
      subtitle: 'Document verification',
      icon: ShieldAlert,
      color: 'text-orange-500',
      accentGradient: 'from-orange-400 via-amber-500 to-orange-600',
      glowColor: 'rgba(249,115,22,0.16)',
      options: { kyc_status: 'pending' }
    },
    {
      key: 'vip_loyalty',
      title: 'VIP & Gold Club',
      value: stats.vip_loyalty_customers,
      subtitle: 'HNI & loyalty tiers',
      icon: Crown,
      color: 'text-yellow-500',
      accentGradient: 'from-yellow-400 via-amber-500 to-yellow-600',
      glowColor: 'rgba(250,204,21,0.18)',
      options: { category: 'vip' }
    },
    {
      key: 'birthdays',
      title: 'Birthdays (14 Days)',
      value: stats.upcoming_birthdays,
      subtitle: 'Occasion greetings due',
      icon: Cake,
      color: 'text-pink-500',
      accentGradient: 'from-pink-400 via-rose-400 to-pink-600',
      glowColor: 'rgba(244,114,182,0.16)',
      options: { category: 'all' }
    }
  ];

  return (
    <motion.div 
      variants={staggerContainer(0.025, 0.02)}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = activeFilter === c.key;

        return (
          <motion.button
            key={c.key}
            variants={cardEntranceVariants}
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectFilter(c.key, c.options as any)}
            className={`text-left p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
              isSelected 
                ? 'border-[var(--gold-primary)] ring-2 ring-[var(--gold-primary)]/30 shadow-[0_4px_20px_rgba(196,154,69,0.2)] bg-white/95 dark:bg-[#1A1217]' 
                : 'bg-white/95 dark:bg-[#130D11]/90 border-[#E8DFD5] dark:border-white/10 hover:border-[var(--gold-primary)]/60 shadow-[0_2px_12px_rgba(91,16,34,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            }`}
            style={{
              backgroundImage: `radial-gradient(circle at 90% 15%, ${c.glowColor} 0%, transparent 60%)`
            }}
          >
            {/* Top Accent Gradient Line */}
            <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${c.accentGradient} opacity-75 group-hover:opacity-100 group-hover:h-[3.5px] transition-all`} />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] truncate block">
                  {c.title}
                </span>
                <div className={`p-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] ${c.color} border border-black/5 dark:border-white/10 transition-transform group-hover:scale-110 shadow-xs`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-[26px] font-extrabold tabular-nums tracking-tight text-[var(--text-main)] admin-kpi-num leading-tight">
                  {c.value}
                </span>
                {c.value > 0 && isSelected && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-[var(--gold-primary)] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Active
                  </span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-[var(--text-muted)] mt-2 pt-1.5 border-t border-[var(--border-color)]/60 dark:border-white/5 truncate font-medium">
              {c.subtitle}
            </p>
          </motion.button>
        );
      })}
    </motion.div>
  );
};
