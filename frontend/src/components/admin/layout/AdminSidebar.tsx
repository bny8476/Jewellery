import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, TrendingUp, Gem, 
  Truck, DollarSign, 
  BarChart3, Database, Settings, Shield, ChevronLeft, 
  ChevronRight, X, Coins, Activity, Package, Users
} from 'lucide-react';
import type { TabType } from '../../../pages/Admin';
import { AdminRole, canAccessTab } from '../../../utils/rbac';
import { drawerLeftVariants, modalBackdropVariants } from '../../../utils/motion';

interface AdminSidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeRole: AdminRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavGroup {
  groupName: string;
  items: Array<{
    id: TabType;
    label: string;
    icon: any;
    badge?: string;
  }>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  activeRole,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'COMMERCIAL & POS',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingBag, badge: 'BIS' },
        { id: 'orders', label: 'Retail Orders', icon: Package },
        { id: 'online_requests', label: 'Online Appraisals', icon: TrendingUp }
      ]
    },
    {
      groupName: 'TREASURY & VAULT',
      items: [
        { id: 'rates', label: 'Live Metal Rates', icon: Activity, badge: '9 AM' },
        { id: 'diamonds', label: 'Certified Solitaires', icon: Gem },
        { id: 'master', label: 'Jewelry Inventory', icon: Database }
      ]
    },
    {
      groupName: 'CREDIT & PROCUREMENT',
      items: [
        { id: 'transaction', label: 'Pawn Loans & Pledges', icon: Coins },
        { id: 'purchases', label: 'Procurement & Suppliers', icon: Truck },
        { id: 'bank', label: 'Bank Pledges Custody', icon: Gem }
      ]
    },
    {
      groupName: 'CRM & FINANCIALS',
      items: [
        { id: 'customer', label: 'Customer CRM & KYC', icon: Users, badge: 'CRM' },
        { id: 'accounts', label: 'Day Book & Ledger', icon: DollarSign },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 }
      ]
    },
    {
      groupName: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'users', label: 'Staff & Roles', icon: Shield },
        { id: 'settings', label: 'Settings & Security', icon: Settings }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] text-[var(--text-secondary)] select-none transition-colors duration-200">
      
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-header)] transition-colors duration-200">
        <div className="flex items-center space-x-3 overflow-hidden">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-black flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] shrink-0 border border-amber-300 cursor-pointer"
          >
            <Gem className="w-5 h-5 text-black" />
          </motion.div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="font-serif font-bold text-[var(--text-main)] text-base tracking-wider truncate leading-tight">
                RCB JEWELRY’S
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-[var(--gold-primary)] font-medium truncate mt-0.5">
                TRUST • TRADITION • BEAUTY
              </p>
            </motion.div>
          )}
        </div>

        {/* Mobile close button */}
        <button 
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
          aria-label="Close navigation drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 scrollbar-none">
        {navGroups.map((group, groupIdx) => {
          // Filter items by active role permissions
          const accessibleItems = group.items.filter(item => canAccessTab(activeRole, item.id));
          if (accessibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <span className="text-[10px] font-bold font-mono tracking-wider text-[var(--text-muted)] px-3 uppercase block mb-1.5">
                  {group.groupName}
                </span>
              )}

              {accessibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    whileHover={{ x: isCollapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.98 }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center rounded-xl text-xs font-medium transition-colors group relative ${
                      isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5 space-x-3'
                    } ${
                      isActive 
                        ? 'text-[var(--gold-primary)] font-semibold shadow-sm' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    {/* Active Sliding Background Pill (LayoutId) */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/35 rounded-xl"
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      />
                    )}

                    {/* Active Left Gold Accent Bar */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabAccent"
                        className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--gold-primary)] rounded-r-full shadow-[0_0_10px_rgba(198,161,91,0.5)]" 
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      />
                    )}

                    <Icon className={`w-4 h-4 shrink-0 transition-colors relative z-10 ${
                      isActive ? 'text-[var(--gold-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-main)]'
                    }`} />

                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between text-left truncate relative z-10">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--gold-primary)]/15 text-[var(--gold-primary)] border border-[var(--gold-primary)]/25 font-bold ml-1.5">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse / Expand Toggle Control (Desktop Only) */}
      <div className="p-3 border-t border-[var(--border-color)] hidden lg:flex items-center justify-between bg-[var(--bg-header)] shrink-0 transition-colors duration-200">
        {!isCollapsed && (
          <span className="text-[10px] text-[var(--text-muted)] font-mono tracking-tight pl-2">
            v2.6 Luxury ERP
          </span>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border-color)] mx-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </motion.button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar with Smooth Width Animation */}
      <motion.aside 
        animate={{ width: isCollapsed ? 74 : 260 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block shrink-0"
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          {sidebarContent}
        </div>
      </motion.aside>

      {/* Mobile Drawer Slide-over with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div 
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              variants={drawerLeftVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
