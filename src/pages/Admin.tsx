import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Database, Users, FileText, Building2,
  DollarSign, BarChart3, Settings, TrendingUp,
  Gem, Plus, LogOut, Bell, ShoppingBag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDashboardStats } from '../services/transactionService';
import type { DashboardStats } from '../types/pawnshop';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { supabase } from '../lib/supabase';
import { LanguageSwitcherDropdown } from '../components/LanguageSwitcher';
import MetalRateWidget from '../components/admin/MetalRateWidget';
import ThemeToggle from '../components/ThemeToggle';

// Import section components (we'll create these)
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
  const [selectedPawnRequest, setSelectedPawnRequest] = useState<any>(null); // Use proper type import if available

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
      toast.success(t('messages.logoutSuccess'));
    } catch (_error) {
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

      // Call the stored procedure via Supabase RPC
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
    { id: 'master' as TabType, label: t('admin.master'), icon: Database },
    { id: 'customer' as TabType, label: t('admin.customer'), icon: Users },
    { id: 'transaction' as TabType, label: t('admin.transaction'), icon: FileText },
    { id: 'bank' as TabType, label: t('admin.bank'), icon: Building2 },
    { id: 'accounts' as TabType, label: t('admin.accounts'), icon: DollarSign },
    { id: 'reports' as TabType, label: t('admin.reports'), icon: BarChart3 },
    { id: 'users' as TabType, label: 'Users', icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <Gem className="h-16 w-16 text-[var(--gold-primary)] animate-pulse mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      {/* Header */}
      <div className="bg-[var(--bg-card)] shadow-md border-b border-[var(--border-color)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gem className="h-8 w-8 text-[var(--gold-primary)]" />
              <div>
                <h1 className="text-2xl font-bold font-serif text-[var(--text-main)]">{t('admin.title')}</h1>
                <p className="text-sm text-[var(--text-secondary)]">{t('admin.subtitle')}</p>
              </div>
            </div>

            {/* User Info, Theme Toggle, Language Switcher and Logout */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LanguageSwitcherDropdown />
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[var(--text-main)]">{user.email}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{t('admin.administrator')}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-[var(--border-color)]"
                title={t('common.logout')}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">{t('common.logout')}</span>
              </button>
            </div>

            {/* Metal Rates Display */}
            <MetalRateWidget onRatesUpdated={loadDashboardData} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all whitespace-nowrap text-sm ${activeTab === tab.id
                    ? 'text-[var(--gold-primary)] border-b-2 border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-[var(--text-main)] mb-6">Dashboard Overview</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)] border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">Active Pledges</p>
                    <p className="text-3xl font-bold text-[var(--text-main)] mt-2 font-serif">{stats?.total_active_pledges || 0}</p>
                  </div>
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] p-3 rounded-full">
                    <FileText className="h-7 w-7 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)] border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">{t('admin.totalLoanAmount')}</p>
                    <p className="text-3xl font-bold text-[var(--text-main)] mt-2 font-serif">₹{(stats?.total_loan_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] p-3 rounded-full">
                    <DollarSign className="h-7 w-7 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)] border-l-4 border-l-[var(--gold-primary)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">{t('admin.totalCustomers')}</p>
                    <p className="text-3xl font-bold text-[var(--text-main)] mt-2 font-serif">{stats?.total_customers || 0}</p>
                  </div>
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] p-3 rounded-full">
                    <Users className="h-7 w-7 text-[var(--gold-primary)]" />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)] border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">{t('admin.cashInHand')}</p>
                    <p className="text-3xl font-bold text-[var(--text-main)] mt-2 font-serif">₹{(stats?.cash_in_hand || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] p-3 rounded-full">
                    <DollarSign className="h-7 w-7 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)]">
                <h3 className="text-xl font-bold font-serif text-[var(--text-main)] mb-4">{t('admin.todaysActivity')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)]">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-500/20 text-emerald-500 p-2 rounded-full border border-emerald-500/30">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-[var(--text-main)]">{t('admin.newPledges')}</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-500">{stats?.today_pledges || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)]">
                    <div className="flex items-center space-x-3">
                      <div className="bg-sky-500/20 text-sky-500 p-2 rounded-full border border-sky-500/30">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-[var(--text-main)]">{t('admin.returns')}</span>
                    </div>
                    <span className="text-2xl font-bold text-sky-500">{stats?.today_returns || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)]">
                <h3 className="text-xl font-bold font-serif text-[var(--text-main)] mb-4">{t('admin.quickActions')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('transaction')}
                    className="bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black p-4 rounded-lg font-semibold hover:brightness-105 transition-all shadow-md"
                  >
                    <Plus className="h-6 w-6 mx-auto mb-2" />
                    <span className="text-sm">{t('admin.newPledge')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('customer')}
                    className="bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--gold-primary)]/50 p-4 rounded-lg font-medium transition-all shadow-md"
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 text-[var(--gold-primary)]" />
                    <span className="text-sm">{t('admin.addCustomer')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className="bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--gold-primary)]/50 p-4 rounded-lg font-medium transition-all shadow-md"
                  >
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-[var(--gold-primary)]" />
                    <span className="text-sm">{t('admin.viewReports')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('master')}
                    className="bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--gold-primary)]/50 p-4 rounded-lg font-medium transition-all shadow-md"
                  >
                    <Settings className="h-6 w-6 mx-auto mb-2 text-[var(--gold-primary)]" />
                    <span className="text-sm">{t('admin.masterData')}</span>
                  </button>

                  <button
                    onClick={handleSendMonthlyNotifications}
                    disabled={sendingNotifications}
                    className="bg-[var(--bg-elevated)] border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 p-4 rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed col-span-2 font-medium"
                  >
                    <Bell className={`h-6 w-6 mx-auto mb-2 ${sendingNotifications ? 'animate-pulse' : ''}`} />
                    <span className="text-sm">
                      {sendingNotifications ? 'Sending...' : 'Send Monthly Notifications'}
                    </span>
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
      </div>
    </div >
  );
};

export default PawnshopAdmin;
