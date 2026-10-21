import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Search, Bell, LogOut, ChevronDown, 
  Shield
} from 'lucide-react';
import { LanguageSwitcherDropdown } from '../../LanguageSwitcher';
import ThemeToggle from '../../ThemeToggle';
import MetalRateWidget from '../MetalRateWidget';
import type { TabType } from '../../../pages/Admin';
import { AdminRole, ROLE_DEFINITIONS } from '../../../utils/rbac';
import { dropdownVariants } from '../../../utils/motion';

interface AdminTopNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeRole: AdminRole;
  onChangeRole: (newRole: AdminRole) => void;
  userEmail?: string;
  onLogout: () => void;
  onOpenNotifications: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar: () => void;
  onRefreshDashboard?: () => void;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({
  activeTab,
  onSelectTab,
  activeRole,
  onChangeRole,
  userEmail,
  onLogout,
  onOpenNotifications,
  onOpenCommandPalette,
  onToggleMobileSidebar,
  onRefreshDashboard
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentRoleDef = ROLE_DEFINITIONS[activeRole];

  // Map activeTab to nice breadcrumb labels
  const tabNames: Record<TabType, { category: string; title: string }> = {
    dashboard: { category: 'Commercial', title: 'Executive Dashboard' },
    pos: { category: 'Commercial', title: 'Retail POS & GST Billing' },
    orders: { category: 'Commercial', title: 'Retail Orders' },
    online_requests: { category: 'Commercial', title: 'Online Appraisals' },
    rates: { category: 'Treasury', title: 'Live Metal Rates' },
    auragold: { category: 'Treasury', title: 'Aura Gold™ Vault' },
    diamonds: { category: 'Treasury', title: 'Certified Solitaire Vault' },
    master: { category: 'Treasury', title: 'Jewelry Inventory & SKU' },
    transaction: { category: 'Credit', title: 'Pawn Loans & Pledges' },
    purchases: { category: 'Procurement', title: 'Procurement & Suppliers' },
    bank: { category: 'Credit', title: 'Bank Pledges & Custody' },
    customer: { category: 'CRM', title: 'Customer CRM & KYC Suite' },
    accounts: { category: 'Finance', title: 'Day Book & Accounts' },
    reports: { category: 'Finance', title: 'Financial Reports & Analytics' },
    users: { category: 'Governance', title: 'Staff Directory & Roles' },
    settings: { category: 'Governance', title: 'Settings & Security Audit' }
  };

  const currentMeta = tabNames[activeTab] || { category: 'Admin', title: 'Workspace' };

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-header)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-3 sm:px-5 lg:px-6 h-16 flex items-center transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-[1600px] mx-auto w-full min-w-0">
        
        {/* Left Side: Mobile Menu Toggle & Breadcrumbs */}
        <div className="flex items-center space-x-2.5 min-w-0 shrink overflow-hidden">
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

          {/* Breadcrumb Navigation Trail */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs truncate">
            <span className="text-[var(--text-muted)] font-medium shrink-0">YAZHINI Admin</span>
            <span className="text-[var(--text-muted)] opacity-60 shrink-0">/</span>
            <span className="text-[var(--text-secondary)] font-mono text-[11px] uppercase tracking-wider shrink-0">{currentMeta.category}</span>
            <span className="text-[var(--text-muted)] opacity-60 shrink-0">/</span>
            <span className="text-[var(--gold-primary)] font-semibold truncate max-w-[150px] md:max-w-[220px]">{currentMeta.title}</span>
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
            <span className="hidden lg:inline text-[11px] text-[var(--text-secondary)]">Search CRM &amp; Vault...</span>
            <kbd className="hidden 2xl:inline px-1.5 py-0.5 text-[9px] font-mono bg-[var(--bg-card)] text-[var(--text-muted)] rounded border border-[var(--border-color)]">
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
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--gold-primary)] text-stone-900 font-bold text-[9px] flex items-center justify-center shadow-xs">
              3
            </span>
          </motion.button>

          {/* Theme & Language Controls */}
          <ThemeToggle className="h-9 w-9 !rounded-xl !p-0 !bg-[var(--bg-elevated)] !border-[var(--border-color)] hover:!bg-[var(--bg-card)] shadow-xs flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold-primary)]" />
          <LanguageSwitcherDropdown buttonClassName="h-9 flex items-center gap-1.5 px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs shadow-xs transition-colors" />

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
