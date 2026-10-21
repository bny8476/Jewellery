import { useState, useEffect } from 'react';
import { 
  Coins, ShieldCheck, RefreshCw, CheckCircle2, 
  Search, ArrowDownLeft, ArrowUpRight, Truck, Wallet,
  PackageCheck, Clock, ExternalLink, X, Send
} from 'lucide-react';
import { 
  fetchAdminOverview, triggerAdminReconciliation, 
  fetchAdminRedemptions, fulfillAdminRedemption,
  AdminDigitalGoldOverview 
} from '../../services/digitalGoldService';
import { toast } from '../../utils/toast';

export default function DigitalGoldAdmin() {
  const [overview, setOverview] = useState<AdminDigitalGoldOverview | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'REDEMPTIONS'>('TRANSACTIONS');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fulfillment Modal State
  const [fulfillingRedemption, setFulfillingRedemption] = useState<any | null>(null);
  const [carrierName, setCarrierName] = useState<string>('Sequel Logistics');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<'MINTING' | 'DISPATCHED' | 'DELIVERED'>('DISPATCHED');
  const [submittingFulfill, setSubmittingFulfill] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, redemptionsData] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminRedemptions().catch(() => [])
      ]);
      setOverview(overviewData);
      setRedemptions(redemptionsData || overviewData.allRedemptions || []);
    } catch (err: any) {
      console.error('Failed to load digital gold overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      const res = await triggerAdminReconciliation();
      toast.success(res.message);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Reconciliation run failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleFulfillSubmit = async () => {
    if (!fulfillingRedemption) return;
    if (targetStatus === 'DISPATCHED' && !trackingNumber.trim()) {
      toast.error('Please enter the courier AWB / tracking number.');
      return;
    }

    try {
      setSubmittingFulfill(true);
      await fulfillAdminRedemption({
        redemptionId: fulfillingRedemption.id,
        status: targetStatus,
        carrierName,
        trackingNumber: trackingNumber.trim()
      });
      toast.success(`Redemption updated to ${targetStatus}! Customer notified.`);
      setFulfillingRedemption(null);
      setTrackingNumber('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fulfillment');
    } finally {
      setSubmittingFulfill(false);
    }
  };

  const filteredTxns = (overview?.allTransactions || []).filter(tx => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch = !searchQuery || 
      tx.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.provider_tx_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.payment_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredRedemptions = redemptions.filter(r => {
    const matchesSearch = !searchQuery ||
      r.redemption_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.delivery_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
        <div>
          <h2 className="text-[26px] font-semibold text-[var(--text-main)] flex items-center gap-2 tracking-tight admin-page-heading">
            <Coins className="w-6 h-6 text-[var(--gold-primary)]" />
            Aura Gold™ Custody &amp; Bullion Operations
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Reconcile physical vault custody, manage transactions, dispatch minted coins, and audit the bullion ledger
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="px-4 py-2.5 bg-[var(--gold-primary)] text-black rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm font-medium"
          >
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>{reconciling ? 'Auditing Vault...' : 'Run Custody Reconciliation'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Vault Gold Backing</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-[var(--gold-primary)] admin-kpi-num">
            {overview ? overview.totalVaultGoldGrams.toFixed(4) : '0.0000'} <span className="text-xs font-normal text-[var(--text-secondary)]">g</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">100% IDBI/BRINKS Vault</span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Vault Silver Backing</span>
            <Coins className="w-4 h-4 text-gray-300" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-[var(--text-main)] admin-kpi-num">
            {overview?.totalVaultSilverGrams ? overview.totalVaultSilverGrams.toFixed(4) : '0.0000'} <span className="text-xs font-normal text-[var(--text-secondary)]">g</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Pure 999 Bullion</span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Active Wallets / SIPs</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-[var(--text-main)] admin-kpi-num">
            {overview ? overview.activeAccountsCount : 0}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">
            {overview?.activeSipPlansCount || 0} Systematic SIPs
          </span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Total Buy Volume</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[24px] font-bold tabular-nums text-[var(--text-main)] admin-kpi-num">
            ₹{overview ? overview.totalBuyVolumeInr.toLocaleString('en-IN') : '0'}
          </div>
          <span className="text-[10px] text-emerald-400">Allocated Purchases</span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Pending Dispatches</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-purple-400 admin-kpi-num">
            {overview ? overview.pendingRedemptionsCount : 0}
          </div>
          <span className="text-[10px] text-purple-400">Tamper-Proof CertiCards</span>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-[var(--bg-elevated)] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-[var(--gold-primary)] text-black shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              Transactions &amp; Ledger ({overview?.allTransactions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('REDEMPTIONS')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'REDEMPTIONS'
                  ? 'bg-[var(--gold-primary)] text-black shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Coin Redemptions &amp; Dispatch ({redemptions.length})
              {overview && overview.pendingRedemptionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-600 text-white font-bold ml-1">
                  {overview.pendingRedemptionsCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'TRANSACTIONS' && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[var(--gold-primary)]"
              >
                <option value="ALL">All Types</option>
                <option value="BUY">Buy Orders</option>
                <option value="SELL">Sell Backs</option>
                <option value="REDEEM">Coin Redemptions</option>
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, AWB, customer..."
                className="w-full bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[var(--gold-primary)] placeholder-[var(--text-secondary)]"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: TRANSACTIONS TABLE */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Metal / Type</th>
                  <th className="py-3 px-3">Weight</th>
                  <th className="py-3 px-3">Rate</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Provider Ref</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredTxns.length > 0 ? (
                  filteredTxns.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-3 font-mono font-medium text-[var(--gold-primary)]">{tx.transaction_reference}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          tx.type === 'SELL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {tx.metal_type === 'SILVER_999' ? 'SILVER ' : ''}{tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[var(--text-main)]">{Number(tx.grams).toFixed(4)}g</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">₹{Number(tx.rate_per_gram).toLocaleString('en-IN')}/g</td>
                      <td className="py-3 px-3 font-bold text-[var(--text-main)]">₹{Number(tx.total_amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 font-mono text-[var(--text-secondary)] text-[11px]">{tx.provider_tx_ref || 'N/A'}</td>
                      <td className="py-3 px-3 font-mono text-[var(--text-secondary)] text-[11px]">{tx.payment_id || 'PENDING'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[var(--text-secondary)] text-xs">
                      No transactions matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: COIN REDEMPTIONS & DISPATCH TABLE */}
        {activeTab === 'REDEMPTIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Order Ref</th>
                  <th className="py-3 px-3">Product Coin / Bar</th>
                  <th className="py-3 px-3">Weight</th>
                  <th className="py-3 px-3">Minting Fee</th>
                  <th className="py-3 px-3">Delivery Address</th>
                  <th className="py-3 px-3">Courier &amp; Tracking</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredRedemptions.length > 0 ? (
                  filteredRedemptions.map((rdm: any) => (
                    <tr key={rdm.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{new Date(rdm.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-3 font-mono font-medium text-[var(--gold-primary)]">{rdm.redemption_reference}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[var(--text-main)]">{rdm.product_name}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">{rdm.purity}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-[var(--text-main)]">{rdm.grams}g</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-400">₹{Number(rdm.minting_charges).toLocaleString('en-IN')}</span>
                        <div className="text-[9px] text-[var(--text-secondary)]">PAID via Razorpay</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-[var(--text-main)]">{rdm.delivery_name} ({rdm.delivery_phone})</div>
                        <div className="text-[10px] text-[var(--text-secondary)] truncate">
                          {rdm.delivery_address}, {rdm.city}, {rdm.state} - {rdm.pincode}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {rdm.tracking_number ? (
                          <div>
                            <div className="font-semibold text-[var(--text-main)] flex items-center gap-1">
                              <Truck className="w-3 h-3 text-blue-400" />
                              {rdm.carrier_name || 'Sequel Logistics'}
                            </div>
                            <div className="font-mono text-[10px] text-[var(--gold-primary)]">{rdm.tracking_number}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-400 italic">Pending Dispatch</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rdm.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          rdm.status === 'DISPATCHED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          rdm.status === 'MINTING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {rdm.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setFulfillingRedemption(rdm);
                            setCarrierName(rdm.carrier_name || 'Sequel Logistics');
                            setTrackingNumber(rdm.tracking_number || '');
                            setTargetStatus(rdm.status === 'REQUESTED' ? 'DISPATCHED' : rdm.status);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-color)] text-[var(--gold-primary)] text-xs font-semibold transition-colors border border-[var(--border-color)]"
                        >
                          Fulfill
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[var(--text-secondary)] text-xs">
                      No coin redemptions placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULFILLMENT MODAL */}
      {fulfillingRedemption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setFulfillingRedemption(null)}
              className="absolute top-4 right-4 p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-elevated)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-[var(--gold-primary)]">
              <Truck className="w-6 h-6" />
              <h3 className="font-serif font-bold text-lg text-[var(--text-main)]">
                Fulfill Minted Coin Dispatch
              </h3>
            </div>

            <div className="bg-[var(--bg-elevated)] p-3 rounded-xl text-xs space-y-1.5 mb-4 border border-[var(--border-color)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Reference:</span>
                <span className="font-mono font-bold text-[var(--gold-primary)]">{fulfillingRedemption.redemption_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Product:</span>
                <span className="font-semibold text-[var(--text-main)]">{fulfillingRedemption.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Customer:</span>
                <span className="text-[var(--text-main)]">{fulfillingRedemption.delivery_name} ({fulfillingRedemption.delivery_phone})</span>
              </div>
              <div className="text-[var(--text-secondary)] pt-1 text-[11px]">
                {fulfillingRedemption.delivery_address}, {fulfillingRedemption.city} - {fulfillingRedemption.pincode}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Fulfillment Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] text-xs rounded-xl p-2.5 focus:outline-none focus:border-[var(--gold-primary)]"
                >
                  <option value="MINTING">MINTING (Assaying at Refinery)</option>
                  <option value="DISPATCHED">DISPATCHED (In Armed Vault Transit)</option>
                  <option value="DELIVERED">DELIVERED (Signed by Customer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Vault Logistics Carrier
                </label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] text-xs rounded-xl p-2.5 focus:outline-none focus:border-[var(--gold-primary)]"
                >
                  <option value="Sequel Logistics">Sequel Global Precious Metals Logistics</option>
                  <option value="BlueDart Apex">BlueDart Apex Secured Bullion</option>
                  <option value="BVC Logistics">BVC Logistics Armored Courier</option>
                  <option value="Speed Post Insured">India Post Speed Post (Insured Article)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Air Waybill (AWB) / Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. SQL-987456123 or BD-88392100"
                  className="w-full bg-[var(--bg-elevated)] text-[var(--text-main)] border border-[var(--border-color)] text-xs rounded-xl p-2.5 focus:outline-none focus:border-[var(--gold-primary)] font-mono"
                />
              </div>

              <button
                onClick={handleFulfillSubmit}
                disabled={submittingFulfill}
                className="w-full py-3 bg-[var(--gold-primary)] text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                <Send className="w-4 h-4 text-black" />
                <span>{submittingFulfill ? 'Saving Dispatch...' : 'Update & Notify Customer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
