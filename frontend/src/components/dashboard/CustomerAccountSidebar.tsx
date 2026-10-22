import React from 'react';
import { 
  Sparkles, 
  Package, 
  Truck, 
  Heart, 
  MapPin, 
  UserCheck, 
  Coins, 
  Scale, 
  History, 
  Bell, 
  Headphones, 
  Shield, 
  LogOut, 
  X, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
}

interface CustomerAccountSidebarProps {
  user: User | null;
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
  ordersCount?: number;
  wishlistCount?: number;
  addressesCount?: number;
  vaultGrams?: number;
  loansCount?: number;
  unreadCount?: number;
}

export const CustomerAccountSidebar: React.FC<CustomerAccountSidebarProps> = ({
  user,
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onSignOut,
  ordersCount = 0,
  wishlistCount = 0,
  addressesCount = 1,
  vaultGrams = 0,
  loansCount = 0,
  unreadCount = 2
}) => {
  const patronName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patron';
  const patronEmail = user?.email || 'patron@yazhini.com';
  const clientId = `YZ-${(user?.id || 'DEMO').slice(0, 8).toUpperCase()}`;

  const navItems: NavItemConfig[] = [
    { id: 'overview', label: 'Account Overview', icon: Sparkles },
    { id: 'orders', label: 'My Orders', icon: Package, badge: ordersCount > 0 ? ordersCount : null },
    { id: 'track', label: 'Live Tracking', icon: Truck },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, badge: wishlistCount > 0 ? wishlistCount : null, badgeColor: 'bg-[#702638] text-white' },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, badge: addressesCount > 0 ? addressesCount : null },
    { id: 'profile', label: 'Patron Profile', icon: UserCheck },
    { 
      id: 'vault', 
      label: 'Aura Gold™ Vault', 
      icon: Coins, 
      badge: vaultGrams > 0 ? `${vaultGrams.toFixed(2)}g` : null,
      badgeColor: 'bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]' 
    },
    { id: 'loans', label: 'Collateral Loans', icon: Scale, badge: loansCount > 0 ? loansCount : null },
    { id: 'transactions', label: 'Transactions Ledger', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null, badgeColor: 'bg-amber-500 text-black' },
    { id: 'support', label: 'Patron Concierge', icon: Headphones },
    { id: 'settings', label: 'Security & Settings', icon: Shield }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border-r border-[var(--border-color)]">
      {/* Patron Header Profile Card */}
      <div className="p-5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#702638] via-[#450817] to-[#2B0B13] border border-[#D4AF37]/40 flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
            {patronName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-serif font-bold text-sm text-[var(--text-main)] truncate">
              {patronName}
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              {patronEmail}
            </p>
          </div>
        </div>

        {/* Client ID & Tier badge */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-[10px]">
          <span className="font-mono text-[var(--text-secondary)] font-semibold">
            {clientId}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--gold-primary)] px-2 py-0.5 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30">
            <ShieldCheck className="w-3 h-3" /> Royal Gold Tier
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--text-secondary)]">
          Account Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-[#702638] to-[#450817] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-[#D8B878]' : 'text-[var(--text-secondary)]'
                }`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)]')
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#D8B878]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Sign Out */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-elevated)]/40">
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-white hover:bg-rose-600 transition-all border border-rose-500/20 hover:border-transparent cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Width: 260px) */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-4/5 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            <button
              onClick={onCloseMobile}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
