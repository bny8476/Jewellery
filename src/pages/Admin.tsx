import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Database, Users, FileText, Building2,
  DollarSign, BarChart3, Settings, TrendingUp,
  Gem, Plus, LogOut, Bell, ShoppingBag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDashboardStats } from '../services/transactionService';
import type { DashboardStats, PawnRequest } from '../types/pawnshop';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { supabase } from '../lib/supabase';
import { LanguageSwitcherDropdown } from '../components/LanguageSwitcher';
import MetalRateWidget from '../components/admin/MetalRateWidget';
import ThemeToggle from '../components/ThemeToggle';
import { formatCurrencyINR } from '../utils/formatters';

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

type TabType = 'dashboard' | 'orders' | 'online_requests' | 'master' | 'customer' | 'users' | 'transaction' | 'bank' | 'accounts' | 'reports';

const PawnshopAdmin: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingNotifications, setSendingNotifications] = useState(false);

  // State for handling online request approvals
  const [selectedPawnRequest, setSelectedPawnRequest] = useState<PawnRequest | null>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
      toast.success(t('messages.logoutSuccess'));
    } catch {
      toast.error(t('messages.logoutFailed'));
    }
  };

  useEffect(() => {
    loadDashboardData();
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

      toast.success('Monthly interest notifications sent successfully!');
      console.log('Notifications sent:', data);
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast.error(error.message || 'Failed to send notifications');
    } finally {
      setSendingNotifications(false);
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: t('admin.dashboard'), icon: LayoutDashboard },
    { id: 'orders' as TabType, label: 'Retail Orders', icon: ShoppingBag },
    { id: 'online_requests' as TabType, label: 'Online Requests', icon: TrendingUp },
    { id: 'transaction' as TabType, label: t('admin.transaction'), icon: FileText },
    { id: 'customer' as TabType, label: t('admin.customer'), icon: Users },
    { id: 'bank' as TabType, label: t('admin.bank'), icon: Building2 },
    { id: 'accounts' as TabType, label: t('admin.accounts'), icon: DollarSign },
    { id: 'reports' as TabType, label: t('admin.reports'), icon: BarChart3 },
    { id: 'master' as TabType, label: t('admin.master'), icon: Database },
    { id: 'users' as TabType, label: 'Users', icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <Gem className="h-10 w-10 text-[var(--gold-primary)] mx-auto mb-3 animate-pulse" />
          <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Brand Title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--gold-primary)]">
                <Gem className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-main)] leading-tight">{t('admin.title')}</h1>
                <p className="text-xs text-[var(--text-secondary)]">{t('admin.subtitle')}</p>
              </div>
            </div>

            {/* Header Right Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <MetalRateWidget onRatesUpdated={loadDashboardData} />
              
              <div className="h-6 w-px bg-[var(--border-color)] hidden sm:block" />
              
              <ThemeToggle />
              <LanguageSwitcherDropdown />
              
              {user && (
                <div className="text-right hidden lg:block pl-1">
                  <p className="text-xs font-semibold text-[var(--text-main)] max-w-[180px] truncate">{user.email}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--gold-primary)] font-bold">{t('admin.administrator')}</p>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-[var(--border-color)]"
                title={t('common.logout')}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Structured Navigation Tabs */}
      <nav className="bg-[var(--bg-card)] border-b border-[var(--border-color)] overflow-x-auto" aria-label="Admin Sections">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 min-w-max py-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[var(--gold-primary)] text-black shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[var(--text-main)]">Operational Overview</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Real-time ledger summary and key performance indicators.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live System Active
              </div>
            </div>

            {/* Structured Stats Grid (No noisy colored left borders) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Active Pledges */}
              <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm hover:border-[var(--gold-primary)]/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Active Pledges</p>
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--text-main)] tabular-nums">{stats?.total_active_pledges || 0}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">Secured vaults in custody</p>
              </div>

              {/* Total Loan Portfolio */}
              <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm hover:border-[var(--gold-primary)]/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t('admin.totalLoanAmount')}</p>
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--gold-primary)]">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--gold-primary)] tabular-nums">{formatCurrencyINR(stats?.total_loan_amount || 0)}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">Outstanding collateral principal</p>
              </div>

              {/* Registered Customers */}
              <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm hover:border-[var(--gold-primary)]/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t('admin.totalCustomers')}</p>
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--text-main)] tabular-nums">{stats?.total_customers || 0}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">KYC verified accounts</p>
              </div>

              {/* Liquid Cash in Hand */}
              <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm hover:border-[var(--gold-primary)]/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t('admin.cashInHand')}</p>
                  <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-emerald-500">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--text-main)] tabular-nums">{formatCurrencyINR(stats?.cash_in_hand || 0)}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">Branch settlement float</p>
              </div>
            </div>

            {/* Daily Operational Activity & Quick Dispatch */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Today's Activity */}
              <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border-color)]">
                  <h3 className="text-base font-semibold text-[var(--text-main)]">{t('admin.todaysActivity')}</h3>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Today's Transactions</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Plus className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-[var(--text-main)]">{t('admin.newPledges')}</span>
                        <p className="text-[11px] text-[var(--text-secondary)]">New collateral contracts issued today</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-emerald-500 tabular-nums">{stats?.today_pledges || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-[var(--text-main)]">{t('admin.returns')}</span>
                        <p className="text-[11px] text-[var(--text-secondary)]">Settled &amp; redeemed contracts</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-sky-500 tabular-nums">{stats?.today_returns || 0}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions (Unified, Professional Buttons) */}
              <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border-color)]">
                  <h3 className="text-base font-semibold text-[var(--text-main)]">{t('admin.quickActions')}</h3>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Direct Dispatch</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('transaction')}
                    className="p-3.5 rounded-xl bg-[var(--gold-primary)] text-black hover:brightness-105 active:scale-95 text-left transition-all shadow-sm group"
                  >
                    <Plus className="h-5 w-5 mb-2" />
                    <p className="font-semibold text-xs">{t('admin.newPledge')}</p>
                    <span className="text-[10px] text-black/70 block mt-0.5">Issue loan contract</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('customer')}
                    className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] text-left transition-colors"
                  >
                    <Users className="h-5 w-5 mb-2 text-[var(--gold-primary)]" />
                    <p className="font-semibold text-xs">{t('admin.addCustomer')}</p>
                    <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">KYC registration</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] text-left transition-colors"
                  >
                    <BarChart3 className="h-5 w-5 mb-2 text-[var(--gold-primary)]" />
                    <p className="font-semibold text-xs">{t('admin.viewReports')}</p>
                    <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">Audit &amp; reconciliation</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('master')}
                    className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] text-left transition-colors"
                  >
                    <Settings className="h-5 w-5 mb-2 text-[var(--gold-primary)]" />
                    <p className="font-semibold text-xs">{t('admin.masterData')}</p>
                    <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">Configuration</span>
                  </button>

                  <button
                    onClick={handleSendMonthlyNotifications}
                    disabled={sendingNotifications}
                    className="col-span-2 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-center transition-colors font-semibold text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Bell className={`h-4 w-4 ${sendingNotifications ? 'animate-pulse' : ''}`} />
                    <span>{sendingNotifications ? 'Dispatching Notifications...' : 'Send Monthly Interest Due Notifications'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && <OrdersSection />}
        {activeTab === 'master' && <MasterSection />}
        {activeTab === 'users' && <UserSection />}
        {activeTab === 'customer' && <CustomerSection />}
        {activeTab === 'transaction' && <TransactionSection initialPawnRequest={selectedPawnRequest} />}
        {activeTab === 'bank' && <BankSection />}
        {activeTab === 'accounts' && <AccountsSection />}
        {activeTab === 'reports' && <ReportsSection />}
        {activeTab === 'online_requests' && <OnlineRequests onApprove={(req) => {
          setSelectedPawnRequest(req);
          setActiveTab('transaction');
          toast.info(`Reviewing request for ${req.item_description}`);
        }} />}
      </main>
    </div>
  );
};

export default PawnshopAdmin;
