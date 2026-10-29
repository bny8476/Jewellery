import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Eye,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  History,
  MessageSquare,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { kycService } from '../../services/kycService';
import { useRealtimeEvent } from '../../services/realtimeService';
import { toast } from '../../utils/toast';
import type {
  KycStatus,
  CustomerKycRecord,
  KycAuditRecord,
  KycStats
} from '../../types/kyc';

export const KycAdminSection: React.FC = () => {
  const [records, setRecords] = useState<CustomerKycRecord[]>([]);
  const [stats, setStats] = useState<KycStats>({
    total: 0,
    pending: 0,
    under_review: 0,
    verified: 0,
    rejected: 0,
    action_required: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Record & Review Drawer
  const [selectedKyc, setSelectedKyc] = useState<CustomerKycRecord | null>(null);
  const [auditTrail, setAuditTrail] = useState<KycAuditRecord[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Action Dialog States
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionNotesError, setActionNotesError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch KYC queue
  const fetchKycList = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await kycService.getAdminKycList({
        status: statusFilter,
        search: searchQuery
      });
      setRecords(res.records);
      setStats(res.stats);
    } catch (err: any) {
      console.error('[Admin KYC] Failed to fetch:', err);
      toast.error('Failed to load KYC verification submissions');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchKycList();
  }, [fetchKycList]);

  // Real-time listener: refresh automatically when any KYC status updates
  useRealtimeEvent('customer.kyc.updated', () => {
    fetchKycList();
    if (selectedKyc) {
      loadKycDetail(selectedKyc.id);
    }
  });

  const loadKycDetail = async (id: string) => {
    try {
      setIsLoadingAudit(true);
      const res = await kycService.getAdminKycDetail(id);
      setSelectedKyc(res.kyc);
      setAuditTrail(res.audit);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load details:', err);
      toast.error('Failed to load full submission details');
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleStartReview = async (record: CustomerKycRecord) => {
    try {
      setIsProcessing(true);
      const res = await kycService.startReview(record.id);
      if (res.success) {
        toast.success(`Submission ${record.reference_id} marked as Under Review.`);
        await fetchKycList();
        await loadKycDetail(record.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start review');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedKyc) return;
    try {
      setIsProcessing(true);
      const res = await kycService.approveKyc(selectedKyc.id, approvalNotes);
      if (res.success) {
        toast.success(`KYC Approved! Customer is now a Verified Patron (${selectedKyc.reference_id}).`);
        setIsApproveOpen(false);
        setApprovalNotes('');
        await fetchKycList();
        await loadKycDetail(selectedKyc.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKyc) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setRejectError('A clear rejection reason is mandatory (at least 5 characters).');
      return;
    }
    setRejectError(null);

    try {
      setIsProcessing(true);
      const res = await kycService.rejectKyc(selectedKyc.id, rejectionReason.trim());
      if (res.success) {
        toast.success(`KYC Rejected. Customer has been notified with the reason.`);
        setIsRejectOpen(false);
        setRejectionReason('');
        await fetchKycList();
        await loadKycDetail(selectedKyc.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedKyc) return;
    if (!actionNotes.trim() || actionNotes.trim().length < 5) {
      setActionNotesError('Specific instructions for requested information are required.');
      return;
    }
    setActionNotesError(null);

    try {
      setIsProcessing(true);
      const res = await kycService.requestInfo(selectedKyc.id, actionNotes.trim());
      if (res.success) {
        toast.success(`Status updated to Action Required. Customer has been notified.`);
        setIsRequestInfoOpen(false);
        setActionNotes('');
        await fetchKycList();
        await loadKycDetail(selectedKyc.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to request information');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: KycStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Patron
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200 dark:bg-neutral-500/15 dark:text-neutral-400 dark:border-neutral-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> Not Submitted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-inter text-stone-900 dark:text-white tracking-wide">
                Customer KYC Verification Management
              </h1>
              <p className="text-xs text-stone-500 dark:text-neutral-400">
                Statutory patron identity compliance, PAN/Aadhaar verification, and review audit lifecycle
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchKycList}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-stone-700 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-neutral-700 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'ALL'
              ? 'bg-amber-50/70 dark:bg-neutral-800/80 border-amber-500/60 shadow-sm shadow-amber-500/5'
              : 'bg-white dark:bg-[#0D0D0D] border-stone-200 dark:border-neutral-800 hover:border-amber-400/50'
          }`}
        >
          <span className="text-[11px] font-medium text-stone-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
            Total Queue
          </span>
          <span className="text-2xl font-bold font-inter text-stone-900 dark:text-white">{stats.total}</span>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('PENDING_VERIFICATION')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'PENDING_VERIFICATION'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm shadow-amber-500/10'
              : 'bg-white dark:bg-[#0D0D0D] border-stone-200 dark:border-neutral-800 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-inter text-amber-700 dark:text-amber-300">{stats.pending}</span>
        </div>

        {/* Under Review */}
        <div
          onClick={() => setStatusFilter('UNDER_REVIEW')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'UNDER_REVIEW'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm shadow-blue-500/10'
              : 'bg-white dark:bg-[#0D0D0D] border-stone-200 dark:border-neutral-800 hover:border-blue-400/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">In Review</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-2xl font-bold font-inter text-blue-700 dark:text-blue-300">{stats.under_review}</span>
        </div>

        {/* Verified */}
        <div
          onClick={() => setStatusFilter('VERIFIED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'VERIFIED'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm shadow-emerald-500/10'
              : 'bg-white dark:bg-[#0D0D0D] border-stone-200 dark:border-neutral-800 hover:border-emerald-400/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Verified</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-inter text-emerald-700 dark:text-emerald-300">{stats.verified}</span>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm shadow-rose-500/10'
              : 'bg-white dark:bg-[#0D0D0D] border-stone-200 dark:border-neutral-800 hover:border-rose-400/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Rejected</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-2xl font-bold font-inter text-rose-700 dark:text-rose-300">{stats.rejected}</span>
        </div>

        {/* Action Required */}
        <div
          onClick={() => setStatusFilter('ACTION_REQUIRED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'ACTION_REQUIRED'
              ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 shadow-sm shadow-orange-500/10'
              : 'bg-white dark:bg-[#0D0D0D] border-stone-200 dark:border-neutral-800 hover:border-orange-400/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wider">Action Req</span>
            <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-2xl font-bold font-inter text-orange-700 dark:text-orange-300">{stats.action_required}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900/40 border border-stone-200 dark:border-neutral-800/80 rounded-xl shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, KYC reference, masked PAN..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-500/70 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400 dark:text-neutral-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg text-xs text-stone-800 dark:text-white focus:outline-none focus:border-amber-500/70 cursor-pointer transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified Patron</option>
            <option value="REJECTED">Rejected</option>
            <option value="ACTION_REQUIRED">Action Required</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-neutral-900/40 border border-stone-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400 dark:text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading KYC submissions...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-stone-300 dark:text-neutral-600 mx-auto" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-neutral-300">No KYC submissions found</h3>
            <p className="text-xs text-stone-500 dark:text-neutral-500">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Customer submissions will appear here for compliance review.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-neutral-800 bg-stone-50/90 dark:bg-neutral-900/80 text-stone-600 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">PAN Masked</th>
                  <th className="py-3 px-4">Aadhaar Masked</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/60">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-stone-900 dark:text-white block">
                          {record.legal_name || record.full_name}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-neutral-400 block font-mono">
                          {record.customer_code || record.customer_email || record.customer_id.slice(0, 12)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-700 dark:text-amber-400">
                      {record.reference_id}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-700 dark:text-neutral-300">
                      {record.pan_masked || record.pan_number_masked}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-700 dark:text-neutral-300">
                      {record.aadhaar_masked || record.aadhaar_number_masked}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 dark:text-neutral-400">
                      {record.submitted_at
                        ? new Date(record.submitted_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(record.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => loadKycDetail(record.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-neutral-700 border border-stone-200 dark:border-transparent text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>

                        {record.status === 'PENDING_VERIFICATION' && (
                          <button
                            onClick={() => handleStartReview(record)}
                            disabled={isProcessing}
                            title="Start Compliance Review"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {record.status !== 'VERIFIED' && (
                          <button
                            onClick={() => {
                              setSelectedKyc(record);
                              setIsApproveOpen(true);
                            }}
                            title="Approve KYC"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {record.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setSelectedKyc(record);
                              setIsRejectOpen(true);
                            }}
                            title="Reject KYC"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Drawer / Modal */}
      {isDrawerOpen && selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f1117] border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/15 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    KYC Compliance Review: {selectedKyc.legal_name || selectedKyc.full_name}
                  </h2>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-mono">
                    Reference: {selectedKyc.reference_id} &bull; {getStatusBadge(selectedKyc.status)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Identity Details Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-neutral-900/60 border border-stone-200 dark:border-neutral-800">
                <div>
                  <span className="text-stone-500 dark:text-neutral-500 block mb-1">Full Legal Name:</span>
                  <span className="font-semibold text-stone-900 dark:text-white text-sm">
                    {selectedKyc.legal_name || selectedKyc.full_name}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 dark:text-neutral-500 block mb-1">Date of Birth:</span>
                  <span className="font-medium text-stone-800 dark:text-neutral-200">
                    {selectedKyc.date_of_birth
                      ? new Date(selectedKyc.date_of_birth).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 dark:text-neutral-500 block mb-1">Masked PAN:</span>
                  <span className="font-mono font-semibold text-stone-800 dark:text-neutral-200">
                    {selectedKyc.pan_masked || selectedKyc.pan_number_masked}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 dark:text-neutral-500 block mb-1">Masked Aadhaar:</span>
                  <span className="font-mono font-semibold text-stone-800 dark:text-neutral-200">
                    {selectedKyc.aadhaar_masked || selectedKyc.aadhaar_number_masked}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 dark:text-neutral-500 block mb-1">Document Type:</span>
                  <span className="font-medium text-stone-800 dark:text-neutral-200">
                    {selectedKyc.document_type || selectedKyc.id_proof_type || 'Aadhaar Card'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 dark:text-neutral-500 block mb-1">DPDP Act Statutory Consent:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Consent Obtained &amp; Timestamped
                  </span>
                </div>
              </div>

              {/* Document Preview Section */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-neutral-900/60 border border-stone-200 dark:border-neutral-800 space-y-2">
                <span className="font-semibold text-stone-800 dark:text-neutral-300 block">Identity Document Attachment:</span>
                {selectedKyc.document_url ? (
                  <div className="space-y-2">
                    {selectedKyc.document_url.startsWith('data:image/') || selectedKyc.document_url.startsWith('http') ? (
                      <div className="max-h-60 rounded-lg overflow-hidden border border-stone-200 dark:border-neutral-700 bg-stone-100 dark:bg-black/40 flex items-center justify-center p-2">
                        <img
                          src={selectedKyc.document_url}
                          alt="Submitted Identity Proof"
                          className="max-h-56 max-w-full object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-stone-100 dark:bg-neutral-800/60 rounded-lg flex items-center justify-between text-stone-700 dark:text-neutral-300">
                        <span className="font-mono">{selectedKyc.document_type || 'Identity Proof PDF'}</span>
                        <a
                          href={selectedKyc.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Secure File
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-stone-500 dark:text-neutral-500 italic">No document image uploaded (Direct verification mode).</p>
                )}
              </div>

              {/* Status Specific Notes */}
              {selectedKyc.rejection_reason && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-1">
                  <span className="font-semibold block">Recorded Rejection Reason:</span>
                  <p className="text-rose-600 dark:text-rose-200/90">{selectedKyc.rejection_reason}</p>
                </div>
              )}

              {selectedKyc.action_required_notes && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
                  <span className="font-semibold block">Action Required Instructions:</span>
                  <p className="text-amber-700 dark:text-amber-200/90">{selectedKyc.action_required_notes}</p>
                </div>
              )}

              {/* Audit Trail Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-stone-800 dark:text-neutral-300 font-semibold">
                  <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Compliance Audit Trail</span>
                </div>

                {isLoadingAudit ? (
                  <div className="py-6 text-center text-stone-400 dark:text-neutral-500">Loading audit history...</div>
                ) : auditTrail.length === 0 ? (
                  <div className="p-3 bg-stone-50 dark:bg-neutral-900 rounded-lg text-stone-500 dark:text-neutral-500 text-center">
                    No status transition events logged yet.
                  </div>
                ) : (
                  <div className="space-y-2 border-l-2 border-stone-200 dark:border-neutral-800 pl-4 ml-2">
                    {auditTrail.map((audit) => (
                      <div key={audit.id} className="relative space-y-1">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <div className="flex items-center justify-between text-stone-500 dark:text-neutral-400">
                          <span className="font-semibold text-stone-900 dark:text-white">
                            {audit.from_status || audit.previous_status || 'INIT'} &rarr;{' '}
                            <span className="text-amber-700 dark:text-amber-400">{audit.to_status || audit.new_status}</span>
                          </span>
                          <span className="text-[10px]">
                            {new Date(audit.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-stone-600 dark:text-neutral-400 text-[11px]">
                          By:{' '}
                          <span className="text-stone-800 dark:text-neutral-300">
                            {audit.changed_by_name || audit.action_by || 'System / Compliance Officer'}
                          </span>
                        </p>
                        {(audit.change_reason || audit.notes) && (
                          <p className="text-stone-500 dark:text-neutral-500 italic text-[11px]">
                            &ldquo;{audit.change_reason || audit.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-4 bg-stone-50 dark:bg-neutral-900/80 border-t border-stone-200 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div>
                {selectedKyc.status === 'PENDING_VERIFICATION' && (
                  <button
                    onClick={() => handleStartReview(selectedKyc)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/40 dark:hover:bg-blue-600/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" /> Start Review
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsRequestInfoOpen(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-transparent hover:bg-stone-100 dark:hover:bg-neutral-700 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> Request Information
                </button>

                <button
                  onClick={() => setIsRejectOpen(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-600/20 dark:text-rose-300 dark:border-rose-500/40 dark:hover:bg-rose-600/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>

                <button
                  onClick={() => setIsApproveOpen(true)}
                  disabled={isProcessing || selectedKyc.status === 'VERIFIED'}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-xs hover:brightness-110 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Approve KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {isApproveOpen && selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1117] border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Confirm KYC Approval</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to approve KYC for{' '}
              <span className="font-semibold text-stone-900 dark:text-white">{selectedKyc.legal_name || selectedKyc.full_name}</span> (
              {selectedKyc.reference_id})? This will grant the patron Verified status for high-value transactions.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Approval Notes (Optional):
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Identity verified via document matching"
                className="w-full p-2.5 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirm &amp; Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Mandatory Reason */}
      {isRejectOpen && selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1117] border border-rose-200 dark:border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Reject KYC Submission</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-neutral-300 leading-relaxed">
              Please specify the reason for rejecting{' '}
              <span className="font-semibold text-stone-900 dark:text-white">{selectedKyc.legal_name || selectedKyc.full_name}</span>'s KYC.
              This reason will be provided to the patron so they can correct their information.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Mandatory Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectError(null);
                }}
                placeholder="e.g. Document image is blurry and unreadable; PAN name does not match legal name."
                className="w-full p-2.5 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                rows={3}
              />
              {rejectError && <p className="text-xs text-rose-500 mt-1">{rejectError}</p>}
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/20"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                <span>Reject Submission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Information Modal */}
      {isRequestInfoOpen && selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0f1117] border border-amber-200 dark:border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <MessageSquare className="w-6 h-6" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Request Information / Correction</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-neutral-300 leading-relaxed">
              Notify{' '}
              <span className="font-semibold text-stone-900 dark:text-white">{selectedKyc.legal_name || selectedKyc.full_name}</span> that
              additional information or a corrected document is required.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                Instructions for Patron <span className="text-amber-600 dark:text-amber-400">*</span>
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => {
                  setActionNotes(e.target.value);
                  setActionNotesError(null);
                }}
                placeholder="e.g. Please upload a clear color scan of your PAN card showing all four corners."
                className="w-full p-2.5 bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                rows={3}
              />
              {actionNotesError && <p className="text-xs text-rose-500 mt-1">{actionNotesError}</p>}
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRequestInfoOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestInfo}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Send Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
