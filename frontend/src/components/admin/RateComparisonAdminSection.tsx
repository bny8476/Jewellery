import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, Plus, RefreshCw, CheckCircle2, AlertTriangle, 
  ExternalLink, Layers, Search, ShieldCheck, Filter, 
  Trash2, Edit, Check, X, Clock, Database, ChevronRight, Activity, Info
} from 'lucide-react';
import { 
  RateComparisonService, 
  ComparisonSource, 
  ProductMatch, 
  ComparisonSyncLog 
} from '../../services/rateComparisonService';
import { formatCurrencyINR } from '../../utils/formatters';
import { toast } from '../../utils/toast';

export const RateComparisonAdminSection: React.FC = () => {
  const [sources, setSources] = useState<ComparisonSource[]>([]);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [syncLogs, setSyncLogs] = useState<ComparisonSyncLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'matching' | 'logs'>('overview');

  // Filter & search
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add source modal
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState<boolean>(false);
  const [newSourceForm, setNewSourceForm] = useState({
    name: '',
    websiteUrl: '',
    integrationMethod: 'manual_entry' as 'manual_entry' | 'authorized_feed' | 'api',
    syncSchedule: 'Daily 10:00 AM IST'
  });

  // Review match modal
  const [selectedMatchForReview, setSelectedMatchForReview] = useState<ProductMatch | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Synchronizing source state
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);

  // Load admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sourcesRes, matchesRes, logsRes] = await Promise.all([
        RateComparisonService.getAdminSources(),
        RateComparisonService.getProductComparisons({ status: 'all' }),
        RateComparisonService.getSyncLogs()
      ]);

      setSources(sourcesRes.sources);
      setMatches(matchesRes.matches);
      setSyncLogs(logsRes);
    } catch (err) {
      console.error('Failed to load admin rate comparison data:', err);
      toast.error('Failed to load comparison records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // KPIs
  const totalSources = sources.length;
  const activeSources = sources.filter(s => s.isEnabled).length;
  const totalMatches = matches.length;
  const approvedMatches = matches.filter(m => m.matchStatus === 'approved').length;
  const pendingReviewMatches = matches.filter(m => m.matchStatus === 'pending').length;

  // Toggle Source Enabled
  const handleToggleSourceEnabled = async (source: ComparisonSource) => {
    const updated = await RateComparisonService.updateSource(source.id, { isEnabled: !source.isEnabled });
    if (updated) {
      setSources(prev => prev.map(s => s.id === source.id ? updated : s));
      toast.success(`${source.name} is now ${updated.isEnabled ? 'Active' : 'Disabled'}`);
    } else {
      toast.error('Failed to update source status');
    }
  };

  // Trigger Source Sync
  const handleTriggerSync = async (source: ComparisonSource) => {
    setSyncingSourceId(source.id);
    try {
      const ok = await RateComparisonService.triggerSourceSync(source.id);
      if (ok) {
        toast.success(`Synchronized ${source.name} successfully`);
        await loadData();
      } else {
        toast.error(`Sync failed for ${source.name}`);
      }
    } finally {
      setSyncingSourceId(null);
    }
  };

  // Submit Add Source
  const handleAddSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceForm.name.trim() || !newSourceForm.websiteUrl.trim()) {
      toast.error('Please enter retailer name and website URL');
      return;
    }

    const created = await RateComparisonService.createSource(newSourceForm);
    if (created) {
      setSources(prev => [...prev, created]);
      toast.success(`Configured new comparison source: ${created.name}`);
      setIsAddSourceModalOpen(false);
      setNewSourceForm({
        name: '',
        websiteUrl: '',
        integrationMethod: 'manual_entry',
        syncSchedule: 'Daily 10:00 AM IST'
      });
    } else {
      toast.error('Failed to create comparison source');
    }
  };

  // Submit Match Review (Approve/Reject)
  const handleReviewMatchSubmit = async (status: 'approved' | 'rejected') => {
    if (!selectedMatchForReview) return;
    const ok = await RateComparisonService.reviewProductMatch(
      selectedMatchForReview.id,
      status,
      reviewNotes || `Manual evaluation: marked as ${status}`
    );

    if (ok) {
      toast.success(`Product match ${status} successfully`);
      setSelectedMatchForReview(null);
      setReviewNotes('');
      await loadData();
    } else {
      toast.error('Failed to update match review status');
    }
  };

  // Filtered matches
  const filteredMatches = matches.filter(m => {
    if (matchStatusFilter !== 'all' && m.matchStatus !== matchStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${m.yazhiniProductName} ${m.yazhiniProductSku} ${m.matchedRetailerListing.name} ${m.matchedRetailerListing.sourceName}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] border border-[var(--gold-primary)]/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-inter text-[var(--text-main)]">
                Jewellery Rate Comparison & Market Intelligence
              </h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                ACTIVE AUDIT
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Configure comparison sources, verify market pricing parity, inspect craftsmanship fees, and manage product equivalence matches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddSourceModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[var(--gold-primary)] hover:bg-[var(--gold-light)] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Retailer Source</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-1 text-xs">
        {[
          { id: 'overview', label: 'Executive Overview', icon: Activity },
          { id: 'sources', label: `Retailer Sources (${totalSources})`, icon: Database },
          { id: 'matching', label: `Product Matches (${totalMatches})`, icon: Layers },
          { id: 'logs', label: 'Synchronization Audit Logs', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[var(--gold-primary)] text-slate-950 font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SCREEN A: OVERVIEW & KPIS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Configured Retailers</span>
              <div className="text-2xl font-bold font-mono text-[var(--gold-primary)]">{totalSources} Sources</div>
              <span className="text-[10px] text-emerald-400 font-mono">{activeSources} Active in Production</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Approved Matches</span>
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">{approvedMatches} Designs</div>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">Live on Customer Portal</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Pending Review</span>
              <div className="text-2xl font-bold font-mono text-amber-400">{pendingReviewMatches} Pairs</div>
              <span className="text-[10px] text-amber-400 font-mono">Awaiting Appraiser Audit</span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Sync Engine Health</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">100% Operational</div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Zero Critical Failures</span>
            </div>
          </div>

          {/* Quick Active Sources Snapshot */}
          <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
            <h3 className="font-inter font-bold text-sm text-[var(--text-main)]">
              Active Benchmark Competitor Feeds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sources.map(s => (
                <div key={s.id} className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--text-main)] truncate">{s.name}</span>
                    <span className={`w-2 h-2 rounded-full ${s.isEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">
                    Method: {s.integrationMethod.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Schedule: {s.syncSchedule}
                  </div>
                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-bold">{s.verifiedProductCount} Verified</span>
                    <button
                      type="button"
                      onClick={() => handleTriggerSync(s)}
                      disabled={syncingSourceId === s.id}
                      className="text-[10px] text-[var(--gold-primary)] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {syncingSourceId === s.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN B: RETAILER SOURCES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'sources' && (
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <h3 className="font-inter font-bold text-base text-[var(--text-main)]">
                Configured Comparison Sources & Retailers
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage authorized retailer integrations, verification schedules, and connection parameters.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Retailer Name</th>
                  <th className="py-2.5 px-3">Website URL</th>
                  <th className="py-2.5 px-3">Integration Mode</th>
                  <th className="py-2.5 px-3">Sync Schedule</th>
                  <th className="py-2.5 px-3">Verified Products</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {sources.map(source => (
                  <tr key={source.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[var(--text-main)]">{source.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[var(--text-secondary)]">
                      <a href={source.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold-primary)] flex items-center gap-1">
                        <span>{source.websiteUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] font-mono">
                        {source.integrationMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{source.syncSchedule}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      {source.verifiedProductCount} listings
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        source.isEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                      }`}>
                        {source.isEnabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerSync(source)}
                        disabled={syncingSourceId === source.id}
                        className="px-2.5 py-1 rounded bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/20 font-semibold text-[10px] cursor-pointer disabled:opacity-50"
                      >
                        {syncingSourceId === source.id ? 'Syncing...' : 'Sync'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSourceEnabled(source)}
                        className="px-2.5 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] text-[10px] cursor-pointer"
                      >
                        {source.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN C: PRODUCT MATCHING WORKFLOW */}
      {/* ========================================================================= */}
      {activeTab === 'matching' && (
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
            <div>
              <h3 className="font-inter font-bold text-base text-[var(--text-main)]">
                Product Equivalence Matches & Review Workflow
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Review proposed match pairs. Staff verification ensures fair comparisons based on purity, net weight, and specifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={matchStatusFilter}
                onChange={(e) => setMatchStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
              >
                <option value="all">All Match Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMatches.map(match => (
              <div
                key={match.id}
                className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--border-color)] bg-black shrink-0">
                    <img src={match.yazhiniImageUrl} alt={match.yazhiniProductName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[var(--text-main)]">{match.yazhiniProductName}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {match.yazhiniPurity} • {match.yazhiniNetWeight}g Net • ₹{match.yazhiniPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[var(--text-secondary)] max-w-sm">
                  <div className="font-semibold text-[11px] text-[var(--text-main)]">
                    Matched with: {match.matchedRetailerListing.name} ({match.matchedRetailerListing.sourceName})
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                    Weight: {match.matchedRetailerListing.netMetalWeight}g • Retailer: ₹{match.matchedRetailerListing.finalPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-semibold font-mono">
                      Confidence: {match.matchConfidenceScore}%
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      match.matchStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      match.matchStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {match.matchStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMatchForReview(match);
                      setReviewNotes(match.reviewNotes || '');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--gold-primary)]/40 bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] text-xs font-semibold hover:bg-[var(--gold-primary)]/20 transition-all cursor-pointer"
                  >
                    Audit & Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN D: SYNC AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <h3 className="font-inter font-bold text-base text-[var(--text-main)]">
                Synchronization & Price Verification Audit Logs
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Immutable record of feed imports, manual audits, and market observation updates.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Source Name</th>
                  <th className="py-2.5 px-3">Sync Type</th>
                  <th className="py-2.5 px-3">Items Processed</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {syncLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold font-sans text-[var(--text-main)]">{log.sourceName}</td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">{log.syncType}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{log.itemsUpdated} updated</td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">{log.durationMs}ms</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD RETAILER SOURCE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddSourceModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-inter font-bold text-base text-[var(--text-main)]">
                  Add Retailer Comparison Source
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSourceModalOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSourceSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Retailer Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSourceForm.name}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, name: e.target.value })}
                    placeholder="e.g. GRT Jewellers"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Official Website URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newSourceForm.websiteUrl}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, websiteUrl: e.target.value })}
                    placeholder="https://www.grtjewels.com"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Integration Method
                  </label>
                  <select
                    value={newSourceForm.integrationMethod}
                    onChange={(e) => setNewSourceForm({ ...newSourceForm, integrationMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
                  >
                    <option value="manual_entry">Manual Verified Entry</option>
                    <option value="authorized_feed">Authorized Product Feed</option>
                    <option value="api">Partner API Integration</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddSourceModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[var(--gold-primary)] text-slate-950 font-bold hover:bg-[var(--gold-light)]"
                  >
                    Save Source
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: REVIEW PRODUCT MATCH */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedMatchForReview && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-inter font-bold text-base text-[var(--text-main)]">
                  Appraise Product Equivalence Match
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedMatchForReview(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <div className="font-bold text-[var(--gold-primary)]">{selectedMatchForReview.yazhiniProductName}</div>
                  <div className="text-[var(--text-muted)] font-mono">
                    YAZHINI: {selectedMatchForReview.yazhiniNetWeight}g • {selectedMatchForReview.yazhiniPurity} • ₹{selectedMatchForReview.yazhiniPrice.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <div className="font-bold text-[var(--text-secondary)]">{selectedMatchForReview.matchedRetailerListing.name}</div>
                  <div className="text-[var(--text-muted)] font-mono">
                    {selectedMatchForReview.matchedRetailerListing.sourceName}: {selectedMatchForReview.matchedRetailerListing.netMetalWeight}g • {selectedMatchForReview.matchedRetailerListing.purity} • ₹{selectedMatchForReview.matchedRetailerListing.finalPrice.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                    Appraiser Audit Notes
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter valuation notes regarding purity, weight parity, and making fee difference..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleReviewMatchSubmit('rejected')}
                    className="px-4 py-2 rounded-lg bg-rose-600/20 border border-rose-600/40 text-rose-300 font-bold hover:bg-rose-600/30 cursor-pointer"
                  >
                    Reject Match
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMatchForReview(null)}
                      className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewMatchSubmit('approved')}
                      className="px-4 py-2 rounded-lg bg-[var(--gold-primary)] text-slate-950 font-bold hover:bg-[var(--gold-light)] cursor-pointer"
                    >
                      Approve & Publish Match
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RateComparisonAdminSection;
