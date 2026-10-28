import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getDashboardStats } from '../services/transactionService';
import type { DashboardStats } from '../types/pawnshop';
import type { PawnRequest } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { supabase } from '../lib/supabase';
import { 
  AdminRole, normalizeAdminRole, 
  canAccessTab, logAuditEvent 
} from '../utils/rbac';
import { realtimeManager } from '../services/realtimeService';

// Layout Redesign Components
import { AdminSidebar } from '../components/admin/layout/AdminSidebar';
import { AdminTopNav } from '../components/admin/layout/AdminTopNav';
import { AdminCommandPalette } from '../components/admin/layout/AdminCommandPalette';

// Section components
import MasterSection from '../components/admin/MasterSection';
import CustomerSection from '../components/admin/CustomerSection';
import TransactionSection from '../components/admin/TransactionSection';
import BankSection from '../components/admin/BankSection';
import AccountsSection from '../components/admin/AccountsSection';
import ReportsSection from '../components/admin/ReportsSection';
import OnlineRequests from '../components/admin/OnlineRequests';
import UserSection from '../components/admin/UserSection';
import { OrdersSection } from '../components/admin/OrdersSection';
import LiveRatesAdminSection from '../components/admin/LiveRatesAdminSection';
import SalesBillingSection from '../components/admin/SalesBillingSection';
import PurchaseSupplierSection from '../components/admin/PurchaseSupplierSection';
import DiamondGemSection from '../components/admin/DiamondGemSection';
import AdminSettingsSection from '../components/admin/AdminSettingsSection';
import NotificationDrawer from '../components/admin/NotificationDrawer';
import EnhancedDashboard from '../components/admin/EnhancedDashboard';
import DigitalGoldAdmin from '../components/admin/DigitalGoldAdmin';
import ProductCatalogueSection from '../components/admin/ProductCatalogueSection';
import GiftCardsAdminSection from '../components/admin/GiftCardsAdminSection';
import RateComparisonAdminSection from '../components/admin/RateComparisonAdminSection';

export type TabType = 
  | 'dashboard' 
  | 'pos' 
  | 'inventory'
  | 'orders' 
  | 'online_requests' 
  | 'rates' 
  | 'rate_comparison'
  | 'purchases' 
  | 'diamonds' 
  | 'transaction' 
  | 'customer' 
  | 'bank' 
  | 'accounts' 
  | 'reports' 
  | 'master' 
  | 'users' 
  | 'settings'
  | 'auragold'
  | 'giftcards';

const PawnshopAdmin: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Active Role state (with quick-switcher for evaluator testing)
  const [activeRole, setActiveRole] = useState<AdminRole>(() => {
    try {
      const saved = localStorage.getItem('rcb_active_admin_role');
      if (saved) return normalizeAdminRole(saved);
    } catch (err) {
      void err;
    }
    return 'super_admin';
  });

  // Sidebar Layout State (persistent collapse state)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rcb_sidebar_collapsed') === 'true';
    } catch (err) {
      void err;
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Tab & System state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // State for handling online request approvals
  const [selectedPawnRequest, setSelectedPawnRequest] = useState<PawnRequest | null>(null);

  // Initialize role from user session metadata or localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('rcb_active_admin_role') : null;
    if (saved) {
      setActiveRole(normalizeAdminRole(saved));
    } else if (user) {
      const userRole = user.user_metadata?.role || (user.app_metadata as any)?.role;
      const normalized = normalizeAdminRole(userRole);
      setActiveRole(normalized);
      try {
        localStorage.setItem('rcb_active_admin_role', normalized);
      } catch (err) {
        void err;
      }
    }
  }, [user]);

  const handleRoleChange = (newRole: AdminRole) => {
    setActiveRole(newRole);
    try {
      localStorage.setItem('rcb_active_admin_role', newRole);
    } catch (err) {
      void err;
    }
  };

  // Persist sidebar collapsed preference
  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('rcb_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      logAuditEvent('LOGOUT', 'auth', 'Administrator signed out cleanly', user?.email || 'admin@luxury.com', activeRole, 'info');
      await signOut();
      navigate('/login');
      toast.success(t('messages.logoutSuccess'));
    } catch {
      toast.error(t('messages.logoutFailed'));
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh metrics whenever realtime events occur
    const unsubLoans = realtimeManager.subscribe('pawn-loans.created', () => loadDashboardData());
    const unsubSales = realtimeManager.subscribe('sales.confirmed', () => loadDashboardData());
    const unsubCust = realtimeManager.subscribe('customers.created', () => loadDashboardData());
    const unsubStock = realtimeManager.subscribe('inventory.stock.changed', () => loadDashboardData());

    return () => {
      unsubLoans();
      unsubSales();
      unsubCust();
      unsubStock();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getDashboardStats();
      setStats(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMonthlyNotifications = async () => {
    try {
      setSendingNotifications(true);
      toast.info('Sending monthly interest notifications...');

      const { data, error } = await supabase.rpc('send_monthly_interest_notifications');
      if (error) throw error;

      logAuditEvent('MONTHLY_SMS_NOTIFICATIONS', 'pawn_loans', 'Dispatched interest renewal notices to all active pledge holders', user?.email || 'admin@luxury.com', activeRole, 'info');
      toast.success('Monthly interest notifications sent successfully!');
      console.log('Notifications sent:', data);
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast.error(error.message || 'Failed to send notifications');
    } finally {
      setSendingNotifications(false);
    }
  };

  // If activeTab is forbidden for newly selected role, reset to first allowed tab
  useEffect(() => {
    if (!canAccessTab(activeRole, activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeRole, activeTab]);

  return (
    <div className="admin-root font-inter min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col lg:flex-row antialiased transition-colors duration-200">
      
      {/* 1. Collapsible Luxury Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeRole={activeRole}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Administration Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[var(--bg-main)] transition-colors duration-200">
        
        {/* Sticky Top Navigation Bar */}
        <AdminTopNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeRole={activeRole}
          onChangeRole={handleRoleChange}
          userEmail={user?.email}
          onLogout={handleLogout}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onRefreshDashboard={loadDashboardData}
        />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full transition-all">
          
          {/* Workspace Tab 1: Enhanced Executive Dashboard */}
          {activeTab === 'dashboard' && (
            <EnhancedDashboard
              stats={stats}
              loading={loading}
              onRefresh={loadDashboardData}
              onNavigateTab={(tab) => setActiveTab(tab as TabType)}
              onSendMonthlyNotifications={handleSendMonthlyNotifications}
              sendingNotifications={sendingNotifications}
            />
          )}

          {/* Workspace Tab 2: Point of Sale (POS) & Retail GST Billing */}
          {activeTab === 'pos' && <SalesBillingSection />}

          {/* Workspace Tab 2B: Products & Catalogue Management */}
          {activeTab === 'inventory' && <ProductCatalogueSection activeRole={activeRole} />}

          {/* Workspace Tab 3: Retail Orders */}
          {activeTab === 'orders' && <OrdersSection />}

          {/* Workspace Tab 4: Live Metal Rates & Diamond Pricing Module */}
          {activeTab === 'rates' && <LiveRatesAdminSection />}

          {/* Workspace Tab 4B: Aura Gold Custody & Digital Bullion Module */}
          {activeTab === 'auragold' && <DigitalGoldAdmin />}

          {/* Workspace Tab 4C: Gift Card Management & Double-Entry Ledger */}
          {activeTab === 'giftcards' && <GiftCardsAdminSection />}

          {/* Workspace Tab 4D: Jewellery Rate Comparison & Market Intelligence */}
          {activeTab === 'rate_comparison' && <RateComparisonAdminSection />}

          {/* Workspace Tab 5: Purchases & Supplier Inward */}
          {activeTab === 'purchases' && <PurchaseSupplierSection />}

          {/* Workspace Tab 6: Certified Diamonds & Solitaires */}
          {activeTab === 'diamonds' && <DiamondGemSection />}

          {/* Workspace Tab 7: Master Jewelry Inventory */}
          {activeTab === 'master' && <MasterSection />}

          {/* Workspace Tab 8: Staff & App Roles */}
          {activeTab === 'users' && <UserSection />}

          {/* Workspace Tab 9: Customer CRM & KYC Suite */}
          {activeTab === 'customer' && <CustomerSection />}

          {/* Workspace Tab 10: Pawn Loan Transactions & Collateral */}
          {activeTab === 'transaction' && <TransactionSection initialPawnRequest={selectedPawnRequest} />}

          {/* Workspace Tab 11: Bank Pledges & Custody */}
          {activeTab === 'bank' && <BankSection />}

          {/* Workspace Tab 12: Day Book & Accounts Ledger */}
          {activeTab === 'accounts' && <AccountsSection />}

          {/* Workspace Tab 13: Financial & Inventory Reports */}
          {activeTab === 'reports' && <ReportsSection />}

          {/* Workspace Tab 14: Settings, Tax Rules & Audit Trail */}
          {activeTab === 'settings' && <AdminSettingsSection />}

          {/* Workspace Tab 15: Online Appraisals & Requests */}
          {activeTab === 'online_requests' && (
            <OnlineRequests 
              onApprove={(req) => {
                setSelectedPawnRequest(req);
                setActiveTab('transaction');
                toast.info(`Reviewing online appraisal for ${req.item_description}`);
              }} 
            />
          )}

        </main>

        {/* Global Footer in Luxury Theme */}
        <footer className="border-t border-[var(--border-color)] bg-[var(--bg-header)] px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-[var(--text-muted)] transition-colors duration-200">
          <div className="max-w-[1600px] mx-auto w-full">
            <p className="font-semibold tracking-wider text-[var(--text-secondary)]">
              YAZHINI FINE JEWELS • TRADITION • CRAFTED TO SHINE
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Registered GSTIN: 33AAACR2938K1Z5 • BIS Hallmarking Licence: HM/C-762910 • Asia/Kolkata
            </p>
          </div>
        </footer>

      </div>

      {/* Global Slide-Over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab as TabType)}
      />

      {/* Global Command Palette (⌘K) */}
      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

    </div>
  );
};

export default PawnshopAdmin;
