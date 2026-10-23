import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingBag, 
  Bell, 
  Sun, 
  Moon, 
  ArrowLeft, 
  Menu, 
  Sparkles, 
  ChevronRight,
  Package,
  Coins,
  TrendingUp,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useRates } from '../../context/RateContext';
import { useTheme } from '../../context/ThemeContext';
import type { User } from '@supabase/supabase-js';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'order' | 'rate' | 'vault' | 'concierge';
  timestamp: string;
  isRead: boolean;
}

interface CustomerAccountHeaderProps {
  user: User | null;
  activeTabTitle: string;
  onSelectTab: (tab: string) => void;
  onToggleMobileSidebar: () => void;
  onSignOut: () => void;
  unreadCount?: number;
  notifications?: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onMarkAsRead?: (id: string) => void;
  isNotificationOpen?: boolean;
  onToggleNotifications?: () => void;
  onCloseNotifications?: () => void;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Consignment Dispatched via Sequel Armoured Logistics',
    message: 'Your fine jewellery piece has passed BIS 916 laser hallmarking and is in transit with full insurance cover.',
    category: 'order',
    timestamp: 'Today, 10:30 AM',
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Aura Gold™ Market Benchmark Update',
    message: '24K 999.9 Bullion rate updated to prevailing benchmark ₹14,928/g. Your vault holding has been re-evaluated.',
    category: 'vault',
    timestamp: 'Yesterday, 04:15 PM',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Complimentary Ultrasonic Cleaning Service Due',
    message: 'Your annual complimentary jewellery inspection and cleaning is available at our Cathedral Road Showroom, Chennai.',
    category: 'concierge',
    timestamp: '3 days ago',
    isRead: true
  }
];

export const CustomerAccountHeader: React.FC<CustomerAccountHeaderProps> = ({
  user,
  activeTabTitle,
  onSelectTab,
  onToggleMobileSidebar,
  onSignOut,
  unreadCount: unreadCountProp,
  notifications: notificationsProp,
  onMarkAllAsRead,
  onMarkAsRead,
  isNotificationOpen: isNotificationOpenProp,
  onToggleNotifications,
  onCloseNotifications
}) => {
  const { wishlist } = useWishlist();
  const { totalItems } = useCart();
  const { rates } = useRates();
  const { theme, toggleTheme } = useTheme();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isNotificationOpen = isNotificationOpenProp !== undefined ? isNotificationOpenProp : internalIsOpen;
  
  const setIsNotificationOpen = (open: boolean) => {
    setInternalIsOpen(open);
    if (!open && onCloseNotifications) onCloseNotifications();
    if (open && onToggleNotifications) onToggleNotifications();
  };

  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationOpen]);

  const items = notificationsProp || defaultNotifications;
  const unreadCount = unreadCountProp !== undefined 
    ? unreadCountProp 
    : items.filter(n => !n.isRead).length;

  const liveGold24K = rates?.gold || 14928;
  const patronName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Patron';

  const handleNotificationClick = (notif: NotificationItem) => {
    onMarkAsRead?.(notif.id);
    if (notif.category === 'order') {
      onSelectTab('orders');
      setIsNotificationOpen(false);
    } else if (notif.category === 'vault' || notif.category === 'rate') {
      onSelectTab('vault');
      setIsNotificationOpen(false);
    } else if (notif.category === 'concierge') {
      onSelectTab('support');
      setIsNotificationOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-300">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger + Brand Crest + Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Toggle Account Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Private Patron Badge */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#702638] via-[#450817] to-[#2B0B13] border border-[#D4AF37]/40 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-serif font-bold text-xs text-[#D8B878]">Y</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-bold tracking-[0.2em] text-sm text-[var(--text-main)] block leading-tight">
                YAZHINI
              </span>
              <span className="text-[9px] font-sans tracking-[0.18em] uppercase text-[var(--gold-primary)] font-semibold block">
                Patron Portal
              </span>
            </div>
          </Link>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-secondary)] pl-3 border-l border-[var(--border-color)]">
            <Link to="/" className="hover:text-[var(--gold-primary)] transition-colors">
              Boutique
            </Link>
            <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]/60" />
            <button
              onClick={() => onSelectTab('overview')}
              className="hover:text-[var(--gold-primary)] transition-colors"
            >
              Private Client
            </button>
            <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]/60" />
            <span className="font-semibold text-[var(--text-main)]">
              {activeTabTitle}
            </span>
          </nav>
        </div>

        {/* Center: Live Bullion Benchmark Ticker Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[var(--text-secondary)] font-medium">24K Bullion Benchmark:</span>
          <span className="font-bold font-mono text-[var(--text-main)]">₹{liveGold24K.toLocaleString('en-IN')}/g</span>
          <span className="text-[10px] text-emerald-500 font-semibold ml-0.5">+0.42%</span>
        </div>

        {/* Right: Quick actions + Bag + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Return to Boutique Link */}
          <Link
            to="/jewellery"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 bg-[var(--bg-elevated)] text-[var(--text-main)] text-xs font-semibold hover:text-[var(--gold-primary)] transition-all"
            title="Explore Fine Jewellery Collections"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Store</span>
          </Link>

          {/* Wishlist Shortcut */}
          <button
            type="button"
            onClick={() => onSelectTab('wishlist')}
            className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="View Wishlist"
            title="My Curated Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#702638] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag Shortcut */}
          <Link
            to="/jewellery"
            className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Shopping Bag"
            title="Review Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--gold-primary)] text-black text-[10px] font-bold flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Notifications Nav Item & Interactive Popover */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              id="patron-notifications-btn"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative p-2 rounded-xl transition-all ${
                isNotificationOpen
                  ? 'text-[var(--gold-primary)] bg-[var(--bg-elevated)] ring-1 ring-[var(--gold-primary)]/40 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
              aria-label="Account Notifications"
              aria-expanded={isNotificationOpen}
              aria-haspopup="true"
              title="Account Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-stone-950 text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl z-50 overflow-hidden backdrop-blur-md"
                  role="region"
                  aria-label="Notifications Dropdown"
                >
                  {/* Dropdown Header */}
                  <div className="p-3.5 sm:p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/30 flex items-center justify-center text-[var(--gold-primary)]">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-serif font-bold text-[var(--text-main)] leading-tight">
                          Patron Notifications
                        </h4>
                        <p className="text-[10px] text-[var(--text-secondary)]">
                          {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts caught up'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAllAsRead?.();
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/10 transition-colors"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotificationOpen(false)}
                        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                        aria-label="Close notifications"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Items List */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border-color)]/60 scrollbar-thin">
                    {items.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] mx-auto flex items-center justify-center text-[var(--text-secondary)]">
                          <Check className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-xs font-semibold text-[var(--text-main)]">You're all caught up!</p>
                        <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto">
                          New order dispatch alerts, bullion benchmark movements, and concierge updates will appear here.
                        </p>
                      </div>
                    ) : (
                      items.map((notif) => {
                        const getCategoryIcon = () => {
                          switch (notif.category) {
                            case 'order':
                              return <Package className="w-3.5 h-3.5 text-amber-500" />;
                            case 'vault':
                              return <Coins className="w-3.5 h-3.5 text-[var(--gold-primary)]" />;
                            case 'rate':
                              return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
                            case 'concierge':
                              return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
                            default:
                              return <Bell className="w-3.5 h-3.5 text-[var(--gold-primary)]" />;
                          }
                        };

                        const getCategoryLabel = () => {
                          switch (notif.category) {
                            case 'order': return 'Consignment';
                            case 'vault': return 'Bullion Vault';
                            case 'rate': return 'Market Rate';
                            case 'concierge': return 'Concierge';
                            default: return 'Notification';
                          }
                        };

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 text-left transition-colors cursor-pointer group flex items-start gap-3 ${
                              notif.isRead
                                ? 'hover:bg-[var(--bg-elevated)]/70 opacity-80 hover:opacity-100'
                                : 'bg-[var(--gold-primary)]/5 hover:bg-[var(--gold-primary)]/10 font-medium'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              {getCategoryIcon()}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--gold-primary)]">
                                  {getCategoryLabel()}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)] font-mono whitespace-nowrap">
                                  {notif.timestamp}
                                </span>
                              </div>

                              <h5 className={`text-xs leading-snug line-clamp-1 group-hover:text-[var(--gold-primary)] transition-colors ${
                                notif.isRead ? 'text-[var(--text-secondary)] font-medium' : 'text-[var(--text-main)] font-semibold'
                              }`}>
                                {notif.title}
                              </h5>

                              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 shadow-xs" title="Unread" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer Quick Action */}
                  <div className="p-2.5 border-t border-[var(--border-color)] bg-[var(--bg-elevated)]/40 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        onSelectTab('orders');
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] font-medium transition-colors"
                    >
                      Track Consignments →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        onSelectTab('support');
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] font-medium transition-colors"
                    >
                      Patron Concierge →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="h-5 w-px bg-[var(--border-color)] mx-1 hidden sm:block" />

          {/* Patron Avatar & Quick Menu */}
          <div className="flex items-center gap-2 pl-1">
            <button
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-2 group text-left cursor-pointer"
              title="View Patron Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#702638] to-[#450817] border border-[#D4AF37]/60 flex items-center justify-center text-white font-serif font-bold text-xs shadow-xs group-hover:ring-2 group-hover:ring-[#D4AF37]/50 transition-all">
                {patronName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-[var(--text-main)] block leading-tight group-hover:text-[var(--gold-primary)] transition-colors">
                  {patronName}
                </span>
                <span className="text-[10px] text-[var(--gold-primary)] font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Royal Patron
                </span>
              </div>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
