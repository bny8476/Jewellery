import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, User, 
  AlertTriangle, Download, 
  RotateCcw, CreditCard, MessageSquare, Trash2,
  ChevronLeft, ChevronRight, CheckSquare, Square, 
  CheckCircle2, Clock, Crown, ArrowUpDown
} from 'lucide-react';
import { 
  getCustomers, getCustomerStats, archiveCustomer 
} from '../../services/customerService';
import type { Customer, CustomerStats, CustomerFilterOptions } from '../../types/pawnshop';
import { formatCurrencyINR } from '../../utils/formatters';
import { toast } from '../../utils/toast';
import { canPerformAction, getCurrentRole } from '../../utils/rbac';

// Sub-components & Modals
import { CustomerDashboardStats } from './CustomerCRM/CustomerDashboardStats';
import { CustomerProfileModal } from './CustomerCRM/CustomerProfileModal';
import { AddCustomerWizardModal } from './CustomerCRM/AddCustomerWizardModal';
import { CustomerRecordPaymentModal } from './CustomerCRM/CustomerRecordPaymentModal';
import { CustomerSendMessageModal } from './CustomerCRM/CustomerSendMessageModal';
import { CustomerImportExportModal } from './CustomerCRM/CustomerImportExportModal';

export const CustomerSection: React.FC = () => {
  const currentRole = getCurrentRole();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'retail' | 'wholesale' | 'vip' | 'hni' | 'loyal'>('all');
  const [kycFilter, setKycFilter] = useState<'all' | 'verified' | 'pending' | 'rejected' | 'expired'>('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState<'all' | 'Standard' | 'Silver' | 'Gold' | 'VIP'>('all');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'all' | 'active_loans' | 'overdue_loans' | 'no_loans'>('all');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);
  const [isRepeatOnly, setIsRepeatOnly] = useState(false);
  const [staffFilter, setStaffFilter] = useState('all');

  // Active dashboard stat filter tracking
  const [activeStatFilterKey, setActiveStatFilterKey] = useState<string>('all');

  // Selection & Bulk Actions
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'name' | 'code' | 'purchases' | 'balance' | 'date'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Modals
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<Customer | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedCustomerForMessage, setSelectedCustomerForMessage] = useState<Customer | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Archive Confirmation
  const [customerToArchive, setCustomerToArchive] = useState<Customer | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (filterOverrides?: CustomerFilterOptions) => {
    try {
      setLoading(true);
      const activeFilters: CustomerFilterOptions = filterOverrides || {
        searchTerm,
        category: categoryFilter,
        kyc_status: kycFilter,
        loyalty_tier: loyaltyFilter,
        loan_status: loanStatusFilter,
        has_balance: hasBalanceOnly,
        is_repeat: isRepeatOnly,
        assigned_staff: staffFilter
      };

      const [data, statsData] = await Promise.all([
        getCustomers(activeFilters),
        getCustomerStats()
      ]);

      setCustomers(data);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load CRM data:', err);
      toast.error('Failed to load customer directory');
    } finally {
      setLoading(false);
    }
  };

  // Stat card click filter handler
  const handleSelectStatFilter = (filterKey: string, options: Partial<CustomerFilterOptions>) => {
    setActiveStatFilterKey(filterKey);
    setCurrentPage(1);

    if (filterKey === 'all') {
      setCategoryFilter('all');
      setKycFilter('all');
      setLoyaltyFilter('all');
      setLoanStatusFilter('all');
      setHasBalanceOnly(false);
      setIsRepeatOnly(false);
      loadData({ searchTerm: '' });
      return;
    }

    if (options.category) setCategoryFilter(options.category);
    if (options.kyc_status) setKycFilter(options.kyc_status);
    if (options.loan_status) setLoanStatusFilter(options.loan_status);
    if (options.has_balance !== undefined) setHasBalanceOnly(options.has_balance);
    if (options.is_repeat !== undefined) setIsRepeatOnly(options.is_repeat);

    loadData({
      ...options,
      searchTerm
    });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setKycFilter('all');
    setLoyaltyFilter('all');
    setLoanStatusFilter('all');
    setHasBalanceOnly(false);
    setIsRepeatOnly(false);
    setStaffFilter('all');
    setActiveStatFilterKey('all');
    setCurrentPage(1);
    loadData({});
  };

  // Sorting
  const sortedCustomers = [...customers].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.full_name.localeCompare(b.full_name);
    } else if (sortField === 'code') {
      comparison = a.customer_code.localeCompare(b.customer_code);
    } else if (sortField === 'purchases') {
      comparison = (a.total_purchase_value || 0) - (b.total_purchase_value || 0);
    } else if (sortField === 'balance') {
      comparison = (a.outstanding_receivables || 0) - (b.outstanding_receivables || 0);
    } else {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortAsc ? comparison : -comparison;
  });

  // Pagination Slice
  const totalPages = Math.ceil(sortedCustomers.length / pageSize) || 1;
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection
  const handleToggleSelectAll = () => {
    if (selectedCustomerIds.length === paginatedCustomers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(paginatedCustomers.map(c => c.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirmArchive = async () => {
    if (!customerToArchive) return;
    try {
      await archiveCustomer(customerToArchive.id, 'Archived via administrative actions');
      toast.success(`Patron ${customerToArchive.full_name} archived`);
      setCustomerToArchive(null);
      loadData();
    } catch {
      toast.error('Failed to archive customer');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141416] via-[#161619] to-[#1F1C16] border border-amber-500/25 p-5 sm:p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <Crown className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-wide">
              Customer Relationship Management (CRM)
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            YAZHINI FINE JEWELS & PAWN SHOP • TRUST • TRADITION • TIMELESS BEAUTY • Complete Patron Lifecycle & Verification
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportExportOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Import / Export CSV</span>
          </button>

          <button
            onClick={() => loadData()}
            className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] text-xs transition-colors"
            title="Refresh Directory"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canPerformAction(currentRole, 'create_customer') && (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--gold-primary)] hover:brightness-105 text-stone-900 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(198,161,91,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Patron</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Dashboard Overview Cards (10 interactive metric cards) */}
      <CustomerDashboardStats
        stats={stats}
        activeFilter={activeStatFilterKey}
        onSelectFilter={handleSelectStatFilter}
        loading={loading}
      />

      {/* 2. Advanced Search & Multi-Filter Toolbar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        
        {/* Search Bar & Instant Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="Search by patron name, customer code (RCB-CUST-XXXX), phone, email, or Aadhaar/PAN..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-[var(--gold-primary)]/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-5 py-2 bg-[var(--gold-primary)] hover:brightness-105 text-stone-900 font-semibold rounded-xl text-xs transition-colors shrink-0"
            >
              Apply Search
            </button>
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)] rounded-xl border border-[var(--border-color)] text-xs transition-colors shrink-0"
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] gap-2.5 pt-2 border-t border-[var(--border-color)] text-xs">
          <div className="flex flex-col justify-end">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1 whitespace-nowrap" title="Classification">Classification</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as any);
                loadData({ category: e.target.value as any, searchTerm });
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--gold-primary)]/60"
            >
              <option value="all">All Categories</option>
              <option value="retail">Retail Patrons</option>
              <option value="vip">VIP (HNI Club)</option>
              <option value="loyal">Loyal Repeat</option>
              <option value="wholesale">Wholesale Bullion</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1 whitespace-nowrap" title="KYC Compliance">KYC Compliance</label>
            <select
              value={kycFilter}
              onChange={(e) => {
                setKycFilter(e.target.value as any);
                loadData({ kyc_status: e.target.value as any, searchTerm });
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--gold-primary)]/60"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1 whitespace-nowrap" title="Loyalty Tier">Loyalty Tier</label>
            <select
              value={loyaltyFilter}
              onChange={(e) => {
                setLoyaltyFilter(e.target.value as any);
                loadData({ loyalty_tier: e.target.value as any, searchTerm });
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--gold-primary)]/60"
            >
              <option value="all">All Reward Tiers</option>
              <option value="VIP">VIP Tier (4000+)</option>
              <option value="Gold">Gold Tier (2000+)</option>
              <option value="Silver">Silver Tier (500+)</option>
              <option value="Standard">Standard Tier</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1 whitespace-nowrap" title="Pawn Loan State">Pawn Loan State</label>
            <select
              value={loanStatusFilter}
              onChange={(e) => {
                setLoanStatusFilter(e.target.value as any);
                loadData({ loan_status: e.target.value as any, searchTerm });
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--gold-primary)]/60"
            >
              <option value="all">All Loan States</option>
              <option value="active_loans">Active Collateral Loans</option>
              <option value="overdue_loans">Overdue / Delinquent</option>
              <option value="no_loans">No Pawn Loans</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1 whitespace-nowrap" title="Relationship Officer">Relationship Officer</label>
            <select
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                loadData({ assigned_staff: e.target.value, searchTerm });
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--gold-primary)]/60"
            >
              <option value="all">All Staff</option>
              <option value="Lakshmi Narayanan">Lakshmi Narayanan</option>
              <option value="Senthil Kumar">Senthil Kumar</option>
              <option value="Kavitha Raman">Kavitha Raman</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div className="h-[34px] flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasBalanceOnly}
                  onChange={(e) => {
                    setHasBalanceOnly(e.target.checked);
                    loadData({ has_balance: e.target.checked, searchTerm });
                  }}
                  className="w-4 h-4 rounded accent-[var(--gold-primary)] bg-[var(--bg-elevated)] border-[var(--border-color)]"
                />
                <span className="text-[11px] text-[var(--gold-primary)] font-medium whitespace-nowrap">Pending Debt Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bulk Action Strip (When items selected) */}
        {selectedCustomerIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
            <span className="font-semibold">
              {selectedCustomerIds.length} patrons selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  toast.success(`Exporting ${selectedCustomerIds.length} selected patrons to CSV...`);
                }}
                className="px-3 py-1 bg-amber-400 text-black font-semibold rounded-lg text-xs"
              >
                Export Selected
              </button>
              <button
                onClick={() => {
                  const firstCust = customers.find(c => c.id === selectedCustomerIds[0]);
                  if (firstCust) {
                    setSelectedCustomerForMessage(firstCust);
                    setIsMessageModalOpen(true);
                  }
                }}
                className="px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg text-xs"
              >
                Send Bulk Message
              </button>
              <button
                onClick={() => setSelectedCustomerIds([])}
                className="text-[var(--text-secondary)] hover:text-[var(--text-main)] px-2"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3. Customer Directory Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden">
        
        {/* Table Sub-header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Showing <strong className="text-[var(--text-main)]">{sortedCustomers.length}</strong> registered patron records
          </span>

          {/* Column Sort Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[var(--text-muted)]">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] text-xs"
            >
              <option value="date">Registration Date</option>
              <option value="name">Patron Name</option>
              <option value="code">Customer Code</option>
              <option value="purchases">Total Purchases</option>
              <option value="balance">Outstanding Debt</option>
            </select>
            <button
              onClick={() => setSortAsc(prev => !prev)}
              className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              title="Toggle Asc/Desc"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)]/95 backdrop-blur-md border-b border-[var(--border-color)] text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-wider shadow-sm">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-gray-400 hover:text-amber-400">
                    {selectedCustomerIds.length === paginatedCustomers.length && paginatedCustomers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Patron Name & Code</th>
                <th className="py-3 px-4">Contact Telephony</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">KYC Compliance</th>
                <th className="py-3 px-4">Purchases (₹)</th>
                <th className="py-3 px-4">Pawn Loans</th>
                <th className="py-3 px-4">Pending Debt</th>
                <th className="py-3 px-4">Loyalty Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)] text-xs">
              {paginatedCustomers.map((cust) => {
                const isSelected = selectedCustomerIds.includes(cust.id);

                return (
                  <tr 
                    key={cust.id} 
                    className={`transition-colors duration-150 ${
                      isSelected 
                        ? 'bg-[var(--gold-primary)]/10' 
                        : 'hover:bg-[var(--gold-primary)]/[0.04]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleToggleSelectOne(cust.id)} className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)]">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[var(--gold-primary)]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Patron Name & Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {cust.full_name.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedCustomerForView(cust)}
                            className="font-semibold text-[var(--text-main)] hover:text-[var(--gold-primary)] text-left block transition-colors"
                          >
                            {cust.full_name}
                          </button>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-[var(--gold-primary)] font-medium">
                              {cust.customer_code}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">•</span>
                            <span className="text-[10px] uppercase text-purple-400">
                              {cust.category || 'Retail'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <span className="text-[var(--text-main)] block font-mono text-[11px]">{cust.phone}</span>
                      {cust.email && (
                        <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-[130px]">{cust.email}</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-[var(--text-secondary)]">
                      <span>{cust.city || 'Chennai'}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">{cust.state || 'Tamil Nadu'}</span>
                    </td>

                    {/* KYC Badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${
                        cust.kyc_status === 'verified'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : cust.kyc_status === 'pending'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      }`}>
                        {cust.kyc_status === 'verified' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {cust.kyc_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {cust.kyc_status || 'Pending'}
                      </span>
                    </td>

                    {/* Total Purchases */}
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-[var(--text-main)] block">
                        {formatCurrencyINR(cust.total_purchase_value || 0)}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {cust.total_purchases || 0} bills
                      </span>
                    </td>

                    {/* Pawn Loans */}
                    <td className="py-3 px-4 font-mono">
                      {(cust.active_pawn_loans || 0) > 0 ? (
                        <div>
                          <span className="font-bold text-amber-500 block">
                            {formatCurrencyINR(cust.outstanding_pawn_principal || 0)}
                          </span>
                          <span className="text-[10px] text-amber-400/80">
                            {cust.active_pawn_loans} active pledge
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] text-[11px]">—</span>
                      )}
                    </td>

                    {/* Pending Debt */}
                    <td className="py-3 px-4 font-mono">
                      {(cust.outstanding_receivables || 0) > 0 ? (
                        <span className="font-bold text-amber-400 block">
                          {formatCurrencyINR(cust.outstanding_receivables || 0)}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">Nil (Clear)</span>
                      )}
                    </td>

                    {/* Loyalty Tier */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-[var(--gold-primary)] block">{cust.loyalty_points || 0} pts</span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase">{cust.loyalty_tier || 'Standard'}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedCustomerForView(cust)}
                          className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--gold-primary)] hover:text-stone-900 text-[var(--text-secondary)] transition-colors"
                          title="View Complete Profile (14 Tabs)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCustomerForPayment(cust);
                            setIsPaymentModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-emerald-500 hover:text-white text-emerald-400 transition-colors"
                          title="Record Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCustomerForMessage(cust);
                            setIsMessageModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-blue-500 hover:text-white text-blue-400 transition-colors"
                          title="Dispatch Communication"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {canPerformAction(currentRole, 'archive_customer') && (
                          <button
                            onClick={() => setCustomerToArchive(cust)}
                            className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-rose-500 hover:text-white text-[var(--text-muted)] transition-colors"
                            title="Archive Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedCustomers.length === 0 && !loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] flex items-center justify-center mx-auto border border-[var(--gold-primary)]/20">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-main)]">No Matching Patrons Found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              No customer records matched your search parameters. Clear your filters or register a new patron.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[var(--gold-primary)] text-stone-900 font-semibold text-xs rounded-xl hover:brightness-105"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Table Footer with Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-elevated)] gap-3 text-xs text-[var(--text-secondary)]">
          <span>
            Page <strong className="text-[var(--text-main)]">{currentPage}</strong> of <strong className="text-[var(--text-main)]">{totalPages}</strong> (Total {sortedCustomers.length} patrons)
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. Complete Customer Profile Modal (14 Tabs) */}
      <CustomerProfileModal
        isOpen={!!selectedCustomerForView}
        customer={selectedCustomerForView}
        onClose={() => setSelectedCustomerForView(null)}
        onOpenPaymentModal={(cust) => {
          setSelectedCustomerForPayment(cust);
          setIsPaymentModalOpen(true);
        }}
        onOpenMessageModal={(cust) => {
          setSelectedCustomerForMessage(cust);
          setIsMessageModalOpen(true);
        }}
        onRefreshCustomer={() => loadData()}
      />

      {/* 5. 5-Step Add Customer Wizard Modal */}
      <AddCustomerWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCustomerCreated={(newCust) => {
          loadData();
          setSelectedCustomerForView(newCust);
        }}
      />

      {/* 6. Record Payment Modal */}
      <CustomerRecordPaymentModal
        isOpen={isPaymentModalOpen}
        customer={selectedCustomerForPayment}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedCustomerForPayment(null);
        }}
        onPaymentSuccess={() => loadData()}
      />

      {/* 7. Send Client Message Modal */}
      <CustomerSendMessageModal
        isOpen={isMessageModalOpen}
        customer={selectedCustomerForMessage}
        onClose={() => {
          setIsMessageModalOpen(false);
          setSelectedCustomerForMessage(null);
        }}
        onMessageSent={() => loadData()}
      />

      {/* 8. CSV Import & Export Modal */}
      <CustomerImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportComplete={() => loadData()}
        currentFilters={{
          searchTerm,
          category: categoryFilter,
          kyc_status: kycFilter,
          loyalty_tier: loyaltyFilter,
          loan_status: loanStatusFilter
        }}
      />

      {/* 9. Archive Confirmation Dialog */}
      {customerToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[var(--bg-card)] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-[var(--text-main)] text-base">Archive Patron Account?</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to archive patron <strong className="text-[var(--text-main)]">{customerToArchive.full_name} ({customerToArchive.customer_code})</strong>? The account will be marked inactive and blocked from new sales or loan disbursements.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCustomerToArchive(null)}
                className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)] rounded-xl text-xs hover:bg-[var(--bg-card)] border border-[var(--border-color)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmArchive}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs"
              >
                Archive Patron
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerSection;
