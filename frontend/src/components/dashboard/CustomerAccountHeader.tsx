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
  onSignOut: _onSignOut,
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-colors duration-200">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger + Brand Crest + Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-[#343A40] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Toggle Account Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Private Patron Badge */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#25282D] border border-[#25282D] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-inter font-semibold text-sm tracking-widest text-[#C9A45C]">Y</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-inter font-semibold tracking-[0.25em] text-sm text-[#25282D] block leading-tight">
                YAZHINI
              </span>
              <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-[#8792A2] font-semibold block">
                Patron Portal
              </span>
            </div>
          </Link>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-xs text-[#8792A2] pl-4 border-l border-[#E5E7EB]">
            <Link to="/" className="hover:text-[#25282D] transition-colors font-medium">
              Boutique
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8792A2]/60" />
            <button
              onClick={() => onSelectTab('overview')}
              className="hover:text-[#25282D] transition-colors font-medium"
            >
              Customer Portal
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#8792A2]/60" />
            <span className="font-semibold text-[#25282D]">
              {activeTabTitle}
            </span>
          </nav>
        </div>

        {/* Center: Live Bullion Benchmark Ticker Pill */}
        <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#8792A2] font-medium uppercase tracking-wider text-[10px]">24K Bullion Benchmark:</span>
          <span className="font-bold font-mono text-[#25282D]">₹{liveGold24K.toLocaleString('en-IN')}/g</span>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">+0.42%</span>
        </div>

        {/* Right: Quick actions + Bag + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Return to Boutique Link */}
          <Link
            to="/jewellery"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] hover:border-[#25282D] bg-white text-[#343A40] text-xs font-semibold hover:text-[#25282D] transition-all shadow-xs"
            title="Explore Fine Jewellery Collections"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Store</span>
          </Link>

          {/* Wishlist Shortcut */}
          <button
            type="button"
            onClick={() => onSelectTab('wishlist')}
            className="relative p-2.5 rounded-lg text-[#343A40] hover:text-[#25282D] hover:bg-[#F3F4F6] transition-colors"
            aria-label="View Wishlist"
            title="My Curated Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#25282D] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag Shortcut */}
          <Link
            to="/jewellery"
            className="relative p-2.5 rounded-lg text-[#343A40] hover:text-[#25282D] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Shopping Bag"
            title="Review Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C9A45C] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
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
              className={`relative p-2.5 rounded-lg transition-all ${
                isNotificationOpen
                  ? 'text-[#25282D] bg-[#F3F4F6] ring-1 ring-[#25282D]/20 shadow-xs'
                  : 'text-[#343A40] hover:text-[#25282D] hover:bg-[#F3F4F6]'
              }`}
              aria-label="Account Notifications"
              aria-expanded={isNotificationOpen}
              aria-haspopup="true"
              title="Account Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#C9A45C] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
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
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#E5E7EB] shadow-xl z-50 overflow-hidden"
                  role="region"
                  aria-label="Notifications Dropdown"
                >
                  {/* Dropdown Header */}
                  <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] bg-[#F3F4F6]/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#25282D] flex items-center justify-center text-[#C9A45C]">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-inter font-bold text-[#25282D] leading-tight">
                          Patron Notifications
                        </h4>
                        <p className="text-[10px] text-[#8792A2] font-sans">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-[#25282D] bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors shadow-xs"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-3 h-3 text-[#C9A45C]" />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotificationOpen(false)}
                        className="p-1 rounded-md text-[#8792A2] hover:text-[#25282D] hover:bg-white transition-colors"
                        aria-label="Close notifications"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Items List */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-[#E5E7EB] scrollbar-thin">
                    {items.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] mx-auto flex items-center justify-center text-[#8792A2]">
                          <Check className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-semibold text-[#25282D]">You're all caught up</p>
                        <p className="text-[11px] text-[#8792A2] max-w-xs mx-auto">
                          New order dispatch alerts, bullion benchmark updates, and concierge messages will appear here.
                        </p>
                      </div>
                    ) : (
                      items.map((notif) => {
                        const getCategoryIcon = () => {
                          switch (notif.category) {
                            case 'order':
                              return <Package className="w-3.5 h-3.5 text-[#25282D]" />;
                            case 'vault':
                              return <Coins className="w-3.5 h-3.5 text-[#C9A45C]" />;
                            case 'rate':
                              return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
                            case 'concierge':
                              return <Sparkles className="w-3.5 h-3.5 text-[#8792A2]" />;
                            default:
                              return <Bell className="w-3.5 h-3.5 text-[#25282D]" />;
                          }
                        };

                        const getCategoryLabel = () => {
                          switch (notif.category) {
                            case 'order': return 'Order Status';
                            case 'vault': return 'Gold Vault';
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
                                ? 'hover:bg-[#F3F4F6] opacity-75 hover:opacity-100 bg-white'
                                : 'bg-[#FAF3E8]/50 hover:bg-[#FAF3E8]'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[#25282D] transition-colors shadow-xs">
                              {getCategoryIcon()}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8792A2]">
                                  {getCategoryLabel()}
                                </span>
                                <span className="text-[10px] text-[#8792A2] font-mono whitespace-nowrap">
                                  {notif.timestamp}
                                </span>
                              </div>

                              <h5 className={`text-xs leading-snug line-clamp-1 group-hover:text-[#25282D] transition-colors ${
                                notif.isRead ? 'text-[#343A40] font-medium' : 'text-[#25282D] font-semibold'
                              }`}>
                                {notif.title}
                              </h5>

                              <p className="text-[11px] text-[#8792A2] leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#C9A45C] shrink-0 mt-1.5" title="Unread" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer Quick Action */}
                  <div className="p-3 border-t border-[#E5E7EB] bg-[#F3F4F6]/50 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        onSelectTab('orders');
                      }}
                      className="text-[#343A40] hover:text-[#25282D] font-medium transition-colors"
                    >
                      View All Orders →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        onSelectTab('support');
                      }}
                      className="text-[#343A40] hover:text-[#25282D] font-medium transition-colors"
                    >
                      Customer Support →
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
            className="p-2.5 rounded-lg text-[#343A40] hover:text-[#25282D] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#8792A2]" />}
          </button>

          <div className="h-5 w-px bg-[#E5E7EB] mx-1 hidden sm:block" />

          {/* Patron Avatar & Quick Menu */}
          <div className="flex items-center gap-2 pl-1">
            <button
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
              title="View Customer Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25282D] border border-[#25282D] flex items-center justify-center text-white font-inter font-bold text-xs shadow-xs group-hover:ring-2 group-hover:ring-[#C9A45C]/50 transition-all">
                {patronName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-[#25282D] block leading-tight group-hover:text-[#C9A45C] transition-colors">
                  {patronName}
                </span>
                <span className="text-[10px] text-[#8792A2] font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#C9A45C]" /> Valued Member
                </span>
              </div>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
