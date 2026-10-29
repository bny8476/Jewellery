import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Search, 
  RefreshCw, 
  Download, 
  Clock, 
  Send, 
  ShieldCheck, 
  FileText, 
  Eye, 
  DollarSign, 
  X, 
  Scale, 
  Lock,
  RotateCcw,
  Palette,
  Sliders,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  giftCardService, 
  GiftCardRecord, 
  AdminGiftCardDetailResponse, 
  AdminReconciliationReport,
  GiftCardDesign,
  GiftCardConfig
} from '../../services/giftCardService';
import { toast } from '../../utils/toast';
import { formatCurrencyINR } from '../../utils/formatters';

export default function GiftCardsAdminSection() {
  const [cards, setCards] = useState<GiftCardRecord[]>([]);
  const [stats, setStats] = useState({
    totalCardsSold: 0,
    totalValueIssued: 0,
    totalRedeemedValue: 0,
    outstandingLiability: 0,
    activeCardsCount: 0,
    fullyRedeemedCount: 0,
    suspendedCount: 0,
    currency: 'INR'
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sub-tabs: 'cards' | 'reconciliation' | 'designs' | 'config'
  const [adminSubTab, setAdminSubTab] = useState<'cards' | 'reconciliation' | 'designs' | 'config'>('cards');

  // Slide-over Detail Drawer
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardDetail, setCardDetail] = useState<AdminGiftCardDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Status Change Modal
  const [statusModalCard, setStatusModalCard] = useState<GiftCardRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>('ACTIVE');
  const [statusReason, setStatusReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Balance Adjustment Modal
  const [adjustModalCard, setAdjustModalCard] = useState<GiftCardRecord | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);

  // Refund / Cancellation Modal
  const [refundModalCard, setRefundModalCard] = useState<GiftCardRecord | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Reconciliation report state
  const [reconReport, setReconReport] = useState<AdminReconciliationReport | null>(null);
  const [loadingRecon, setLoadingRecon] = useState(false);

  // Designs state
  const [designs, setDesigns] = useState<GiftCardDesign[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [togglingDesignId, setTogglingDesignId] = useState<string | null>(null);

  // Configuration state
  const [config, setConfig] = useState<GiftCardConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editMinAmount, setEditMinAmount] = useState<number>(1000);
  const [editMaxAmount, setEditMaxAmount] = useState<number>(200000);
  const [editDenominationsStr, setEditDenominationsStr] = useState<string>('1000, 2500, 5000, 10000, 25000, 50000, 100000');
  const [editValidityDays, setEditValidityDays] = useState<number>(365);
  const [editAllowPartial, setEditAllowPartial] = useState<boolean>(true);

  const loadCards = async () => {
    try {
      setLoading(true);
      const res = await giftCardService.getAdminCards({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      if (res.success) {
        setCards(res.cards || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load admin gift cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReconciliation = async () => {
    try {
      setLoadingRecon(true);
      const res = await giftCardService.getAdminReconciliation();
      if (res.success) {
        setReconReport(res);
      }
    } catch (err: any) {
      console.warn('Failed to load reconciliation:', err);
    } finally {
      setLoadingRecon(false);
    }
  };

  const loadDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const res = await giftCardService.getDesigns();
      if (res.success && res.designs) {
        setDesigns(res.designs);
      }
    } catch (err: any) {
      toast.error('Failed to load design templates: ' + err.message);
    } finally {
      setLoadingDesigns(false);
    }
  };

  const handleToggleDesign = async (id: string, currentActive: boolean) => {
    try {
      setTogglingDesignId(id);
      const res = await giftCardService.updateDesignStatus(id, !currentActive);
      if (res.success) {
        toast.success(`Design template ${!currentActive ? 'activated' : 'deactivated'}.`);
        setDesigns(prev => prev.map(d => d.id === id ? { ...d, is_active: !currentActive } : d));
      } else {
        toast.error(res.error || 'Failed to update design status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating design');
    } finally {
      setTogglingDesignId(null);
    }
  };

  const loadConfigData = async () => {
    try {
      setLoadingConfig(true);
      const res = await giftCardService.getConfig();
      if (res.success && res.config) {
        setConfig(res.config);
        const minVal = Number(res.config.minAmount ?? res.config.min_amount ?? 1000);
        const maxVal = Number(res.config.maxAmount ?? res.config.max_amount ?? 200000);
        const rawDenoms = res.config.denominations ?? res.config.preset_denominations ?? [1000, 2500, 5000, 10000, 25000, 50000, 100000];
        const valDays = Number(res.config.validityDays ?? res.config.validity_days ?? 365);
        const allowPartial = Boolean(res.config.partialRedemptionEnabled ?? res.config.allow_partial_redemption ?? true);

        setEditMinAmount(!isNaN(minVal) ? minVal : 1000);
        setEditMaxAmount(!isNaN(maxVal) ? maxVal : 200000);
        setEditDenominationsStr(Array.isArray(rawDenoms) ? rawDenoms.join(', ') : '1000, 2500, 5000, 10000, 25000, 50000, 100000');
        setEditValidityDays(!isNaN(valDays) ? valDays : 365);
        setEditAllowPartial(allowPartial);
      }
    } catch (err: any) {
      toast.error('Failed to load policy configuration: ' + err.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const parsedDenoms = editDenominationsStr
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => !isNaN(n) && n > 0);

      const res = await giftCardService.updateConfig({
        minAmount: editMinAmount,
        maxAmount: editMaxAmount,
        denominations: parsedDenoms,
        validityDays: editValidityDays,
        partialRedemptionEnabled: editAllowPartial,
        min_amount: editMinAmount,
        max_amount: editMaxAmount,
        preset_denominations: parsedDenoms,
        validity_days: editValidityDays,
        allow_partial_redemption: editAllowPartial
      });

      if (res.success && res.config) {
        toast.success(res.message || 'Configuration updated successfully');
        setConfig(res.config);
      } else {
        toast.error(res.error || 'Failed to update configuration');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalCard) return;
    if (!refundReason.trim() || refundReason.trim().length < 5) {
      toast.error('A mandatory audit reason of at least 5 characters is required for refund / cancellation.');
      return;
    }

    try {
      setIsRefunding(true);
      const res = await giftCardService.refundCard(refundModalCard.id, refundReason.trim());
      if (res.success) {
        toast.success(res.message || 'Gift card refunded and liability reversed.');
        setRefundModalCard(null);
        setRefundReason('');
        loadCards();
        if (selectedCardId === refundModalCard.id) {
          handleOpenDetail(refundModalCard.id);
        }
      } else {
        toast.error(res.error || 'Failed to refund card');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing refund');
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [search, statusFilter]);

  useEffect(() => {
    if (adminSubTab === 'reconciliation') {
      loadReconciliation();
    } else if (adminSubTab === 'designs') {
      loadDesigns();
    } else if (adminSubTab === 'config') {
      loadConfigData();
    }
  }, [adminSubTab]);

  // Open detail drawer
  const handleOpenDetail = async (id: string) => {
    setSelectedCardId(id);
    try {
      setLoadingDetail(true);
      const res = await giftCardService.getAdminCardDetail(id);
      if (res.success) {
        setCardDetail(res);
      } else {
        toast.error('Unable to fetch card details');
      }
    } catch (err: any) {
      toast.error('Error fetching card detail: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Status Change Submit
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalCard) return;
    if (!statusReason.trim() || statusReason.trim().length < 5) {
      toast.error('A specific reason of at least 5 characters is required.');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const res = await giftCardService.updateAdminStatus(statusModalCard.id, newStatus, statusReason.trim());
      if (res.success) {
        toast.success(res.message || 'Status updated');
        setStatusModalCard(null);
        setStatusReason('');
        loadCards();
        if (selectedCardId === statusModalCard.id) {
          handleOpenDetail(statusModalCard.id);
        }
      } else {
        toast.error(res.error || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Balance Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalCard) return;
    const num = Number(adjustAmount);
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a positive numeric adjustment amount.');
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 5) {
      toast.error('A mandatory audit explanation of at least 5 characters is required.');
      return;
    }

    try {
      setIsAdjustingBalance(true);
      const res = await giftCardService.adjustAdminBalance(adjustModalCard.id, {
        adjustmentAmount: num,
        direction: adjustDirection,
        reason: adjustReason.trim()
      });
      if (res.success) {
        toast.success(res.message || 'Balance successfully adjusted');
        setAdjustModalCard(null);
        setAdjustAmount('');
        setAdjustReason('');
        loadCards();
        if (selectedCardId === adjustModalCard.id) {
          handleOpenDetail(adjustModalCard.id);
        }
      } else {
        toast.error(res.error || 'Failed to adjust balance');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing balance adjustment');
    } finally {
      setIsAdjustingBalance(false);
    }
  };

  // Resend email
  const handleResendDelivery = async (id: string, email: string) => {
    try {
      const res = await giftCardService.resendCard(id);
      if (res.success) {
        toast.success(res.message || `Delivery email resent to ${email}`);
      } else {
        toast.error(res.error || 'Resend failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error during resend');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (cards.length === 0) {
      toast.info('No gift card records to export.');
      return;
    }
    const headers = ['ID', 'Code', 'OriginalValue', 'CurrentBalance', 'Status', 'Recipient', 'Purchaser', 'IssuedDate', 'ExpiryDate'];
    const rows = cards.map(c => [
      c.id,
      c.code,
      c.original_value,
      c.current_balance,
      c.status,
      c.recipient_name,
      c.purchaser_name || c.purchaser_email || '',
      c.created_at,
      c.expires_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `YAZHINI_GiftCards_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Gift cards report exported successfully.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EAE5E6] dark:border-[#46343A] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-[10px] font-semibold tracking-widest uppercase mb-1">
            <Gift className="w-3.5 h-3.5" />
            FINANCIAL TREASURY & VALUE INSTRUMENTS
          </div>
          <h1 className="text-2xl sm:text-3xl font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4]">
            Gift Card Management & Ledger
          </h1>
          <p className="text-xs text-[#777174] dark:text-[#C1B4B8]">
            Authoritative financial issuance, status lifecycle, double-entry audit ledgers, and reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C9A45C] text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#C9A45C]" />
            Export Audit CSV
          </button>
          <button
            onClick={loadCards}
            disabled={loading}
            className="p-2 bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C9A45C] text-xs font-semibold rounded-xl flex items-center justify-center transition-all cursor-pointer"
            title="Reload Records"
          >
            <RefreshCw className={`w-4 h-4 text-[#C9A45C] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#777174] dark:text-[#C1B4B8]">
            Total Value Issued
          </span>
          <p className="text-2xl font-inter font-bold text-[#351018] dark:text-[#E6C687]">
            {formatCurrencyINR(stats.totalValueIssued)}
          </p>
          <p className="text-[10px] text-[#777174] dark:text-[#C1B4B8]">{stats.totalCardsSold} gift cards sold</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#777174] dark:text-[#C1B4B8]">
            Outstanding Liability
          </span>
          <p className="text-2xl font-inter font-bold text-amber-600 dark:text-amber-400">
            {formatCurrencyINR(stats.outstandingLiability)}
          </p>
          <p className="text-[10px] text-[#777174] dark:text-[#C1B4B8]">Unredeemed financial float</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#777174] dark:text-[#C1B4B8]">
            Total Redeemed Value
          </span>
          <p className="text-2xl font-inter font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrencyINR(stats.totalRedeemedValue)}
          </p>
          <p className="text-[10px] text-[#777174] dark:text-[#C1B4B8]">{stats.fullyRedeemedCount} fully spent cards</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#777174] dark:text-[#C1B4B8]">
            Active vs Suspended
          </span>
          <p className="text-2xl font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4]">
            {stats.activeCardsCount} <span className="text-xs text-[#777174]">Active</span> / {stats.suspendedCount} <span className="text-xs text-rose-600">Suspended</span>
          </p>
          <p className="text-[10px] text-[#777174] dark:text-[#C1B4B8]">Compliant with RBI PPI rules</p>
        </div>
      </div>

      {/* Sub Tabs: Cards View vs Reconciliation Report vs Designs vs Policy */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#EAE5E6] dark:border-[#46343A] pb-3 text-xs font-semibold">
        <button
          onClick={() => setAdminSubTab('cards')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            adminSubTab === 'cards'
              ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] font-bold shadow-sm'
              : 'text-[#777174] hover:text-[#241B1D] dark:text-[#C1B4B8] dark:hover:text-[#F8F3F4]'
          }`}
        >
          Gift Cards Registry ({cards.length})
        </button>
        <button
          onClick={() => setAdminSubTab('reconciliation')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'reconciliation'
              ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] font-bold shadow-sm'
              : 'text-[#777174] hover:text-[#241B1D] dark:text-[#C1B4B8] dark:hover:text-[#F8F3F4]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Double-Entry Reconciliation Report
        </button>
        <button
          onClick={() => setAdminSubTab('designs')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'designs'
              ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] font-bold shadow-sm'
              : 'text-[#777174] hover:text-[#241B1D] dark:text-[#C1B4B8] dark:hover:text-[#F8F3F4]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Design Templates Catalog
        </button>
        <button
          onClick={() => setAdminSubTab('config')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            adminSubTab === 'config'
              ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] font-bold shadow-sm'
              : 'text-[#777174] hover:text-[#241B1D] dark:text-[#C1B4B8] dark:hover:text-[#F8F3F4]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Configuration & Policies
        </button>
      </div>

      {/* VIEW A: REGISTRY TABLE */}
      {adminSubTab === 'cards' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777174]" />
              <input
                type="text"
                placeholder="Search code, purchaser, recipient..."
                value={search ?? ''}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] rounded-xl text-xs outline-none focus:border-[#C9A45C]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#777174]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] rounded-xl text-xs font-semibold outline-none focus:border-[#C9A45C] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PARTIALLY_REDEEMED">PARTIALLY REDEEMED</option>
                <option value="FULLY_REDEEMED">FULLY REDEEMED</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          {/* Cards Table */}
          <div className="bg-white dark:bg-[#1B1316] rounded-2xl border border-[#EAE5E6] dark:border-[#46343A] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F8] dark:bg-[#20171A] text-[#777174] dark:text-[#C1B4B8] font-mono uppercase tracking-wider text-[10px] border-b border-[#EAE5E6] dark:border-[#46343A]">
                  <tr>
                    <th className="p-4">Gift Card Code</th>
                    <th className="p-4">Purchaser / Recipient</th>
                    <th className="p-4">Original Value</th>
                    <th className="p-4">Current Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Issued On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5E6] dark:divide-[#46343A]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#777174]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C9A45C] mb-2" />
                        Loading database gift card ledger...
                      </td>
                    </tr>
                  ) : cards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#777174]">
                        No gift cards match current query.
                      </td>
                    </tr>
                  ) : (
                    cards.map((card) => (
                      <tr key={card.id} className="hover:bg-[#FAF9F8] dark:hover:bg-[#24191D] transition-colors">
                        <td className="p-4 font-mono font-bold text-[#351018] dark:text-[#E6C687]">
                          {card.maskedCode || card.code}
                          <span className="block text-[10px] font-sans font-normal text-[#777174] mt-0.5">
                            {card.card_type} • {card.design?.name || 'Heritage'}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] truncate max-w-[180px]">
                            {card.recipient_name}
                          </p>
                          <p className="text-[10px] text-[#777174] dark:text-[#C1B4B8] truncate max-w-[180px]">
                            {card.recipient_email}
                          </p>
                          <span className="text-[10px] text-[#777174] italic">
                            By {card.purchaser_name || 'Valued Patron'}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-[#241B1D] dark:text-[#F8F3F4]">
                          {formatCurrencyINR(card.original_value)}
                        </td>
                        <td className="p-4 font-bold font-inter text-base text-[#351018] dark:text-[#E6C687]">
                          {formatCurrencyINR(card.current_balance)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              card.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : card.status === 'PARTIALLY_REDEEMED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : card.status === 'FULLY_REDEEMED'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {card.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-[#777174] dark:text-[#C1B4B8] text-[11px]">
                          {new Date(card.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenDetail(card.id)}
                            className="p-1.5 rounded-lg border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C9A45C] text-[#C9A45C] transition-all cursor-pointer"
                            title="Inspect Ledger & Transactions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setStatusModalCard(card);
                              setNewStatus(card.status);
                              setStatusReason('');
                            }}
                            className="p-1.5 rounded-lg border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C9A45C] text-[#777174] hover:text-[#241B1D] dark:hover:text-[#F8F3F4] transition-all cursor-pointer"
                            title="Change Status"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustModalCard(card);
                              setAdjustAmount('');
                              setAdjustReason('');
                            }}
                            className="p-1.5 rounded-lg border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C9A45C] text-emerald-600 transition-all cursor-pointer"
                            title="Adjust Financial Balance"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                          {(card.status === 'ACTIVE' || card.status === 'PARTIALLY_REDEEMED') && (
                            <button
                              onClick={() => {
                                setRefundModalCard(card);
                                setRefundReason('');
                              }}
                              className="p-1.5 rounded-lg border border-[#EAE5E6] dark:border-[#46343A] hover:border-rose-500 text-rose-600 transition-all cursor-pointer"
                              title="Cancel & Refund Card"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {card.delivery_method === 'EMAIL' && (
                            <button
                              onClick={() => handleResendDelivery(card.id, card.recipient_email)}
                              className="p-1.5 rounded-lg border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C9A45C] text-blue-600 transition-all cursor-pointer"
                              title="Resend Notification"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: DOUBLE-ENTRY RECONCILIATION REPORT */}
      {adminSubTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Ledger-to-Cache Financial Balance Audit
              </h3>
              <p className="text-xs text-[#777174] dark:text-[#C1B4B8] mt-1">
                Compares the stored card balance against the mathematical sum of all immutable ledger transactions (Issuance, Redemptions, Adjustments).
              </p>
            </div>
            <button
              onClick={loadReconciliation}
              disabled={loadingRecon}
              className="px-4 py-2 bg-[#351018] dark:bg-[#C9A45C] text-[#E6C687] dark:text-[#351018] rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:opacity-90"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRecon ? 'animate-spin' : ''}`} />
              Run Audit Reconciliation
            </button>
          </div>

          {reconReport && (
            <div className="bg-white dark:bg-[#1B1316] rounded-2xl border border-[#EAE5E6] dark:border-[#46343A] overflow-hidden shadow-sm">
              <div className="p-4 bg-[#FAF9F8] dark:bg-[#20171A] border-b border-[#EAE5E6] dark:border-[#46343A] flex flex-wrap items-center justify-between text-xs gap-3">
                <span className="font-mono text-[#777174]">
                  Audited: {reconReport.totalCardsAudited} Cards • Discrepancies: {reconReport.totalDiscrepancies}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    reconReport.isSystemReconciled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {reconReport.isSystemReconciled ? '✓ SYSTEM FULLY RECONCILED (0 Discrepancy)' : '⚠ DISCREPANCIES DETECTED'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[#777174] dark:text-[#C1B4B8] font-mono uppercase tracking-wider text-[10px] border-b border-[#EAE5E6] dark:border-[#46343A]">
                    <tr>
                      <th className="p-4">Card Identifier</th>
                      <th className="p-4">Original Face Value</th>
                      <th className="p-4">Stored Balance</th>
                      <th className="p-4">Ledger Calculated Balance</th>
                      <th className="p-4">Variance</th>
                      <th className="p-4">Ledger Entries</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE5E6] dark:divide-[#46343A]">
                    {reconReport.rows.map((row) => (
                      <tr key={row.cardId} className="hover:bg-[#FAF9F8] dark:hover:bg-[#24191D]">
                        <td className="p-4 font-mono font-bold text-[#351018] dark:text-[#E6C687]">{row.code}</td>
                        <td className="p-4 font-medium">{formatCurrencyINR(row.originalValue)}</td>
                        <td className="p-4 font-bold font-inter">{formatCurrencyINR(row.storedBalance)}</td>
                        <td className="p-4 font-mono font-bold text-emerald-600">{formatCurrencyINR(row.ledgerCalculatedBalance)}</td>
                        <td className="p-4 font-mono font-bold">
                          {row.isBalanced ? (
                            <span className="text-emerald-600">₹0 (Matched)</span>
                          ) : (
                            <span className="text-rose-600">₹{row.discrepancy.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="p-4 text-[#777174]">{row.transactionCount} transactions</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 dark:bg-white/10 uppercase">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW C: DESIGN TEMPLATES CATALOG */}
      {adminSubTab === 'designs' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#C9A45C]" />
                Artisan Design Catalog & Occasion Collections
              </h3>
              <p className="text-xs text-[#777174] dark:text-[#C1B4B8] mt-1">
                Manage 8 distinct luxury jewellery artwork designs. Administrators can toggle card availability across customer storefronts.
              </p>
            </div>
            <button
              onClick={loadDesigns}
              disabled={loadingDesigns}
              className="px-4 py-2 bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C9A45C] text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C9A45C] ${loadingDesigns ? 'animate-spin' : ''}`} />
              Reload Designs
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {designs.map((design) => {
              const isToggling = togglingDesignId === design.id;
              const isActive = design.is_active !== false;

              return (
                <div
                  key={design.id}
                  className="bg-white dark:bg-[#1B1316] rounded-2xl border border-[#EAE5E6] dark:border-[#46343A] overflow-hidden shadow-sm hover:border-[#C9A45C]/50 transition-all flex flex-col justify-between"
                >
                  <div
                    className="p-5 h-36 relative overflow-hidden flex flex-col justify-between text-white"
                    style={{ background: design.bgGradient }}
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <span className="text-[9px] font-inter uppercase tracking-[0.25em] text-[#E6C687] font-bold">
                        YAZHINI
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-rose-500/90 text-white'
                        }`}
                      >
                        {isActive ? 'Published' : 'Unpublished'}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <p className="font-inter font-bold text-sm text-white drop-shadow-sm truncate">
                        {design.name}
                      </p>
                      <p className="text-[10px] text-white/80 truncate">{design.tagline}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#777174] dark:text-[#C1B4B8] block mb-1">
                        Supported Occasions
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {design.occasions.map((occ) => (
                          <span
                            key={occ}
                            className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10px] text-[#777174] dark:text-[#C1B4B8]"
                          >
                            {occ}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#EAE5E6] dark:border-[#46343A] flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#777174]">
                        Storefront Status
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDesign(design.id, isActive)}
                        disabled={isToggling}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {isToggling ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : isActive ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Unpublish</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Publish</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW D: CONFIGURATION & TREASURY POLICIES */}
      {adminSubTab === 'config' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] space-y-2">
            <h3 className="text-lg font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#C9A45C]" />
              Gift Card Treasury & Redemption Policy
            </h3>
            <p className="text-xs text-[#777174] dark:text-[#C1B4B8]">
              Backend-enforced parameters for card denominations, issuance limits, validity lifespan, and partial redemptions.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] space-y-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1.5 uppercase tracking-wider">
                  Minimum Purchase Value (INR)
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  required
                  value={editMinAmount ?? ''}
                  onChange={(e) => setEditMinAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent text-xs font-semibold outline-none focus:border-[#C9A45C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1.5 uppercase tracking-wider">
                  Maximum Purchase Value (INR)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={editMaxAmount ?? ''}
                  onChange={(e) => setEditMaxAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent text-xs font-semibold outline-none focus:border-[#C9A45C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1.5 uppercase tracking-wider">
                Preset Denominations (Comma-separated values in INR)
              </label>
              <input
                type="text"
                required
                value={editDenominationsStr ?? ''}
                onChange={(e) => setEditDenominationsStr(e.target.value)}
                placeholder="1000, 2500, 5000, 10000, 25000, 50000, 100000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent text-xs font-semibold outline-none focus:border-[#C9A45C]"
              />
              <span className="text-[10px] text-[#777174] mt-1 block">
                Customers will be able to select any of these quick-select chips on the store purchase page.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1.5 uppercase tracking-wider">
                  Card Validity Lifespan (Days)
                </label>
                <input
                  type="number"
                  min={30}
                  max={3650}
                  required
                  value={editValidityDays ?? ''}
                  onChange={(e) => setEditValidityDays(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent text-xs font-semibold outline-none focus:border-[#C9A45C]"
                />
                <span className="text-[10px] text-[#777174] mt-1 block">
                  365 days = 1 year from issuance date (standard RBI PPI guidelines).
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1.5 uppercase tracking-wider">
                  Partial Redemption Allowed
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editAllowPartial)}
                    onChange={(e) => setEditAllowPartial(e.target.checked)}
                    className="w-4 h-4 text-[#C9A45C] rounded border-[#EAE5E6] focus:ring-[#C9A45C]"
                  />
                  <span className="text-xs font-semibold text-[#241B1D] dark:text-[#F8F3F4]">
                    Permit patrons to spend balances over multiple checkout visits
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAE5E6] dark:border-[#46343A] flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-3 bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] rounded-xl font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {savingConfig ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Policy Updates...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Policy Configuration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL SLIDE-OVER DRAWER */}
      {selectedCardId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-[#1B1316] h-full shadow-2xl overflow-y-auto p-6 sm:p-8 space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-[#EAE5E6] dark:border-[#46343A] pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#777174]">Card Audit Dossier</span>
                <h3 className="text-xl font-inter font-bold text-[#351018] dark:text-[#E6C687]">
                  {cardDetail?.card.code || 'Loading...'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedCardId(null);
                  setCardDetail(null);
                }}
                className="p-2 rounded-xl text-[#777174] hover:text-[#241B1D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail || !cardDetail ? (
              <div className="py-16 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C9A45C]" />
                <p className="text-xs text-[#777174]">Decrypting ledger history...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Snapshot card */}
                <div className="p-4 rounded-2xl bg-[#C9A45C]/10 border border-[#C9A45C]/30 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#777174] block">Available Balance</span>
                    <span className="text-xl font-inter font-bold text-[#351018] dark:text-[#E6C687]">
                      {formatCurrencyINR(cardDetail.card.current_balance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#777174] block">Face Value</span>
                    <span className="text-sm font-bold text-[#241B1D] dark:text-[#F8F3F4]">
                      {formatCurrencyINR(cardDetail.card.original_value)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#777174] block">Recipient</span>
                    <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] block truncate">
                      {cardDetail.card.recipient_name}
                    </span>
                    <span className="text-[10px] text-[#777174] block truncate">
                      {cardDetail.card.recipient_email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#777174] block">Status</span>
                    <span className="font-bold text-emerald-600">{cardDetail.card.status}</span>
                  </div>
                </div>

                {/* Ledger Transactions */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#777174] mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
                    Transaction Ledger ({cardDetail.transactions.length})
                  </h4>
                  <div className="space-y-2">
                    {cardDetail.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-[#FAF9F8] dark:bg-[#20171A] flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-[#241B1D] dark:text-[#F8F3F4]">
                            {tx.transaction_type}: {tx.reason}
                          </p>
                          <p className="text-[10px] text-[#777174]">
                            {tx.order_number ? `Order: ${tx.order_number} • ` : ''}
                            Actor: {tx.authorized_actor || 'SYSTEM'} • {new Date(tx.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold ${
                              tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.amount > 0 ? `+${formatCurrencyINR(tx.amount)}` : `-${formatCurrencyINR(Math.abs(tx.amount))}`}
                          </span>
                          <span className="block text-[10px] text-[#777174]">
                            Bal: {formatCurrencyINR(tx.balance_after)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Logs */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#777174] mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#C9A45C]" />
                    Administrative Audit Trail ({cardDetail.auditLogs.length})
                  </h4>
                  <div className="space-y-2">
                    {cardDetail.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-white dark:bg-[#1B1316] text-[11px] space-y-1"
                      >
                        <div className="flex justify-between items-center font-semibold">
                          <span className="text-[#351018] dark:text-[#E6C687]">{log.action}</span>
                          <span className="text-[#777174] text-[10px]">
                            {new Date(log.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[#777174]">
                          Actor: <span className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">{log.actor}</span>
                          {log.ip_address ? ` (${log.ip_address})` : ''}
                        </p>
                        {log.details && (
                          <pre className="p-2 rounded bg-black/5 dark:bg-black/40 text-[10px] overflow-x-auto text-[#777174]">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {statusModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1B1316] p-6 rounded-3xl border border-[#EAE5E6] dark:border-[#46343A] max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-inter font-bold text-lg text-[#241B1D] dark:text-[#F8F3F4]">
              Change Gift Card Status
            </h3>
            <p className="text-xs text-[#777174]">
              Modifying status for <span className="font-mono font-bold text-[#C9A45C]">{statusModalCard.code}</span>
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#777174] mb-1 font-semibold">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent outline-none focus:border-[#C9A45C] font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Spendable)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily Blocked)</option>
                  <option value="CANCELLED">CANCELLED (Revoked)</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              <div>
                <label className="block text-[#777174] mb-1 font-semibold">Mandatory Reason (Audit Log) *</label>
                <textarea
                  required
                  rows={3}
                  value={statusReason ?? ''}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="State the regulatory or operational reason for this status change..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent outline-none focus:border-[#C9A45C] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalCard(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] text-[#777174] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="flex-1 py-2.5 rounded-xl bg-[#351018] dark:bg-[#C9A45C] text-[#E6C687] dark:text-[#351018] font-bold cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Confirm Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BALANCE ADJUSTMENT MODAL */}
      {adjustModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1B1316] p-6 rounded-3xl border border-[#EAE5E6] dark:border-[#46343A] max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-inter font-bold text-lg text-[#241B1D] dark:text-[#F8F3F4]">
              Manual Financial Balance Adjustment
            </h3>
            <p className="text-xs text-[#777174]">
              Current Balance on <span className="font-mono font-bold text-[#C9A45C]">{adjustModalCard.code}</span>:{' '}
              <span className="font-inter font-bold text-base text-[#241B1D] dark:text-[#F8F3F4]">
                {formatCurrencyINR(adjustModalCard.current_balance)}
              </span>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustDirection('CREDIT')}
                  className={`py-2 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                    adjustDirection === 'CREDIT'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-[#EAE5E6] dark:border-[#46343A] text-[#777174]'
                  }`}
                >
                  + Credit Balance
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustDirection('DEBIT')}
                  className={`py-2 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                    adjustDirection === 'DEBIT'
                      ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                      : 'border-[#EAE5E6] dark:border-[#46343A] text-[#777174]'
                  }`}
                >
                  - Debit Balance
                </button>
              </div>

              <div>
                <label className="block text-[#777174] mb-1 font-semibold">Adjustment Amount (INR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 2500"
                  value={adjustAmount ?? ''}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent outline-none focus:border-[#C9A45C] font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block text-[#777174] mb-1 font-semibold">
                  Mandatory Audit & Accounting Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason ?? ''}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Explain why this balance adjustment is being made (e.g. Concierge goodwill credit, manual reversal of duplicate redemption)..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent outline-none focus:border-[#C9A45C] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalCard(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] text-[#777174] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingBalance}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] font-bold cursor-pointer hover:opacity-95 disabled:opacity-50 shadow-md"
                >
                  {isAdjustingBalance ? 'Posting to Ledger...' : 'Commit Ledger Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFUND / CANCELLATION MODAL */}
      {refundModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1B1316] rounded-2xl max-w-md w-full border border-[#EAE5E6] dark:border-[#46343A] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EAE5E6] dark:border-[#46343A] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="font-inter font-bold text-base text-[#241B1D] dark:text-[#F8F3F4]">
                  Cancel &amp; Refund Gift Card
                </h3>
              </div>
              <button
                onClick={() => setRefundModalCard(null)}
                className="p-1 rounded-lg text-[#777174] hover:text-[#241B1D] dark:hover:text-[#F8F3F4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Financial Liability Reversal
              </div>
              <p>
                Card <span className="font-mono font-bold">{refundModalCard.code}</span> will be marked as <strong>CANCELLED</strong>. Its spendable balance of <strong>{formatCurrencyINR(refundModalCard.current_balance)}</strong> will be zeroed and debited from the Deferred Revenue Ledger.
              </p>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#777174] mb-1 font-semibold">
                  Mandatory Audit &amp; Compliance Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundReason ?? ''}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why this card is being cancelled/refunded (e.g. Patron requested order return, duplicate purchase refund, chargeback dispute)..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-transparent outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalCard(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] text-[#777174] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  {isRefunding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reversing Liability...</span>
                    </>
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
