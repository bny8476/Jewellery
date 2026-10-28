import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, ArrowRight
} from 'lucide-react';
import { drawerRightVariants, modalBackdropVariants } from '../../utils/motion';

export interface AdminNotification {
  id: string;
  category: 'rates' | 'loans' | 'inventory' | 'orders' | 'security';
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
  action_tab?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: 'notif-1',
      category: 'rates',
      title: 'Bullion Spot Rates Refreshed',
      message: '9:00 AM IST daily rates successfully recorded from GoldAPI.io for 24K, 22K, 18K & Silver.',
      timestamp: 'Today at 9:00 AM IST',
      is_read: false,
      priority: 'medium',
      action_tab: 'rates'
    },
    {
      id: 'notif-2',
      category: 'loans',
      title: '3 Pawn Contracts Overdue for Redemption',
      message: 'Pledge contracts PLG-2024-0081, 0089 have exceeded standard 12-month tenure. Legal notice recommended.',
      timestamp: '2 hours ago',
      is_read: false,
      priority: 'high',
      action_tab: 'reports'
    },
    {
      id: 'notif-3',
      category: 'inventory',
      title: 'Low Stock Alert: 22K Hallmarked Kadas',
      message: 'Available stock has fallen to 2 units in South Indian Antique Bangles.',
      timestamp: '5 hours ago',
      is_read: false,
      priority: 'medium',
      action_tab: 'inventory'
    },
    {
      id: 'notif-4',
      category: 'orders',
      title: 'New Online Pawn Valuation Request',
      message: 'Patron submitted online collateral appraisal for 32g 22K Lakshmi Choker.',
      timestamp: 'Yesterday',
      is_read: true,
      priority: 'low',
      action_tab: 'online_requests'
    },
    {
      id: 'notif-5',
      category: 'security',
      title: 'Administrator Session Logged',
      message: 'New session initiated for admin@luxury.com.',
      timestamp: 'Yesterday',
      is_read: true,
      priority: 'low',
      action_tab: 'settings'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleItemClick = (n: AdminNotification) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    if (n.action_tab) {
      onNavigateTab(n.action_tab);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <motion.div 
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
          />
          
          <motion.div 
            variants={drawerRightVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-screen max-w-md bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-main)] admin-card-title">Operational Alerts</h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">{unreadCount} unread system notifications</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[var(--gold-primary)] hover:underline"
                  >
                    Mark All Read
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                  aria-label="Close notifications drawer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                    n.is_read 
                      ? 'bg-[var(--bg-elevated)] border-[var(--border-color)] opacity-75' 
                      : 'bg-[var(--bg-card)] border-[var(--gold-primary)]/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                      n.priority === 'high' 
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400' 
                        : (n.priority === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-sky-500/10 text-sky-700 dark:text-sky-400')
                    }`}>
                      {n.category.toUpperCase()} • {n.priority}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">{n.timestamp}</span>
                  </div>

                  <h4 className="text-xs font-bold text-[var(--text-main)] mt-1">{n.title}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{n.message}</p>

                  {n.action_tab && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--gold-primary)] font-semibold mt-2 group-hover:translate-x-1 transition-transform">
                      <span>Inspect In {n.action_tab.toUpperCase()}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] text-center text-[10px] text-[var(--text-secondary)]">
              YAZHINI Fine Jewels &amp; Pawn Shop Operational Notification Center • Asia/Kolkata IST
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
