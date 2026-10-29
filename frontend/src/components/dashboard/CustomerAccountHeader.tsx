import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingBag, 
  Bell, 
  ArrowLeft, 
  Menu, 
  Sparkles, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ArrowRight,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useRates } from '../../context/RateContext';
import { useTheme } from '../../context/ThemeContext';
import type { User } from '@supabase/supabase-js';
import { NotificationPopupCard } from '../ui/NotificationPopupCard';
import { BackButton } from '../ui/BackButton';
import { CustomerAvatar } from './CustomerAvatar';
import { AnimatedThemeToggler } from '../../registry/magicui/animated-theme-toggler';

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
  customerName?: string;
  customerGender?: string;
  customerPhotoUrl?: string;
  customerTier?: string;
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
  isRatesOpen?: boolean;
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
  customerName: customerNameProp,
  customerGender: customerGenderProp,
  customerPhotoUrl: customerPhotoUrlProp,
  customerTier: customerTierProp,
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
  onCloseNotifications,
  isRatesOpen: isRatesOpenProp
}) => {
  const { wishlist } = useWishlist();
  const { totalItems } = useCart();
  const { rates } = useRates();
  const { theme, setTheme } = useTheme();

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

  // Rates Dropdown state & listeners
  const [internalRatesOpen, setInternalRatesOpen] = useState(false);
  const isRatesDropdownOpen = isRatesOpenProp !== undefined ? isRatesOpenProp : internalRatesOpen;
  const ratesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ratesDropdownRef.current && !ratesDropdownRef.current.contains(event.target as Node)) {
        setInternalRatesOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInternalRatesOpen(false);
      }
    };
    if (isRatesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRatesDropdownOpen]);

  const items = notificationsProp || defaultNotifications;
  const unreadCount = unreadCountProp !== undefined 
    ? unreadCountProp 
    : items.filter(n => !n.isRead).length;

  const gold24k = rates?.gold || 14928;
  const gold22k = rates?.gold22k || 13684;
  const silver = rates?.silver || 220;
  const platinum = rates?.platinum || 5085;
  const rawPatronName = customerNameProp || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Patron';
  const patronName = rawPatronName.replace(/\s*\((?:Royal Patron|Patron)\)\s*/gi, '').replace(/\s*Royal Patron\s*/gi, '').trim() || 'Valued Patron';
  const patronGender = customerGenderProp || user?.user_metadata?.gender || 'female';
  const patronPhotoUrl = customerPhotoUrlProp || user?.user_metadata?.photo_url || user?.user_metadata?.avatar_url;
  const rawTier = customerTierProp || user?.user_metadata?.loyalty_tier;
  const patronTier = (rawTier && rawTier !== 'Royal Patron') ? rawTier : 'Valued Member';

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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-neutral-800 transition-colors duration-200">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger + Mobile Back + Brand Crest + Breadcrumbs */}
        <div className="flex items-center gap-2.5 sm:gap-5">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-[#343A40] dark:text-[#D2D7E2] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors"
            aria-label="Toggle Account Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {activeTabTitle !== 'Overview' && (
            <button
              type="button"
              onClick={() => onSelectTab('overview')}
              className="lg:hidden p-2 rounded-lg text-[#25282D] dark:text-[#D8B878] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors"
              aria-label="Back to Overview"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Logo & Private Patron Badge */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#25282D] dark:bg-[#171A22] border border-[#25282D] dark:border-[#D8B878]/30 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-inter font-semibold text-sm tracking-widest text-[#D8B878]">Y</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-inter font-semibold tracking-[0.25em] text-sm text-[#25282D] dark:text-[#F7F8FA] block leading-tight">
                YAZHINI
              </span>
              <span className="text-[9px] font-sans tracking-[0.2em] uppercase text-[#8792A2] dark:text-[#8D96A5] font-semibold block">
                Patron Portal
              </span>
            </div>
          </Link>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-xs text-[#8792A2] dark:text-[#8D96A5] pl-4 border-l border-[#E5E7EB] dark:border-[#222733]">
            <Link to="/" className="hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors font-medium">
              Boutique
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#8792A2]/60 dark:text-[#8D96A5]/60" />
            <button
              onClick={() => onSelectTab('overview')}
              className="hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors font-medium"
            >
              Customer Portal
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#8792A2]/60 dark:text-[#8D96A5]/60" />
            <span className="font-semibold text-[#25282D] dark:text-[#F7F8FA]">
              {activeTabTitle}
            </span>
          </nav>
        </div>

        {/* Center: Live Bullion Benchmark Ticker Pill with Interactive Dropdown */}
        <div ref={ratesDropdownRef} className="relative hidden lg:flex items-center">
          <button
            type="button"
            onClick={() => setInternalRatesOpen(prev => !prev)}
            aria-expanded={isRatesDropdownOpen}
            aria-label="Toggle Today's Live Bullion Rates"
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D]/40 dark:hover:border-[#D8B878]/50 text-[11px] transition-all cursor-pointer group shadow-2xs select-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#8792A2] dark:text-[#8D96A5] font-medium uppercase tracking-wider text-[10px]">
              24K Bullion Benchmark:
            </span>
            <span className="font-bold font-mono text-[#25282D] dark:text-[#F7F8FA]">
              ₹{gold24k.toLocaleString('en-IN')}/g
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              +0.42%
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5] transition-transform duration-200 ${isRatesDropdownOpen ? 'rotate-180 text-[#25282D] dark:text-[#D8B878]' : 'group-hover:text-[#25282D] dark:group-hover:text-[#F7F8FA]'}`} />
          </button>

          {/* Today's Live Rates Dropdown Menu */}
          <AnimatePresence>
            {isRatesDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-[#13161C] rounded-xl border border-[#E5E7EB] dark:border-[#222733] shadow-xl p-4 z-50 text-left"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#222733] mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8792A2] dark:text-[#8D96A5] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#25282D] dark:text-[#D8B878]" />
                    Today&#x27;s Live Rates
                  </span>
                  <span className="text-[10px] font-mono text-[#8792A2] dark:text-[#8D96A5]">
                    Per Gram
                  </span>
                </div>

                {/* Rate Rows */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB] dark:border-[#222733]/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A45C]" />
                      <span className="text-[#343A40] dark:text-[#D2D7E2]">24K Pure Gold (999.9)</span>
                    </div>
                    <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">
                      ₹{gold24k.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB] dark:border-[#222733]/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      <span className="text-[#343A40] dark:text-[#D2D7E2]">22K Standard (916)</span>
                    </div>
                    <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">
                      ₹{gold22k.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB] dark:border-[#222733]/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="text-[#343A40] dark:text-[#D2D7E2]">999 Fine Silver</span>
                    </div>
                    <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">
                      ₹{silver.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8792A2]" />
                      <span className="text-[#343A40] dark:text-[#D2D7E2]">Pt950 Platinum</span>
                    </div>
                    <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">
                      ₹{platinum.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Vault Navigation Link */}
                <button
                  type="button"
                  onClick={() => {
                    setInternalRatesOpen(false);
                    onSelectTab('vault');
                  }}
                  className="mt-3.5 pt-2.5 border-t border-[#E5E7EB] dark:border-[#222733] w-full flex items-center justify-center gap-1.5 text-xs text-[#25282D] dark:text-[#D8B878] hover:text-[#C9A45C] dark:hover:text-[#F7F8FA] font-semibold transition-colors cursor-pointer"
                >
                  <span>Gold Savings Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Quick actions + Bag + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Return to Boutique BackButton */}
          <BackButton
            fallbackPath="/jewellery"
            label="Store"
            variant="outline"
            className="hidden sm:inline-flex"
          />

          {/* Wishlist Shortcut */}
          <button
            type="button"
            onClick={() => onSelectTab('wishlist')}
            className="relative p-2.5 rounded-lg text-[#343A40] dark:text-[#D2D7E2] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors"
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
            className="relative p-2.5 rounded-lg text-[#343A40] dark:text-[#D2D7E2] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors"
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
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 w-84 sm:w-[380px] rounded-[24px] bg-[#1E2026]/95 dark:bg-[#13151A]/95 backdrop-blur-xl border border-[#E5E7EB] dark:border-[#222733] shadow-2xl z-50 overflow-hidden"
                  role="region"
                  aria-label="Notifications Dropdown"
                >
                  {/* Dropdown Header */}
                  <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] dark:border-[#222733] bg-[#F3F4F6]/70 dark:bg-black/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#25282D] dark:bg-[#181B22] border border-[#25282D] dark:border-[#D8B878]/30 flex items-center justify-center text-[#D8B878] shadow-xs">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-inter font-bold text-[#25282D] dark:text-[#F7F8FA] leading-tight">
                          Patron Notifications
                        </h4>
                        <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] font-sans">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-[#25282D] dark:text-[#F7F8FA] bg-white dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] hover:bg-[#F3F4F6] dark:hover:bg-[#202530] transition-colors shadow-xs"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-3 h-3 text-[#D8B878]" />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotificationOpen(false)}
                        className="p-1 rounded-full text-[#8792A2] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-white dark:hover:bg-white/10 transition-colors"
                        aria-label="Close notifications"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Items List with Floating Notification Cards */}
                  <div className="p-3 max-h-[380px] overflow-y-auto space-y-2.5 scrollbar-thin">
                    {items.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] mx-auto flex items-center justify-center text-[#8792A2]">
                          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-xs font-semibold text-[#25282D] dark:text-[#F7F8FA]">You're all caught up</p>
                        <p className="text-[11px] text-[#8792A2] dark:text-[#8D96A5] max-w-xs mx-auto">
                          New order dispatch alerts, bullion benchmark updates, and concierge messages will appear here.
                        </p>
                      </div>
                    ) : (
                      items.map((notif) => (
                        <NotificationPopupCard
                          key={notif.id}
                          title={notif.title}
                          message={notif.message}
                          timestamp={notif.timestamp}
                          category={notif.category}
                          isRead={notif.isRead}
                          onClick={() => handleNotificationClick(notif)}
                        />
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer Quick Action */}
                  <div className="p-3 border-t border-[#E5E7EB] dark:border-[#222733] bg-[#F3F4F6]/50 dark:bg-black/30 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        onSelectTab('orders');
                      }}
                      className="text-[#343A40] dark:text-[#D2D7E2] hover:text-[#25282D] dark:hover:text-[#D8B878] font-medium transition-colors"
                    >
                      View All Orders →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        onSelectTab('support');
                      }}
                      className="text-[#343A40] dark:text-[#D2D7E2] hover:text-[#25282D] dark:hover:text-[#D8B878] font-medium transition-colors"
                    >
                      Customer Support →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <AnimatedThemeToggler
            theme={theme}
            onThemeChange={(newTheme) => setTheme(newTheme)}
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-lg text-[#343A40] dark:text-[#D2D7E2] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors !border-0 !bg-transparent focus-visible:!ring-1 focus-visible:!ring-[#C9A45C] cursor-pointer"
          />

          <div className="h-5 w-px bg-[#E5E7EB] dark:bg-[#222733] mx-1 hidden sm:block" />

          {/* Patron Avatar & Quick Menu with Luxury Aesthetics */}
          <div className="flex items-center gap-2 pl-1">
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-2.5 group text-left cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-all"
              title="View Customer Profile"
            >
              <CustomerAvatar
                name={patronName}
                gender={patronGender}
                photoUrl={patronPhotoUrl}
                size="sm"
                loyaltyTier={patronTier}
                withMotion
              />
              <div className="hidden lg:block text-left min-w-0">
                <span className="text-xs font-semibold text-[#25282D] dark:text-[#F7F8FA] block leading-tight truncate max-w-[170px] group-hover:text-[#C9A45C] dark:group-hover:text-[#E9D19E] transition-colors">
                  {patronName}
                </span>
                <span className="text-[10px] text-[#8792A2] dark:text-[#A0AEC0] font-medium flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-[#C9A45C] shrink-0 animate-pulse" />
                  <span className="truncate">{patronTier || 'Valued Member'}</span>
                </span>
              </div>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
