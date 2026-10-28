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
  Headphones, 
  Shield, 
  LogOut, 
  X, 
  ChevronRight,
  Gift
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
  user?: User | null;
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
  user: _user,
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
  unreadCount: _unreadCount = 2
}) => {
  const navItems: NavItemConfig[] = [
    { id: 'overview', label: 'Account Overview', icon: Sparkles },
    { id: 'orders', label: 'My Orders', icon: Package, badge: ordersCount > 0 ? ordersCount : null },
    { id: 'track', label: 'Live Tracking', icon: Truck },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, badge: wishlistCount > 0 ? wishlistCount : null, badgeColor: 'bg-[#25282D] text-white' },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, badge: addressesCount > 0 ? addressesCount : null },
    { id: 'profile', label: 'Patron Profile', icon: UserCheck },
    { 
      id: 'vault', 
      label: 'Aura Gold™ Vault', 
      icon: Coins, 
      badge: vaultGrams > 0 ? `${vaultGrams.toFixed(2)}g` : null,
      badgeColor: 'bg-[#FAF3E8] border border-[#C9A45C]/40 text-[#25282D]' 
    },
    { id: 'loans', label: 'Collateral Loans', icon: Scale, badge: loansCount > 0 ? loansCount : null },
    { id: 'giftcards', label: 'My Gift Cards', icon: Gift },
    { id: 'transactions', label: 'Transactions Ledger', icon: History },
    { id: 'support', label: 'Patron Concierge', icon: Headphones },
    { id: 'settings', label: 'Security & Settings', icon: Shield }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E7EB]">
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8792A2]">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-[#25282D] text-white shadow-xs'
                  : 'text-[#343A40] hover:text-[#25282D] hover:bg-[#F3F4F6]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-[#C9A45C]' : 'text-[#8792A2] group-hover:text-[#25282D]'
                }`} />
                <span className="font-sans">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] border border-[#E5E7EB] text-[#25282D]')
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#C9A45C]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Sign Out */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#F3F4F6]/50">
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-[#8792A2] hover:text-rose-600 hover:bg-rose-50 transition-all border border-[#E5E7EB] hover:border-rose-200 cursor-pointer shadow-xs bg-white"
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
            className="fixed inset-0 bg-[#25282D]/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-4/5 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            <button
              onClick={onCloseMobile}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-md bg-[#F3F4F6] text-[#8792A2] hover:text-[#25282D]"
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
