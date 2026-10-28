import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, ArrowRight, Check, Trash2, Search, RefreshCw
} from 'lucide-react';
import { drawerRightVariants, modalBackdropVariants } from '../../utils/motion';
import { useNotifications, NotificationRecord } from '../../context/NotificationContext';

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
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [drawerFilter, setDrawerFilter] = useState<string>('all');
  const [drawerSearch, setDrawerSearch] = useState<string>('');

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'order', label: 'Orders' },
    { id: 'payment', label: 'Payments' },
    { id: 'vault', label: 'Vault' },
    { id: 'pawn', label: 'Pawn' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'security', label: 'Security' }
  ];

  const filteredNotifications = notifications.filter(n => {
    if (drawerFilter === 'unread' && n.is_read) return false;
    if (drawerFilter !== 'all' && drawerFilter !== 'unread' && n.category !== drawerFilter) return false;
    if (drawerSearch.trim()) {
      const q = drawerSearch.toLowerCase().trim();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.related_entity_id && n.related_entity_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleItemClick = async (n: NotificationRecord) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    const targetRoute = n.destination_route || '';
    if (targetRoute.includes('tab=')) {
      const tabParam = targetRoute.split('tab=')[1]?.split('&')[0];
      if (tabParam) {
        onNavigateTab(tabParam);
        onClose();
        return;
      }
    }
    if (n.category === 'pawn') onNavigateTab('transaction');
    else if (n.category === 'inventory') onNavigateTab('inventory');
    else if (n.category === 'order') onNavigateTab('orders');
    else if (n.category === 'rate') onNavigateTab('rates');
    else if (n.category === 'vault') onNavigateTab('auragold');
    else if (n.category === 'security') onNavigateTab('settings');
    onClose();
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '';
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
            className="fixed inset-0 bg-black/75 backdrop-blur-sm" 
          />
          
          <motion.div 
            variants={drawerRightVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-screen max-w-md bg-[#13161C] border-l border-[#C9A45C]/25 text-[#EAE5D9] shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#C9A45C]/20 bg-[#0D0F12] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#C9A45C]/10 text-[#D8B878] border border-[#C9A45C]/30 shadow-inner">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#F7F4EB] tracking-wide font-serif">
                    Operational Alerts
                  </h3>
                  <p className="text-[11px] text-[#A6A092]">
                    {unreadCount > 0 ? `${unreadCount} unread system notifications` : 'All alerts up to date'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] font-semibold text-[#D8B878] hover:text-[#E8CD94] hover:underline transition-colors"
                  >
                    Mark All Read
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#A6A092] hover:text-[#F7F4EB] hover:bg-[#1F232B] transition-colors"
                  aria-label="Close notifications drawer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Search Bar & Quick Categories */}
            <div className="p-3 border-b border-[#C9A45C]/15 bg-[#181B22] space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A6A092]" />
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Filter by title, reference, or alert..."
                  className="w-full bg-[#0D0F12] border border-[#C9A45C]/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F7F4EB] placeholder-[#767167] focus:outline-none focus:border-[#C9A45C]/60"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {filterTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider shrink-0 transition-all ${
                      drawerFilter === tab.id
                        ? 'bg-[#C9A45C] text-[#0D0F12] shadow-sm font-bold'
                        : 'bg-[#0D0F12] text-[#A6A092] hover:text-[#F7F4EB] border border-[#C9A45C]/15'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {loading && notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#D8B878]" />
                  <p className="text-xs text-[#A6A092]">Synchronizing vault alerts...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#181B22] border border-[#C9A45C]/20 mx-auto flex items-center justify-center text-[#A6A092]">
                    <Bell className="w-5 h-5 opacity-60" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#F7F4EB]">No notifications found</h4>
                  <p className="text-[11px] text-[#767167]">No alerts matching the selected category</p>
                </div>
              ) : (
                filteredNotifications.map(n => (
                  <motion.div
                    key={n.id}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                      n.is_read 
                        ? 'bg-[#181B22]/70 border-[#C9A45C]/15 opacity-80' 
                        : 'bg-[#181B22] border-[#C9A45C]/40 shadow-sm'
                    }`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                        n.severity === 'error' || n.severity === 'critical'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : (n.severity === 'warning'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-[#C9A45C]/15 text-[#D8B878] border border-[#C9A45C]/30')
                      }`}>
                        {n.category.toUpperCase()} • {n.severity}
                      </span>
                      <span className="text-[10px] text-[#A6A092] font-mono">
                        {formatTimestamp(n.created_at)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#F7F4EB] leading-snug">{n.title}</h4>
                    <p className="text-[11px] text-[#A6A092] mt-1 leading-relaxed">{n.message}</p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#C9A45C]/10 text-[10px]">
                      <div className="flex items-center gap-1 text-[#D8B878] font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect alert</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>

                      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {!n.is_read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="p-1 rounded hover:bg-[#0D0F12] text-[#D8B878]"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 rounded hover:bg-[#0D0F12] text-rose-400"
                          title="Archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-[#C9A45C]/20 bg-[#0D0F12] text-center text-[10px] text-[#767167]">
              YAZHINI Fine Jewels &amp; Pawn Shop Operational Notification Center • Asia/Kolkata IST
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
