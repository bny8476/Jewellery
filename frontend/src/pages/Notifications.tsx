import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, CheckCheck, Trash2, Search, ArrowRight, 
  RefreshCw, Shield, Gem, CreditCard, Sparkles
} from 'lucide-react';
import Footer from '../components/Footer';
import { useNotifications, NotificationRecord } from '../context/NotificationContext';
import { toast } from '../utils/toast';
import { BackButton } from '../components/ui/BackButton';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    isRealtimeConnected
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'All Alerts' },
    { id: 'unread', label: 'Unread' },
    { id: 'order', label: 'Orders & Shipments' },
    { id: 'payment', label: 'Payments & POS' },
    { id: 'vault', label: 'Aura Gold™ Vault' },
    { id: 'pawn', label: 'Pawn Loans' },
    { id: 'giftcard', label: 'Gift Cards' },
    { id: 'security', label: 'Security & Access' }
  ];

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread' && n.is_read) return false;
    if (activeFilter !== 'all' && activeFilter !== 'unread' && n.category !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.related_entity_id && n.related_entity_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    toast.info('Notifications refreshed');
  };

  const handleNavigate = (n: NotificationRecord) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    if (n.destination_route) {
      navigate(n.destination_route);
      return;
    }
    if (n.category === 'order') navigate('/dashboard?tab=orders');
    else if (n.category === 'vault' || n.category === 'rate') navigate('/dashboard?tab=vault');
    else if (n.category === 'pawn') navigate('/dashboard?tab=pawn_loans');
    else if (n.category === 'giftcard') navigate('/gift-cards');
    else navigate('/dashboard');
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vault':
      case 'rate':
        return <Gem className="w-4 h-4 text-[#D8B878]" />;
      case 'pawn':
      case 'payment':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'security':
        return <Shield className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#D8B878]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EAE5D9] flex flex-col font-sans selection:bg-[#C9A45C]/30 selection:text-[#F7F4EB]">
      {/* Top Luxury Header */}
      <header className="sticky top-0 z-40 bg-[#0D0F12]/95 backdrop-blur-md border-b border-[#C9A45C]/20 px-4 sm:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackPath="/dashboard?tab=overview" label="Back to Dashboard" variant="compact" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-serif font-bold text-[#F7F4EB] tracking-wide">
                Patron Notification Centre
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A45C] text-[#0D0F12]">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#A6A092] flex items-center gap-2">
              <span>Real-time private dispatch for YAZHINI Fine Jewels patrons</span>
              {isRealtimeConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-[#181B22] border border-[#C9A45C]/25 text-[#A6A092] hover:text-[#F7F4EB] transition-colors disabled:opacity-50"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#C9A45C]/15 text-[#D8B878] border border-[#C9A45C]/35 hover:bg-[#C9A45C]/25 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Controls: Search + Category Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A6A092]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across order confirmations, vault allocations, pawn reminders..."
              className="w-full bg-[#13161C] border border-[#C9A45C]/25 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#F7F4EB] placeholder-[#767167] focus:outline-none focus:border-[#C9A45C]/60 transition-colors shadow-inner"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === cat.id
                    ? 'bg-[#C9A45C] text-[#0D0F12] font-bold shadow-md shadow-[#C9A45C]/20'
                    : 'bg-[#13161C] text-[#A6A092] hover:text-[#F7F4EB] border border-[#C9A45C]/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#D8B878] mx-auto" />
              <p className="text-sm text-[#A6A092]">Loading secure notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-24 rounded-3xl bg-[#13161C] border border-[#C9A45C]/20 text-center space-y-3 p-8">
              <div className="w-14 h-14 rounded-2xl bg-[#181B22] border border-[#C9A45C]/30 mx-auto flex items-center justify-center text-[#D8B878]">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#F7F4EB]">No notifications found</h3>
              <p className="text-xs text-[#A6A092] max-w-sm mx-auto">
                No alerts matching your active filter criteria. Real-time updates for shipments, bullion rates, and pawn loans will display here.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    n.is_read
                      ? 'bg-[#13161C]/80 border-[#C9A45C]/15 opacity-80'
                      : 'bg-[#13161C] border-[#C9A45C]/40 shadow-lg shadow-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#181B22] border border-[#C9A45C]/25 shrink-0 mt-0.5">
                        {getCategoryIcon(n.category)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-[#F7F4EB]">{n.title}</h4>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#D8B878]" title="Unread" />
                          )}
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                            n.severity === 'error' || n.severity === 'critical'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : (n.severity === 'warning'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-[#C9A45C]/15 text-[#D8B878] border border-[#C9A45C]/30')
                          }`}>
                            {n.category.toUpperCase()} • {n.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[#A6A092] leading-relaxed max-w-2xl">{n.message}</p>
                        <p className="text-[10px] text-[#767167] font-mono pt-1">
                          {formatTimestamp(n.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleNavigate(n)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#D8B878] bg-[#181B22] border border-[#C9A45C]/25 hover:bg-[#202530] transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-2 rounded-xl text-[#A6A092] hover:text-[#D8B878] hover:bg-[#181B22] transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="p-2 rounded-xl text-[#A6A092] hover:text-rose-400 hover:bg-[#181B22] transition-colors"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
