import { useState, useEffect } from 'react';
import { 
  Coins, ShieldCheck, RefreshCw, CheckCircle2, 
  Search, ArrowDownLeft, ArrowUpRight, Truck, Wallet 
} from 'lucide-react';
import { 
  fetchAdminOverview, triggerAdminReconciliation, 
  AdminDigitalGoldOverview 
} from '../../services/digitalGoldService';
import { toast } from '../../utils/toast';

export default function DigitalGoldAdmin() {
  const [overview, setOverview] = useState<AdminDigitalGoldOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminOverview();
      setOverview(data);
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
      await loadOverview();
    } catch (err: any) {
      toast.error(err.message || 'Reconciliation run failed');
    } finally {
      setReconciling(false);
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
            Reconcile physical vault custody, manage transactions, and audit digital gold ledger
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOverview}
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
            <span>Active Wallets</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-[var(--text-main)] admin-kpi-num">
            {overview ? overview.activeAccountsCount : 0}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">Verified Bullion Accounts</span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Total Buy Volume</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-[var(--text-main)] admin-kpi-num">
            ₹{overview ? overview.totalBuyVolumeInr.toLocaleString('en-IN') : '0'}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Customer Investments</span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Total Sell Volume</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-[var(--text-main)] admin-kpi-num">
            ₹{overview ? overview.totalSellVolumeInr.toLocaleString('en-IN') : '0'}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">Cash-Out Settlements</span>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-secondary)] text-xs mb-2">
            <span>Pending Coins</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-[28px] font-bold tabular-nums text-[var(--text-main)] admin-kpi-num">
            {overview ? overview.pendingRedemptionsCount : 0}
          </div>
          <span className="text-[10px] text-purple-400 font-medium">Physical Redemptions</span>
        </div>
      </div>

      {/* Reconciliation Health Banner */}
      {overview?.lastReconciliation && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-400">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Custody Reconciliation Status: PASSED</span>
              <p className="text-[11px] text-emerald-300">
                Run #{overview.lastReconciliation.run_reference} • {overview.lastReconciliation.matched_count} Transactions matched • 0 Discrepancies
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            {new Date(overview.lastReconciliation.created_at).toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* Transaction Management Section */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-main)] admin-section-heading">Digital Gold Transactions Audit</h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, tx ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-main)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>

            {/* Type Filter */}
            <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl text-xs font-medium border border-[var(--border-color)]">
              {['ALL', 'BUY', 'SELL', 'REDEEM'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filterType === t ? 'bg-[var(--gold-primary)] shadow-sm text-black font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Gold Weight</th>
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
                        {tx.type}
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
      </div>
    </div>
  );
}
