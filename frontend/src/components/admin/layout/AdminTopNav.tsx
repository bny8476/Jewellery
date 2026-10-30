import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Search, Bell, LogOut, ChevronDown, 
  Shield, ArrowLeft, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { LanguageSwitcherDropdown } from '../../LanguageSwitcher';
import ThemeToggle from '../../ThemeToggle';
import MetalRateWidget from '../MetalRateWidget';
import type { TabType } from '../../../pages/Admin';
import { AdminRole, ROLE_DEFINITIONS } from '../../../utils/rbac';
import { dropdownVariants } from '../../../utils/motion';
import { PlatformSwitcher } from '../PlatformSwitcher';
import type { PlatformId } from '../../../services/platformAccessService';

import { useNotifications } from '../../../context/NotificationContext';

interface AdminTopNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeRole: AdminRole;
  onChangeRole: (newRole: AdminRole) => void;
  activePlatform?: PlatformId;
  onChangePlatform?: (platform: PlatformId) => void;
  userEmail?: string;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar: () => void;
  onRefreshDashboard?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({
  activeTab,
  onSelectTab,
  activeRole,
  onChangeRole,
  activePlatform = 'all',
  onChangePlatform,
  userEmail,
  onLogout,
  onOpenNotifications,
  onOpenCommandPalette,
  onToggleMobileSidebar,
  onRefreshDashboard,
  isSidebarCollapsed,
  onToggleDesktopSidebar
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const currentRoleDef = ROLE_DEFINITIONS[activeRole];

  // Map activeTab to nice breadcrumb labels
  const tabNames: Record<TabType, { category: string; title: string }> = {
    dashboard: { category: 'Commercial', title: 'Executive Dashboard' },
    pos: { category: 'Commercial', title: 'Retail POS & GST Billing' },
    inventory: { category: 'Commercial', title: 'Products & Catalogue' },
    orders: { category: 'Commercial', title: 'Retail Orders' },
    online_requests: { category: 'Commercial', title: 'Online Appraisals' },
    rates: { category: 'Treasury', title: 'Live Metal Rates' },
    rate_comparison: { category: 'Treasury', title: 'Rate Comparison & Intelligence' },
    auragold: { category: 'Treasury', title: 'Aura Gold™ Vault' },
    giftcards: { category: 'Commercial', title: 'Gift Cards & Ledger' },
    diamonds: { category: 'Treasury', title: 'Certified Solitaire Vault' },
    master: { category: 'Treasury', title: 'Jewelry Inventory & SKU' },
    transaction: { category: 'Credit', title: 'Pawn Loans & Pledges' },
    purchases: { category: 'Procurement', title: 'Procurement & Suppliers' },
    bank: { category: 'Credit', title: 'Bank Pledges & Custody' },
    customer: { category: 'CRM', title: 'Customer CRM & KYC Suite' },
    kyc: { category: 'CRM', title: 'Customer KYC Verification' },
    campaigns: { category: 'Commercial', title: 'Festive Offers & Campaigns' },
    accounts: { category: 'Finance', title: 'Day Book & Accounts' },
    reports: { category: 'Finance', title: 'Financial Reports & Analytics' },
    users: { category: 'Governance', title: 'Staff Directory & Roles' },
    settings: { category: 'Governance', title: 'Settings & Security Audit' }
  };

  const currentMeta = tabNames[activeTab] || { category: 'Admin', title: 'Workspace' };

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-header)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-3 sm:px-5 lg:px-6 h-16 flex items-center transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-[1600px] mx-auto w-full min-w-0">
        
        {/* Left Side: Mobile Menu Toggle, Mobile Back & Breadcrumbs */}
        <div className="flex items-center space-x-2 min-w-0 shrink overflow-hidden">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] transition-colors shrink-0"
            title="Open Navigation Menu"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          {/* Desktop Sidebar Expand/Collapse Toggle */}
          {onToggleDesktopSidebar && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleDesktopSidebar}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] transition-colors shrink-0 cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar (Show Full Names)" : "Collapse Sidebar"}
              aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[var(--gold-primary)]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </motion.button>
          )}

          {/* Mobile Back Button when on a Subtab */}
          {activeTab !== 'dashboard' && (
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="lg:hidden p-2 rounded-xl text-[var(--gold-primary)] hover:text-[var(--text-main)] bg-[var(--bg-elevated)] border border-[var(--border-color)] transition-colors shrink-0"
              title="Return to Dashboard"
              aria-label="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Breadcrumb Navigation Trail */}
          <div className="hidden sm:flex items-center space-x-2 text-xs truncate">
            {activeTab !== 'dashboard' && (
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--gold-primary)] hover:border-[var(--gold-primary)]/60 text-xs font-semibold mr-1 transition-all cursor-pointer shadow-2xs group"
                title="Return to Executive Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Dashboard</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] font-medium shrink-0 transition-colors cursor-pointer"
            >
              YAZHINI Admin
            </button>
            <span className="text-[var(--text-muted)] shrink-0">/</span>
            <span className="text-[var(--text-main)] font-mono text-[11px] font-semibold uppercase tracking-wider shrink-0">{currentMeta.category}</span>
            <span className="text-[var(--text-muted)] shrink-0">/</span>
            <span className="text-[var(--gold-primary)] font-bold truncate max-w-[150px] md:max-w-[220px]">{currentMeta.title}</span>
          </div>
        </div>

        {/* Right Side: Global Search, Live Bullion Pill, Notifications, Theme, Language, Role, User */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Global Search Bar Button (Cmd + K) */}
          <motion.button
            whileHover={{ scale: 1.02, borderColor: 'var(--gold-primary)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCommandPalette}
            className="h-9 flex items-center space-x-2 px-2.5 sm:px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] text-xs transition-colors shadow-xs group shrink-0"
            title="Search commands, patrons, inventory (⌘K)"
          >
            <Search className="w-3.5 h-3.5 group-hover:text-[var(--gold-primary)] transition-colors shrink-0" />
            <span className="hidden lg:inline text-[11px] text-[var(--text-secondary)] font-medium">Search CRM &amp; Vault...</span>
            <kbd className="hidden 2xl:inline px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-[var(--bg-card)] text-[var(--text-secondary)] rounded border border-[var(--border-color)]">
              ⌘K
            </kbd>
          </motion.button>

          {/* Live Metal Rates Widget Pill */}
          <div className="hidden xl:flex items-center h-9 shrink-0">
            <MetalRateWidget onRatesUpdated={onRefreshDashboard} compact={true} />
          </div>

          {/* Operational Notifications Bell */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenNotifications}
            className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)] border border-[var(--border-color)] transition-colors shadow-xs"
            title="Operational Alerts"
            aria-label="Open notification center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[var(--gold-primary)] text-stone-900 font-bold text-[9px] flex items-center justify-center shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Theme & Language Controls */}
          <ThemeToggle className="h-9 w-9 !rounded-xl !p-0 !bg-[var(--bg-elevated)] !border-[var(--border-color)] hover:!bg-[var(--bg-card)] shadow-xs flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold-primary)]" />
          <LanguageSwitcherDropdown buttonClassName="h-9 flex items-center gap-1.5 px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs shadow-xs transition-colors" />

          {/* Centralized Multi-Platform Switcher */}
          {onChangePlatform && (
            <PlatformSwitcher
              activePlatform={activePlatform}
              onChangePlatform={onChangePlatform}
              variant="topNav"
            />
          )}

          {/* Role Switcher Pill & Dropdown */}
          <div className="relative shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border shadow-xs shrink-0"
              style={{ 
                backgroundColor: currentRoleDef?.badgeBg, 
                color: currentRoleDef?.color,
                borderColor: currentRoleDef?.color + '55'
              }}
              title="Click to switch RBAC Role for testing"
            >
              <Shield className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline-block max-w-[110px] truncate">{currentRoleDef?.label}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </motion.button>

            <AnimatePresence>
              {isRoleDropdownOpen && (
                <motion.div 
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute right-0 mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1"
                  onMouseLeave={() => setIsRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-[var(--border-color)] mb-1">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Role Permissions Matrix</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">Select role to verify access</p>
                  </div>

                  {Object.values(ROLE_DEFINITIONS).map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        onChangeRole(role.id);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                        activeRole === role.id 
                          ? 'bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/40' 
                          : 'hover:bg-[var(--bg-elevated)] border border-transparent'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block" style={{ color: role.color }}>
                          {role.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-[190px]">
                          {role.description}
                        </span>
                      </div>
                      {activeRole === role.id && (
                        <span className="text-[10px] font-bold text-[var(--gold-primary)]">Active</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu & Logout */}
          <div className="relative shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors shrink-0"
              aria-label="User executive menu"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {(userEmail || 'A').charAt(0).toUpperCase()}
              </div>
            </motion.button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div 
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2 z-50 text-xs text-[var(--text-secondary)] space-y-1"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[var(--border-color)]">
                    <p className="font-semibold text-[var(--text-main)] truncate">{userEmail || 'admin@luxury.com'}</p>
                    <p className="text-[10px] text-[var(--gold-primary)] uppercase font-mono font-bold mt-0.5">{currentRoleDef?.label}</p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab('settings');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
                  >
                    System Settings
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out Cleanly</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </header>
  );
};
