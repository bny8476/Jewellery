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
      color: 'text-amber-400',
      borderColor: 'hover:border-amber-500/50',
      activeBorder: 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]',
      options: { category: 'all', kyc_status: 'all', loan_status: 'all', has_balance: false, is_repeat: false }
    },
    {
      key: 'new_this_month',
      title: 'New This Month',
      value: stats.new_this_month,
      subtitle: 'Joined in current cycle',
      icon: UserPlus,
      color: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/50',
      activeBorder: 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
      options: { category: 'all' }
    },
    {
      key: 'active',
      title: 'Active Patrons',
      value: stats.active_customers,
      subtitle: 'Good standing accounts',
      icon: UserCheck,
      color: 'text-blue-400',
      borderColor: 'hover:border-blue-500/50',
      activeBorder: 'border-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
      options: { category: 'all' }
    },
    {
      key: 'repeat',
      title: 'Repeat Buyers',
      value: stats.repeat_customers,
      subtitle: 'High retention clients',
      icon: Repeat,
      color: 'text-purple-400',
      borderColor: 'hover:border-purple-500/50',
      activeBorder: 'border-purple-400 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
      options: { is_repeat: true }
    },
    {
      key: 'pending_payment',
      title: 'Pending Invoices',
      value: stats.pending_payment_customers,
      subtitle: 'Receivables due',
      icon: Clock,
      color: 'text-amber-300',
      borderColor: 'hover:border-amber-400/50',
      activeBorder: 'border-amber-300 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]',
      options: { has_balance: true }
    },
    {
      key: 'active_pawn',
      title: 'Pawn Borrowers',
      value: stats.active_pawn_customers,
      subtitle: 'Active collateral loans',
      icon: Coins,
      color: 'text-amber-500',
      borderColor: 'hover:border-amber-600/50',
      activeBorder: 'border-amber-500 bg-amber-600/10 shadow-[0_0_15px_rgba(217,119,6,0.2)]',
      options: { loan_status: 'active_loans' }
    },
    {
      key: 'overdue_loan',
      title: 'Overdue Loans',
      value: stats.overdue_loan_customers,
      subtitle: 'Matured or delinquent',
      icon: AlertTriangle,
      color: 'text-rose-400',
      borderColor: 'hover:border-rose-500/50',
      activeBorder: 'border-rose-400 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
      options: { loan_status: 'overdue_loans' }
    },
    {
      key: 'pending_kyc',
      title: 'Awaiting KYC',
      value: stats.pending_kyc_customers,
      subtitle: 'Document verification',
      icon: ShieldAlert,
      color: 'text-orange-400',
      borderColor: 'hover:border-orange-500/50',
      activeBorder: 'border-orange-400 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
      options: { kyc_status: 'pending' }
    },
    {
      key: 'vip_loyalty',
      title: 'VIP & Gold Club',
      value: stats.vip_loyalty_customers,
      subtitle: 'HNI & loyalty tiers',
      icon: Crown,
      color: 'text-yellow-400',
      borderColor: 'hover:border-yellow-500/50',
      activeBorder: 'border-yellow-400 bg-yellow-500/10 shadow-[0_0_15px_rgba(250,204,21,0.2)]',
      options: { category: 'vip' }
    },
    {
      key: 'birthdays',
      title: 'Birthdays (14 Days)',
      value: stats.upcoming_birthdays,
      subtitle: 'Occasion greetings due',
      icon: Cake,
      color: 'text-pink-400',
      borderColor: 'hover:border-pink-500/50',
      activeBorder: 'border-pink-400 bg-pink-500/10 shadow-[0_0_15px_rgba(244,114,182,0.2)]',
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
            className={`text-left p-3.5 rounded-2xl border transition-colors relative overflow-hidden group cursor-pointer ${
              isSelected 
                ? c.activeBorder 
                : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-elevated)] ' + c.borderColor
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] truncate tracking-wide">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-xl bg-[var(--bg-elevated)] ${c.color} border border-[var(--border-color)] transition-transform group-hover:scale-110`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-[28px] font-bold tabular-nums tracking-tight text-[var(--text-main)] admin-kpi-num leading-tight">
                {c.value}
              </span>
              {c.value > 0 && isSelected && (
                <span className="text-[10px] text-amber-400 font-semibold animate-pulse">Filtering active</span>
              )}
            </div>

            <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
              {c.subtitle}
            </p>
          </motion.button>
        );
      })}
    </motion.div>
  );
};
