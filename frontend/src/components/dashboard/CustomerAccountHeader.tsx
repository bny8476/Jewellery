import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  Bell, 
  Sun, 
  Moon, 
  ArrowLeft, 
  Menu, 
  Sparkles, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useRates } from '../../context/RateContext';
import { useTheme } from '../../context/ThemeContext';
import type { User } from '@supabase/supabase-js';

interface CustomerAccountHeaderProps {
  user: User | null;
  activeTabTitle: string;
  onSelectTab: (tab: string) => void;
  onToggleMobileSidebar: () => void;
  onSignOut: () => void;
  unreadCount?: number;
}

export const CustomerAccountHeader: React.FC<CustomerAccountHeaderProps> = ({
  user,
  activeTabTitle,
  onSelectTab,
  onToggleMobileSidebar,
  onSignOut,
  unreadCount = 2
}) => {
  const { wishlist } = useWishlist();
  const { totalItems } = useCart();
  const { rates } = useRates();
  const { theme, toggleTheme } = useTheme();

  const liveGold24K = rates?.gold || 14928;
  const patronName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Patron';

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

          {/* Notifications Shortcut */}
          <button
            type="button"
            onClick={() => onSelectTab('notifications')}
            className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Notifications"
            title="Account Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

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
              className="flex items-center gap-2 group text-left"
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

            {/* Quick Sign Out */}
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-1"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
