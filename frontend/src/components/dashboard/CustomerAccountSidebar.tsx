import React, { useState } from 'react';
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
  ChevronLeft,
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

export interface CustomerAccountSidebarProps {
  user?: User | null;
  customerName?: string;
  customerGender?: string;
  customerPhotoUrl?: string;
  customerTier?: string;
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CustomerAccountSidebar: React.FC<CustomerAccountSidebarProps> = ({
  user: _user,
  customerName: _customerName,
  customerGender: _customerGender,
  customerPhotoUrl: _customerPhotoUrl,
  customerTier: _customerTier,
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
  unreadCount: _unreadCount = 2,
  isCollapsed: isCollapsedProp,
  onToggleCollapse: onToggleCollapseProp
}) => {
  // Local state initialized from localStorage for persistence
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('rcb-customer-sidebar-collapsed') === 'true';
      }
    } catch {}
    return false;
  });

  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : internalCollapsed;

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setInternalCollapsed(nextState);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('rcb-customer-sidebar-collapsed', String(nextState));
      }
    } catch {}
    if (onToggleCollapseProp) {
      onToggleCollapseProp();
    }
  };

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

  const renderSidebar = (collapsed: boolean, isMobileDrawer = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-[#111317] border-r border-[#E5E7EB] dark:border-[#222733] transition-colors select-none">
      
      {/* Top Header with Collapse/Expand Toggle Button (desktop only) */}
      {!isMobileDrawer && (
        <div className={`p-3 border-b border-[#E5E7EB] dark:border-[#222733] flex items-center ${collapsed ? 'justify-center' : 'justify-between'} bg-gradient-to-r from-[#FAF8F5] to-white dark:from-[#181B22] dark:to-[#13151A] transition-colors`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-5 h-5 rounded-md bg-[#25282D] dark:bg-[#181B22] border border-[#C9A45C]/40 flex items-center justify-center text-[10px] font-bold text-[#D8B878]">
                  Y
                </div>
                <span className="text-[10px] font-inter font-bold tracking-[0.2em] uppercase text-[#8792A2] dark:text-[#8D96A5] truncate">
                  Navigation
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleCollapse}
                className="p-1.5 rounded-lg text-[#8792A2] hover:text-[#25282D] dark:text-[#8D96A5] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors cursor-pointer group"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="p-1.5 rounded-lg text-[#8792A2] hover:text-[#25282D] dark:text-[#8D96A5] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors cursor-pointer group relative flex items-center justify-center"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4 text-[#C9A45C] dark:text-[#D8B878] transition-transform group-hover:translate-x-0.5" />
              <div 
                role="tooltip"
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[#25282D] dark:bg-[#1C2029] text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 dark:border-[#222733] z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-x-1 group-hover:translate-x-0 flex items-center gap-1.5"
              >
                <span>Expand sidebar</span>
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#25282D] dark:bg-[#1C2029] rotate-45 border-l border-b border-white/10 dark:border-[#222733]" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Navigation List */}
      <div className={`flex-1 ${collapsed ? 'overflow-visible' : 'overflow-y-auto scrollbar-thin'} p-3 space-y-1`}>
        {!collapsed ? (
          <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8792A2] dark:text-[#6C7689]">
            Account Navigation
          </div>
        ) : (
          <div className="mx-2 my-1 border-t border-[#E5E7EB] dark:border-[#222733]" />
        )}

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (collapsed) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                title={item.badge !== null && item.badge !== undefined ? `${item.label} (${item.badge})` : item.label}
                aria-label={item.label}
                className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-[#25282D] dark:bg-[#1D212A] text-white dark:text-[#F7F8FA] shadow-xs border border-transparent dark:border-[#C9A45C]/30'
                    : 'text-[#343A40] hover:text-[#25282D] hover:bg-[#F3F4F6] dark:text-[#A0AEC0] dark:hover:text-[#F7F8FA] dark:hover:bg-[#181B22]'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-[#C9A45C] dark:text-[#D8B878]' : 'text-[#8792A2] group-hover:text-[#25282D] dark:text-[#8D96A5] dark:group-hover:text-[#D8B878]'
                }`} />

                {/* Active left indicator line */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#C9A45C] dark:bg-[#D8B878] rounded-r-full shadow-[0_0_8px_rgba(201,164,92,0.5)]" />
                )}

                {/* Collapsed Badge Dot Indicator */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C9A45C] ring-2 ring-white dark:ring-[#111317]" />
                )}

                {/* Floating Tooltip */}
                <div 
                  role="tooltip"
                  className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#25282D] dark:bg-[#1C2029] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-white/10 dark:border-[#222733] z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-x-1 group-hover:translate-x-0 flex items-center gap-2"
                >
                  <span className="font-sans">{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A45C]/20 text-[#D8B878] border border-[#C9A45C]/40">
                      {item.badge}
                    </span>
                  )}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#25282D] dark:bg-[#1C2029] rotate-45 border-l border-b border-white/10 dark:border-[#222733]" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-[#25282D] dark:bg-[#1D212A] text-white dark:text-[#F7F8FA] shadow-xs border border-transparent dark:border-[#C9A45C]/30'
                  : 'text-[#343A40] hover:text-[#25282D] hover:bg-[#F3F4F6] dark:text-[#A0AEC0] dark:hover:text-[#F7F8FA] dark:hover:bg-[#181B22]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-[#C9A45C] dark:text-[#D8B878]' : 'text-[#8792A2] group-hover:text-[#25282D] dark:text-[#8D96A5] dark:group-hover:text-[#D8B878]'
                }`} />
                <span className="font-sans">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#262B36] text-[#25282D] dark:text-[#D2D7E2]')
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#C9A45C] dark:text-[#D8B878]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Pinned Section: Sign Out Action */}
      <div className="mt-auto border-t border-[#E5E7EB] dark:border-[#222733] bg-gradient-to-t from-[#FAF8F5] to-white dark:from-[#181B22] dark:to-[#111317] shrink-0">
        {!collapsed ? (
          /* Bottom Actions Row: Sign Out */
          <div className="p-3">
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-[#8792A2] dark:text-[#A0AEC0] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-[#E5E7EB] dark:border-[#222733] hover:border-rose-200 dark:hover:border-rose-900/40 cursor-pointer shadow-xs bg-white dark:bg-[#181B22]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        ) : (
          /* Collapsed Bottom Footer */
          <div className="p-2.5 flex flex-col items-center">
            {/* Collapsed Sign Out with Tooltip */}
            <button
              onClick={onSignOut}
              title="Sign Out of Portal"
              aria-label="Sign Out of Portal"
              className="p-2 rounded-xl text-[#8792A2] dark:text-[#A0AEC0] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-[#E5E7EB] dark:border-[#222733] hover:border-rose-200 dark:hover:border-rose-900/40 cursor-pointer shadow-xs bg-white dark:bg-[#181B22] group relative flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
              <div 
                role="tooltip"
                className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#25282D] dark:bg-[#1C2029] text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 dark:border-[#222733] z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-x-1 group-hover:translate-x-0 flex items-center gap-1.5"
              >
                <span>Sign Out of Portal</span>
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#25282D] dark:bg-[#1C2029] rotate-45 border-l border-b border-white/10 dark:border-[#222733]" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Width: 260px expanded, 72px collapsed) */}
      <aside 
        className={`hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
        aria-expanded={!isCollapsed}
        data-collapsed={isCollapsed ? 'true' : 'false'}
      >
        {renderSidebar(isCollapsed, false)}
      </aside>

      {/* Mobile Drawer Overlay (Always expanded for accessible touch navigation) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-[#25282D]/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-4/5 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            <button
              onClick={onCloseMobile}
              className="absolute top-3.5 right-3.5 z-20 p-1.5 rounded-lg bg-[#F3F4F6] dark:bg-[#181B22] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
            {renderSidebar(false, true)}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerAccountSidebar;

